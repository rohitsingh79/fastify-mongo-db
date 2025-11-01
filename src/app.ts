import Fastify from "Fastify";
import fastifyJwt from "@fastify/jwt";
import monogoPlugin from "./plugins/mongo";
import authRoutes from "./routes/authRoutes";
import { feedbackRoutes } from "./routes/feedbackRoutes";
import swagger from "./plugins/swagger";

export const app = async () => {
  const app = Fastify({ logger: true });

  app.get("/health", async (request, reply) => {
    console.log("health is all ok", request.ip);
    reply.send({ status: "ok", statusCode: 200 });
  });

  app.register(swagger);
  await app.register(monogoPlugin);
  await app.register(authRoutes);
  await app.register(feedbackRoutes);
  await app.register(fastifyJwt, { secret: "my secret key" });
  return app;
};
