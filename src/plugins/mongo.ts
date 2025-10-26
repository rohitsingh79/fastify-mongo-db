import fp from "fastify-plugin";
import fastifyMongo from "@fastify/mongodb";

const monogoDbPlugin = fp(async (fastify) => {
  fastify.register(fastifyMongo, {
    url: "mongodb://127.0.0.1:27017/myappdb",
  });
});

export default monogoDbPlugin;
