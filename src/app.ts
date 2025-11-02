import Fastify from "Fastify";
import fastifyJwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
import monogoPlugin from "./plugins/mongo";
import authRoutes from "./routes/authRoutes";
import { feedbackRoutes } from "./routes/feedbackRoutes";
import swagger from "./plugins/swagger";
import authorisationPlugin from "./plugins/authorisation";

export const app = async () => {
  const app = Fastify({ logger: true });

  app.get("/health", async (request, reply) => {
    reply.send({ status: "ok", statusCode: 200 });
  });

  app.register(cookie);
  app.register(swagger);
  app.register(authorisationPlugin);
  await app.register(monogoPlugin);
  await app.register(authRoutes);
  await app.register(feedbackRoutes);
  await app.register(fastifyJwt, { secret: "my secret key" });
  return app;
};
