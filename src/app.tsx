/**
 * CReact Multi-Environment Demo Application
 * 
 * Demonstrates CReact's reactive infrastructure paradigm:
 * 1. useState + useEffect for output binding
 * 2. Context propagation of outputs
 * 3. Layered deployment with dependencies
 * 4. Hot reload in dev mode
 */

import { CReact, CReactCore, renderCloudDOM, createContext, useContext, useInstance, useState, useEffect } from '@creact-labs/creact';
import { RealHttpServerProvider } from './providers/RealHttpServerProvider';
import { SQLiteBackendProvider } from './providers/MemoryBackendProvider';
import { StaticSite, HttpServer } from './constructs';

/* -------------------------------------------------------------------------- */
/*                              Context Setup                                 */
/* -------------------------------------------------------------------------- */

// Environment configuration context (static during render)
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

// Site outputs context (REACTIVE - updates when outputs change)
interface SiteOutputs {
    path?: string;
}

const SiteContext = createContext<SiteOutputs>({});

/* -------------------------------------------------------------------------- */
/*                         Layer 2: Server (Depends on Site)                  */
/* -------------------------------------------------------------------------- */

/**
 * Server Component - Consumes site outputs via context
 * 
 * CReact Pattern:
 * - ALWAYS call useInstance unconditionally
 * - Pass undefined dependencies - CReact creates placeholder nodes
 * - When dependencies become available, placeholder is replaced with real resource
 */
function ServerComponent() {
    const envConfig = useContext(EnvironmentContext);
    const siteOutputs = useContext(SiteContext);

    console.log(`[${envConfig.name}] ServerComponent render - path: ${siteOutputs.path || 'undefined'}`);

    // ✅ ALWAYS call useInstance - even with undefined contentPath
    // CReact automatically creates placeholder when contentPath is undefined
    const server = useInstance(HttpServer, {
        port: envConfig.port,
        contentPath: siteOutputs.path, // Can be undefined - CReact handles it!
    });

    // Log when server is live
    if (server.outputs?.url) {
        console.log(`[${envConfig.name}] 🎉 Server live at: ${server.outputs.url}`);
    }

    return <></>;
}

/* -------------------------------------------------------------------------- */
/*                         Layer 1: Site (Foundation)                         */
/* -------------------------------------------------------------------------- */

/**
 * Site Provider - Creates static site and provides outputs via context
 * 
 * CReact Reactivity Pattern:
 * - Use useState to hold output values
 * - Use useEffect to bind provider outputs to state
 * - When outputs change, useEffect runs → setState → component re-renders
 * - Context consumers (ServerComponent) automatically re-render
 */
function SiteProvider() {
    const envConfig = useContext(EnvironmentContext);

    // State to hold site path (reactive)
    const [sitePath, setSitePath] = useState<string>();

    console.log(`[${envConfig.name}] SiteProvider render - sitePath state: ${sitePath || 'undefined'}`);

    // Generate HTML content for this environment
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${envConfig.name.toUpperCase()} - CReact Demo</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, ${envConfig.color} 0%, #667eea 100%);
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
            color: ${envConfig.color};
            margin-bottom: 1rem;
        }
        .env-badge {
            display: inline-block;
            background: ${envConfig.color};
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
            color: ${envConfig.color};
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="env-badge">${envConfig.name.toUpperCase()}</div>
        <h1>Hello from ${envConfig.name}!</h1>
        <p>${envConfig.message}</p>
        <p>This page is served by CReact + http-server</p>
        <p class="port">Running on port ${envConfig.port}</p>
    </div>
</body>
</html>
    `.trim();

    // Create static site
    const site = useInstance(StaticSite, {
        name: `site-${envConfig.name}`,
        content: htmlContent,
    });

    // ✅ REACTIVE OUTPUT BINDING: useEffect binds provider output to state
    // When site.outputs.path becomes available, this effect runs and updates state
    // State update triggers re-render → context value updates → consumers re-render
    useEffect(() => {
        if (site.outputs?.path) {
            console.log(`[${envConfig.name}] 📍 Site deployed! Updating context with path: ${site.outputs.path}`);
            setSitePath(site.outputs.path);
        }
    }, [site.outputs?.path]); // Re-run when site.outputs.path changes

    // Provide site outputs to server layer via context
    // Uses state value (reactive) not direct output read (static)
    const siteOutputs: SiteOutputs = {
        path: sitePath, // State value updates when useEffect runs
    };

    return (
        <SiteContext.Provider value={siteOutputs}>
            <ServerComponent />
        </SiteContext.Provider>
    );
}

/* -------------------------------------------------------------------------- */
/*                         Environment Stack                                  */
/* -------------------------------------------------------------------------- */

/**
 * Environment Stack - Configures and deploys a complete environment
 * 
 * Deployment Flow:
 * 1. Initial render: Site creates real resource, Server creates placeholder
 * 2. Site deploys: Outputs become available
 * 3. useEffect detects change: Calls setSitePath()
 * 4. SiteProvider re-renders: Context value updates
 * 5. ServerComponent re-renders: Gets real path, creates real server
 * 6. Server deploys: Complete!
 */
function EnvironmentStack({ config }: { config: EnvironmentConfig }) {
    console.log(`[App] Rendering ${config.name} environment...`);

    return (
        <EnvironmentContext.Provider value={config}>
            <SiteProvider />
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
 * 
 * Each environment follows reactive layered deployment:
 * 1. Site layer deploys first
 * 2. useEffect detects outputs and updates state
 * 3. State change triggers re-render
 * 4. Server layer gets outputs and deploys
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
CReactCore.cloudProvider = new RealHttpServerProvider(backendProvider);
CReactCore.backendProvider = backendProvider;

export default async function () {
    return await renderCloudDOM(<App />, 'demo-stack');
}
