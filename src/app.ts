import Fastify from "Fastify";
import fastifyJwt from "@fastify/jwt";
import monogoPlugin from "./plugins/mongo";
import authRoutes from "./routes/authRoutes";
import { authorisationMiddleWare } from "./utils/authorisation";
import { feedbackRoutes } from "./routes/feedbackRoutes";

export const app = async () => {
  const app = Fastify({ logger: true });

  app.get("/health", async (request, reply) => {
    console.log("health is all ok", request.ip);
    reply.send({ status: "ok", statusCode: 200 });
  });

  await app.register(monogoPlugin);
  await app.register(authRoutes);
  await app.register(feedbackRoutes);
  await app.register(fastifyJwt, { secret: "my secret key" });

  //   app.get("/users", async (request, reply) => {
  //     const collection = await app.mongo.client
  //       .db("myappdb")
  //       .collection("users")
  //       .find({ name: "Rohit" })
  //       .toArray();
  //     reply.send({ users: collection });
  //   });

  return app;
};
