/**
 * Environment Web Server Component
 * 
 * Deploys a web server for a specific environment with custom styling.
 * Demonstrates CReact best practices:
 * - One useInstance per component
 * - Configuration via context
 * - Clean separation of concerns
 */
import { CReact } from '@creact-labs/creact';

import { useContext, useInstance } from '@creact-labs/creact';
import { EnvironmentContext } from '../contexts';
import { WebServer } from '../constructs';
import { generateEnvironmentHTML } from '../utils';

export function EnvironmentWebServer() {
  const config = useContext(EnvironmentContext);

  console.log(`[${config.name}] Deploying web server on port ${config.port}...`);

  // Generate HTML content for this environment
  const htmlContent = generateEnvironmentHTML(config);

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
