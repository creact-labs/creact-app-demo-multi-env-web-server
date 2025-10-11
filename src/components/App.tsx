/**
 * Multi-Environment Application
 * 
 * Root component that deploys three independent environments in parallel:
 * - Development (port 8080)
 * - Staging (port 8081)
 * - Production (port 8082)
 */

import { CReact } from '@creact-labs/creact';
import { EnvironmentStack } from './EnvironmentStack';
import { environments } from '../config';

export function App() {
  console.log('[App] Rendering multi-environment application...');

  return (
    <>
      {environments.map((config) => (
        <EnvironmentStack key={config.name} config={config} />
      ))}
    </>
  );
}
