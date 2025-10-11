/**
 * CReact Multi-Environment Demo Application
 * 
 * Demonstrates CReact best practices:
 * 1. One useInstance per component
 * 2. Clear parent-child dependencies through nesting
 * 3. Simple drift detection and recovery
 * 4. Hot reload in dev mode
 */

import { CReact, CReactCore, renderCloudDOM, createContext, useContext, useInstance } from '@creact-labs/creact';
import { RealHttpServerProvider } from './providers/WebServerProvider';
import { SQLiteBackendProvider } from './providers/MemoryBackendProvider';
import { WebServer } from './constructs';

/* -------------------------------------------------------------------------- */
/*                              Context Setup                                 */
/* -------------------------------------------------------------------------- */

// Environment configuration context
interface EnvironmentConfig {
    name: string;
    port: number;
    color: string;
    message: string;
}

const EnvironmentContext = createContext<EnvironmentConfig>({
    name: 'unknown',
    port: 8080,
    color: '#666',
    message: 'Unknown environment',
});

/* -------------------------------------------------------------------------- */
/*                         Environment Web Server                             */
/* -------------------------------------------------------------------------- */

/**
 * Environment Web Server Component
 * 
 * CReact Best Practice:
 * - One useInstance per component
 * - All configuration passed as props
 * - No complex state management needed
 * - Drift detection works automatically
 */
function EnvironmentWebServer() {
    const config = useContext(EnvironmentContext);

    console.log(`[${config.name}] Deploying web server on port ${config.port}...`);

    // Generate HTML content for this environment
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${config.name.toUpperCase()} - CReact Demo</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, ${config.color} 0%, #667eea 100%);
        }
        .container {
            background: white;
            padding: 3rem;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 600px;
        }
        h1 {
            color: ${config.color};
            margin-bottom: 1rem;
        }
        .env-badge {
            display: inline-block;
            background: ${config.color};
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        p {
            color: #666;
            line-height: 1.6;
        }
        .port {
            color: ${config.color};
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="env-badge">${config.name.toUpperCase()}</div>
        <h1>Hello from ${config.name}!</h1>
        <p>${config.message}</p>
        <p>This page is served by CReact + http-server</p>
        <p class="port">Running on port ${config.port}</p>
    </div>
</body>
</html>
  `.trim();

    // Deploy web server with static content
    const server = useInstance(WebServer, {
        name: `${config.name}-server`,
        port: config.port,
        content: htmlContent,
    });

    // Log when server is live
    if (server.outputs?.url) {
        console.log(`[${config.name}] 🎉 Server live at: ${server.outputs.url}`);
    }

    return <></>;
}

/* -------------------------------------------------------------------------- */
/*                         Environment Stack                                  */
/* -------------------------------------------------------------------------- */

/**
 * Environment Stack - Configures and deploys a complete environment
 */
function EnvironmentStack({ config }: { config: EnvironmentConfig }) {
    console.log(`[App] Rendering ${config.name} environment...`);

    return (
        <EnvironmentContext.Provider value={config}>
            <EnvironmentWebServer />
        </EnvironmentContext.Provider>
    );
}

/* -------------------------------------------------------------------------- */
/*                         Root Application                                   */
/* -------------------------------------------------------------------------- */

/**
 * Multi-Environment Application
 * 
 * Deploys three independent environments in parallel:
 * - Development (port 8080)
 * - Staging (port 8081)
 * - Production (port 8082)
 */
function App() {
    console.log('[App] Rendering multi-environment application...');

    // Define environment configurations
    const environments: EnvironmentConfig[] = [
        {
            name: 'development',
            port: 8080,
            color: '#4CAF50',
            message: 'Development Environment - Feel free to experiment!',
        },
        {
            name: 'staging',
            port: 8081,
            color: '#FF9800',
            message: 'Staging Environment - Testing before production',
        },
        {
            name: 'production',
            port: 8082,
            color: '#2196F3',
            message: 'Production Environment - Live and running!',
        },
    ];

    return (
        <>
            {environments.map((config) => (
                <EnvironmentStack key={config.name} config={config} />
            ))}
        </>
    );
}

/* -------------------------------------------------------------------------- */
/*                          Provider Configuration                            */
/* -------------------------------------------------------------------------- */

// Configure providers on CReact singleton
const backendProvider = new SQLiteBackendProvider('./creact-state.db');
CReactCore.cloudProvider = new RealHttpServerProvider();
CReactCore.backendProvider = backendProvider;

export default async function () {
    return await renderCloudDOM(<App />, 'demo-stack');
}
