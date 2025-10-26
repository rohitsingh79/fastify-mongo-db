import Fastify from "Fastify";
import { app } from "./app";

export const start = async () => {
  const server = await app();
  try {
    await server.listen({ port: 3000, host: "localhost" });
  } catch (err) {
    console.log(`Error starting server: ${err}`);
  }
};

start();
