/**
 * CReact Multi-Environment Demo Application
 * 
 * Entry point that configures providers and renders the application.
 * 
 * Demonstrates CReact best practices:
 * - Clean component structure (like React)
 * - Modular provider configuration
 * - Context-based configuration
 * - Hot reload support
 */

import { CReact, CReactCore, renderCloudDOM } from '@creact-labs/creact';
import { App } from './components';
import { RealHttpServerProvider, SQLiteBackendProvider } from './providers';

// Configure providers on CReact singleton
const backendProvider = new SQLiteBackendProvider('./creact-state.db');
CReactCore.cloudProvider = new RealHttpServerProvider();
CReactCore.backendProvider = backendProvider;

// Export default function for CLI entry point
export default async function () {
  return await renderCloudDOM(<App />, 'demo-stack');
}
