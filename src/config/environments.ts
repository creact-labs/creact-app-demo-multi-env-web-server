/**
 * Environment Configurations
 * 
 * Defines the configuration for each deployment environment.
 */

import { EnvironmentConfig } from '../contexts/EnvironmentContext';

export const environments: EnvironmentConfig[] = [
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
