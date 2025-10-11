import type { ICloudProvider, DriftDetectionResult, CloudDOMNode } from '@creact-labs/creact';
import { ChildProcess } from 'child_process';
import spawn from 'cross-spawn';
import kill from 'tree-kill';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

/**
 * Real HTTP Server Provider
 * 
 * Deploys web servers with static content using http-server.
 * Demonstrates proper drift detection and resource lifecycle management.
 * 
 * Cross-Platform Support:
 * - Works on Linux, macOS, and Windows
 * - Uses cross-spawn for platform-agnostic process spawning
 * - Uses tree-kill for proper process cleanup (including child processes)
 * - Uses Node.js built-in APIs (fs, path, http) which are cross-platform
 * 
 * Dependencies:
 * - http-server: Static file server
 * - cross-spawn: Cross-platform process spawning
 * - tree-kill: Cross-platform process tree termination
 */
export class RealHttpServerProvider implements ICloudProvider {
  private processes: Map<string, ChildProcess> = new Map();
  private siteDirs: Map<string, string> = new Map();
  private cleanupRegistered = false;

  constructor() {
    this.registerCleanupHandlers();
  }

  private registerCleanupHandlers(): void {
    if (this.cleanupRegistered) return;
    this.cleanupRegistered = true;

    const cleanup = () => {
      console.log('\n[WebServer] 🛑 Process exiting, stopping all servers...');
      
      const killPromises = Array.from(this.processes.entries()).map(([id, proc]) => {
        return new Promise<void>((resolve) => {
          if (!proc.pid) {
            resolve();
            return;
          }

          // tree-kill handles cross-platform process termination
          // including child processes spawned by the server
          kill(proc.pid, 'SIGTERM', (err) => {
            if (err) {
              // Process might already be dead, that's ok
              console.log(`[WebServer]   ℹ Server ${id} already stopped`);
            } else {
              console.log(`[WebServer]   ✓ Stopped server: ${id}`);
            }
            resolve();
          });
        });
      });

      // Wait for all processes to be killed (with timeout)
      Promise.race([
        Promise.all(killPromises),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]).then(() => {
        this.processes.clear();
      });
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

  async materialize(nodes: CloudDOMNode[]): Promise<void> {
    console.log(`\n[WebServer] 🚀 Deploying ${nodes.length} resources...`);

    for (const node of nodes) {
      console.log(`[WebServer] 📦 ${node.constructType}: ${node.id}`);

      if (node.constructType === 'WebServer') {
        await this.deployWebServer(node);
      }

      console.log(`[WebServer]   ✓ Outputs:`, node.outputs);
    }

    console.log(`[WebServer] ✅ All resources deployed\n`);
  }

  /**
   * Detect drift - checks if web server is responding
   */
  async detectDrift(node: CloudDOMNode): Promise<DriftDetectionResult> {
    if (node.constructType !== 'WebServer') {
      return {
        nodeId: node.id,
        hasDrifted: false,
        timestamp: Date.now(),
      };
    }

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
      actualState: isAlive ? node.outputs : undefined,
      driftDescription: isAlive ? undefined : `Server not responding on port ${expectedPort}`,
      timestamp: Date.now(),
    };
  }

  /**
   * Refresh state - clears outputs if server is dead
   */
  async refreshState(node: CloudDOMNode): Promise<void> {
    if (node.constructType !== 'WebServer') {
      return;
    }

    const expectedPort = node.outputs?.port;
    if (!expectedPort) {
      return;
    }

    const isAlive = await this.checkServerAlive(expectedPort);

    if (!isAlive) {
      console.log(`[WebServer]   🔄 Clearing stale outputs for: ${node.id}`);
      node.outputs = undefined;
    }
  }

  /**
   * Deploy a web server with static content
   */
  private async deployWebServer(node: CloudDOMNode): Promise<void> {
    const { name, port, content } = node.props;

    // Check if server already exists and is still running
    const existingProcess = this.processes.get(node.id);
    if (existingProcess && !existingProcess.killed) {
      console.log(`[WebServer]   ℹ Server already running on port ${port}`);
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

    // Create site directory and HTML file
    const siteDir = path.join(process.cwd(), 'sites', name);
    if (!fs.existsSync(siteDir)) {
      fs.mkdirSync(siteDir, { recursive: true });
    }

    const indexPath = path.join(siteDir, 'index.html');
    fs.writeFileSync(indexPath, content);
    this.siteDirs.set(node.id, siteDir);

    console.log(`[WebServer]   ✓ Created site at ${siteDir}`);

    // Start http-server using cross-spawn (handles Windows/Unix differences automatically)
    const serverProcess = spawn('npx', ['http-server', siteDir, '-p', String(port), '-c-1'], {
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
        console.log(`[WebServer]   ${output.trim()}`);

        if (output.includes('Hit CTRL-C to stop') || output.includes('Available on')) {
          clearTimeout(timeout);
          resolve();
        }
      });

      serverProcess.stderr?.on('data', (data) => {
        console.error(`[WebServer]   ✗ ${data.toString().trim()}`);
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

    console.log(`[WebServer]   ✓ Server started on http://localhost:${port}`);

    // Set outputs
    node.outputs = {
      url: `http://localhost:${port}`,
      port: port,
      status: 'running',
      pid: serverProcess.pid,
    };
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
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }
}
