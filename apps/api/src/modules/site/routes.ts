import { HomeImages, HomeTheme, Problem } from "@weems/contrats";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import type { SiteService } from "./service.ts";

const tags = ["site"];
const ThemeParams = z.object({ theme: HomeTheme });
/** The image path carries v, changed by each upload: the image itself never changes. */
const IMAGE_CACHE = "public, max-age=31536000, immutable";

/**
 * Public routes of the home page images (spec J4 personnalisation), read by the site's server
 * (settings) and by the visitors' browsers (images). Rate limited per address.
 */
export function registerSiteRoutes(parent: FastifyInstance, service: SiteService): void {
  const app = parent.withTypeProvider<ZodTypeProvider>();
  const rateLimit = { max: 120, timeWindow: "1 minute" };
  app.get(
    "/v1/site/home-images",
    {
      config: { rateLimit },
      schema: { tags, response: { 200: HomeImages, 429: Problem } },
    },
    async (_request, reply) => {
      reply.header("cache-control", "public, max-age=60");
      return service.homeImages();
    },
  );
  app.get(
    "/v1/site/home-images/:theme/image",
    {
      config: { rateLimit },
      schema: { tags, params: ThemeParams },
    },
    async (request, reply) => {
      const webp = await service.image(request.params.theme);
      return reply.type("image/webp").header("cache-control", IMAGE_CACHE).send(webp);
    },
  );
}
