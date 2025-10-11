/**
 * HTML Generator Utility
 * 
 * Generates HTML content for environment web pages.
 */

import { EnvironmentConfig } from '../contexts/EnvironmentContext';

export function generateEnvironmentHTML(config: EnvironmentConfig): string {
  return `
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
}
