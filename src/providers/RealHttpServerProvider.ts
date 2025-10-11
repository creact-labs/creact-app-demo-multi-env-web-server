import { ICloudProvider, CloudDOMNode, DriftDetectionResult } from '@creact-labs/creact';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

export class RealHttpServerProvider implements ICloudProvider {
    private processes: Map<string, ChildProcess> = new Map();
    private cleanupRegistered = false;
    private backendProvider: any;

    constructor(backendProvider?: any) {
        this.backendProvider = backendProvider;
        this.registerCleanupHandlers();
    }

    /**
     * Detect drift for a resource
     * Checks if the resource's actual state matches expected state
     */
    async detectDrift(node: CloudDOMNode): Promise<DriftDetectionResult> {
        // Only check HttpServer resources
        if (node.constructType !== 'HttpServer') {
            return {
                nodeId: node.id,
                hasDrifted: false,
                timestamp: Date.now(),
            };
        }

        // Check if server is actually running
        const expectedPort = node.outputs?.port;
        if (!expectedPort) {
            return {
                nodeId: node.id,
                hasDrifted: false,
                timestamp: Date.now(),
            };
        }

        const isAlive = await this.checkServerAlive(expectedPort);
        
        return {
            nodeId: node.id,
            hasDrifted: !isAlive,
            expectedState: node.outputs,
            actualState: isAlive ? node.outputs : null,
            driftDescription: isAlive ? undefined : `Server not responding on port ${expectedPort}`,
            timestamp: Date.now(),
        };
    }

    /**
     * Refresh resource state from actual cloud provider
     * Updates node outputs to reflect reality
     */
    async refreshState(node: CloudDOMNode): Promise<void> {
        // Only refresh HttpServer resources
        if (node.constructType !== 'HttpServer') {
            return;
        }

        const expectedPort = node.outputs?.port;
        if (!expectedPort) {
            return;
        }

        const isAlive = await this.checkServerAlive(expectedPort);
        
        if (!isAlive) {
            console.log(`[HttpServer]   🔄 Clearing stale outputs for: ${node.id}`);
            // Clear outputs to force redeployment
            node.outputs = undefined;
        }
    }

    private registerCleanupHandlers(): void {
        if (this.cleanupRegistered) return;
        this.cleanupRegistered = true;

        // Cleanup on process exit
        const cleanup = () => {
            console.log('\n[HttpServer] 🛑 Process exiting, stopping all servers...');
            for (const [id, process] of this.processes.entries()) {
                try {
                    process.kill('SIGTERM');
                    console.log(`[HttpServer]   ✓ Stopped server: ${id}`);
                } catch (err) {
                    // Process might already be dead
                }
            }
            this.processes.clear();
        };

        process.on('exit', cleanup);
        process.on('SIGINT', () => {
            cleanup();
            process.exit(0);
        });
        process.on('SIGTERM', () => {
            cleanup();
            process.exit(0);
        });
    }

    async preDeploy(nodes: CloudDOMNode[]): Promise<void> {
        console.log(`\n[HttpServer] � Checking  for stale server state...`);

        for (const node of nodes) {
            if (node.constructType === 'HttpServer' && node.outputs?.port) {
                const isAlive = await this.checkServerAlive(node.outputs.port);
                if (!isAlive) {
                    console.log(`[HttpServer]   ⚠️  Server at port ${node.outputs.port} is not responding (stale state)`);
                    console.log(`[HttpServer]   🔄 Clearing outputs for: ${node.id}`);
                    // Clear outputs to force redeployment
                    node.outputs = undefined;
                }
            }
        }
    }

    private async checkServerAlive(port: number): Promise<boolean> {
        try {
            await new Promise<void>((resolve, reject) => {
                const req = http.get(`http://localhost:${port}`, (res) => {
                    resolve();
                });
                req.on('error', reject);
                req.setTimeout(1000);
            });
            return true;
        } catch (err) {
            return false;
        }
    }

