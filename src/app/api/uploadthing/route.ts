import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
    router: ourFileRouter,
    config: {
        // Set uploadthing secret from environment
        token: process.env.UPLOADTHING_TOKEN,
    },
});

