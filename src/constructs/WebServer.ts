/**
 * WebServer Construct
 * 
 * Serves static HTML content via http-server.
 * This construct combines static site generation and HTTP serving
 * into a single resource, following the "one useInstance per component" pattern.
 */

export interface WebServerProps {
  name: string;
  port: number;
  content: string;
}

export interface WebServerOutputs {
  url?: string;
  port?: number;
  status?: string;
  pid?: number;
}

/**
 * WebServer construct class
 * 
 * In CReact, constructs are simple classes that hold props.
 * The actual resource creation is handled by the provider during materialization.
 */
export class WebServer {
  constructor(
    public props: WebServerProps
  ) {}
}
