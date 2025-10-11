/**
 * Environment Context
 * 
 * Provides environment configuration to child components.
 */

import { createContext } from '@creact-labs/creact';

export interface EnvironmentConfig {
  name: string;
  port: number;
  color: string;
  message: string;
}

export const EnvironmentContext = createContext<EnvironmentConfig>({
  name: 'unknown',
  port: 8080,
  color: '#666',
  message: 'Unknown environment',
});
