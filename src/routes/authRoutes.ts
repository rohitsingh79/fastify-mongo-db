import { FastifyPluginAsync, FastifyRequest } from "Fastify";
import { authBodySchema } from "../schema/authSchema";

interface RegisterRequestBody {
  username: string;
  password: string;
}
const authRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post("/register", {
    schema: {
      body: authBodySchema,
      response: {
        200: {
          type: "object",
          properties: {
            message: { type: "string" },
            userId: { type: "string" },
          },
        },
        400: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
        500: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      },
      tags: ["Auth"],
      summar: "Register a new user with email and password",
    },
    handler: async (
      request: FastifyRequest<{ Body: RegisterRequestBody }>,
      reply
    ) => {
      const { username, password } = request.body;
      const userCollection = fastify?.mongo?.db?.collection("users");
      if (!userCollection) {
        reply.status(500).send({
          message: "Database connection error",
        });
      }
      const result = await userCollection?.insertOne({ username, password });
      if (result?.acknowledged) {
        reply.code(200).send({
          message: "user is registered successfully",
          userId: result.insertedId.toString(),
        });
      }
    },
  });

  fastify.post("/login", {
    schema: {
      body: authBodySchema,
      response: {
        200: {
          type: "object",
          properties: {
            token: { type: "string" },
            userId: { type: "string" },
          },
        },
        400: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
        500: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      },
    },
    handler: async (
      req: FastifyRequest<{ Body: RegisterRequestBody }>,
      reply
    ) => {
      const { username, password } = req.body;
      const userCollections = fastify?.mongo?.db?.collection("users");
      if (!userCollections) {
        reply.code(500).send({ message: "user DB does not exist" });
      }

      const user = await userCollections?.findOne({ username });

      if (user && password === user.password) {
        // need to send json web token

        const token = fastify.jwt.sign({
          userId: user._id,
          username: user.username,
        });
        reply.code(200).send({
          token,
          userId: user._id,
        });
      }

      if (password !== user?.password) {
        reply.code(400).send({ message: "password is invalid" });
      }
    },
  });

  fastify.get("/Users/ALL", {
    handler: async (req, res) => {
      const userCollection = fastify.mongo.db?.collection("users");
      const allUsers = await userCollection?.find({}).toArray();
      res.code(200).send(allUsers);
    },
  });
};

export default authRoute;
