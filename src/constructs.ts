// Infrastructure construct definitions
// These are simple classes that represent cloud resources

/**
 * WebServer - Serves static HTML content via http-server
 * 
 * This construct combines static site generation and HTTP serving
 * into a single resource, following the "one useInstance per component" pattern.
 */
export class WebServer {
  constructor(public props: {
    name: string;
    port: number;
    content: string;
  }) {}
}
