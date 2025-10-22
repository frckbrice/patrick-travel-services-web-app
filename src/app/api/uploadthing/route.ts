import { createRouteHandler } from 'uploadthing/next';
import { ourFileRouter } from './core';

// Export routes for Next App Router
// UploadThing will call our middleware with the client's request
// The middleware in core.ts extracts auth from the Authorization header
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    // Log errors for debugging
    logLevel: 'Debug',
  },
});