    async materialize(nodes: CloudDOMNode[]): Promise<void> {
        console.log(`\n[HttpServer] 🚀 Deploying ${nodes.length} resources...`);

        for (const node of nodes) {
            console.log(`[HttpServer] 📦 ${node.constructType}: ${node.id}`);

            if (node.constructType === 'HttpServer') {
                await this.deployHttpServer(node);
            } else if (node.constructType === 'StaticSite') {
                await this.deployStaticSite(node);
            }

            console.log(`[HttpServer]   ✓ Outputs:`, node.outputs);
        }

        console.log(`[HttpServer] ✅ All resources deployed\n`);
    }

    private async deployHttpServer(node: CloudDOMNode): Promise<void> {
        const { port = 8080, contentPath } = node.props;

        // Check if server already exists and is still running
        const existingProcess = this.processes.get(node.id);
        if (existingProcess && !existingProcess.killed) {
            console.log(`[HttpServer]   ℹ Server already running on port ${port}`);
            node.outputs = {
                url: `http://localhost:${port}`,
                port: port,
                status: 'running',
            };
            return;
        }

        // Clean up stale process reference
        if (existingProcess) {
            this.processes.delete(node.id);
        }

        // Spawn http-server process
        const serverProcess = spawn('npx', ['http-server', contentPath || '.', '-p', String(port), '-c-1'], {
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false,
        });

        // Wait for server to be ready
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Server startup timeout'));
            }, 10000);

            serverProcess.stdout?.on('data', (data) => {
                const output = data.toString();
                console.log(`[HttpServer]   ${output.trim()}`);

                if (output.includes('Hit CTRL-C to stop') || output.includes('Available on')) {
                    clearTimeout(timeout);
                    resolve();
                }
            });

            serverProcess.stderr?.on('data', (data) => {
                console.error(`[HttpServer]   ✗ ${data.toString().trim()}`);
            });

            serverProcess.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });

            serverProcess.on('exit', (code) => {
                if (code !== 0 && code !== null) {
                    clearTimeout(timeout);
                    reject(new Error(`Server exited with code ${code}`));
                }
            });
        });

        // Verify server is responding
        await this.waitForServer(port);

        // Store process reference
        this.processes.set(node.id, serverProcess);

        console.log(`[HttpServer]   ✓ Server started on http://localhost:${port}`);

        // Set outputs
        node.outputs = {
            url: `http://localhost:${port}`,
            port: port,
            status: 'running',
            pid: serverProcess.pid,
        };
    }

    private async waitForServer(port: number, maxRetries = 10): Promise<void> {
        for (let i = 0; i < maxRetries; i++) {
            try {
                await new Promise<void>((resolve, reject) => {
                    const req = http.get(`http://localhost:${port}`, (res) => {
                        resolve();
                    });
                    req.on('error', reject);
                    req.setTimeout(1000);
                });
                return;
            } catch (err) {
                if (i === maxRetries - 1) throw err;
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }

    private async deployStaticSite(node: CloudDOMNode): Promise<void> {
        const { name, content } = node.props;

        // Create a directory for the site
        const siteDir = path.join(process.cwd(), 'sites', name);

        if (!fs.existsSync(siteDir)) {
            fs.mkdirSync(siteDir, { recursive: true });
        }

        // Write index.html
        const indexPath = path.join(siteDir, 'index.html');
        const htmlContent = content || '<h1>Hello World</h1><p>Welcome to CReact!</p>';
        fs.writeFileSync(indexPath, htmlContent);

        console.log(`[HttpServer]   ✓ Static site created at ${siteDir}`);

        node.outputs = {
            path: siteDir,
            indexPath: indexPath,
        };
    }



    // Cleanup method to stop all servers
    async cleanup(): Promise<void> {
        console.log('\n[HttpServer] 🛑 Stopping all servers...');

        for (const [id, process] of this.processes.entries()) {
            process.kill('SIGTERM');
            console.log(`[HttpServer]   ✓ Stopped server: ${id}`);
        }

        this.processes.clear();
        console.log('[HttpServer] ✅ All servers stopped\n');
    }
}

