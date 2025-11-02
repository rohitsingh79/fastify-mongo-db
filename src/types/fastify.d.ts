import "fastify";
import { FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
  interface fastifyInstance {
    authenticate: (req: FastifyRequest, res: FastifyReply) => promise<void>;
  }

  interface FastifyRequest {
    user?: { userId: string };
  }
}
