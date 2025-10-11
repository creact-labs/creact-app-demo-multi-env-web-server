/**
 * Environment Stack Component
 * 
 * Configures and deploys a complete environment with its context.
 */
import { CReact } from '@creact-labs/creact';

import { EnvironmentContext, EnvironmentConfig } from '../contexts';
import { EnvironmentWebServer } from './EnvironmentWebServer';

interface EnvironmentStackProps {
  config: EnvironmentConfig;
}

export function EnvironmentStack({ config }: EnvironmentStackProps) {
  console.log(`[App] Rendering ${config.name} environment...`);

  return (
    <EnvironmentContext.Provider value={config}>
      <EnvironmentWebServer />
    </EnvironmentContext.Provider>
  );
}
