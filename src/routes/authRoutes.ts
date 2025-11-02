import { FastifyPluginAsync, FastifyRequest } from "Fastify";
import {
  authLoginBodyResponseSchema,
  authBodySchema,
  authRegisterResponseSchema,
} from "../schema/authSchema";
import { ObjectId } from "@fastify/mongodb";
import bcrypt from "bcrypt";

interface RegisterRequestBody {
  email: string;
  password: string;
  username: string;
}

const authRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post("/register", {
    schema: {
      body: authBodySchema,
      response: authRegisterResponseSchema,
      tags: ["Auth"],
      summary: "Register a new user with email and password",
    },
    handler: async (
      request: FastifyRequest<{ Body: RegisterRequestBody }>,
      reply
    ) => {
      const { email, password, username } = request.body;
      const userCollection = fastify?.mongo?.db?.collection("users");
      if (!userCollection) {
        reply.status(500).send({
          message: "Database connection error: users collection not found",
        });
      }

      const existing = await userCollection?.findOne({ email });
      if (existing) {
        reply.code(409).send({ message: "User already exists" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await userCollection?.insertOne({
        email,
        password: hashedPassword,
        username,
      });
      if (result?.acknowledged) {
        reply.code(200).send({
          message: "user is registered successfully",
          userId: result.insertedId.toString(),
          username: username,
        });
      }
    },
  });

  fastify.post("/login", {
    schema: {
      body: authBodySchema,
      response: authLoginBodyResponseSchema,
      tags: ["Auth"],
      summary: "Login and receive JWT token",
    },
    handler: async (
      req: FastifyRequest<{ Body: RegisterRequestBody }>,
      reply
    ) => {
      const { email, password } = req.body;
      const userCollections = fastify?.mongo?.db?.collection("users");
      if (!userCollections) {
        reply.code(500).send({ message: "user DB does not exist" });
      }

      const user = await userCollections?.findOne({ email });

      const hashedPassword = await bcrypt.compare(password, user?.password);

      if (user && hashedPassword) {
        // need to send json web token
        const token = fastify.jwt.sign({
          userId: user._id,
          username: user.username,
        });
        reply.code(200).send({
          token,
          userId: user._id,
        });
      } else {
        reply.code(400).send({ message: "password is invalid" });
      }
    },
  });

  fastify.get("/Users/ALL", {
    schema: {
      tags: ["Users"],
      summary: "Get All Registered Users",
    },
    handler: async (req, res) => {
      const userCollection = fastify.mongo.db?.collection("users");
      const allUsers = await userCollection?.find({}).toArray();
      res.code(200).send(allUsers);
    },
  });

  fastify.delete("/Users/:id", {
    schema: {
      tags: ["Users"],
      summary: "Delete a user entry using id",
    },
    handler: async (req: FastifyRequest<{ Params: { id: string } }>, res) => {
      const { id } = req.params;
      const userCollection = fastify.mongo.db?.collection("users");
      const deleteResponse = await userCollection?.deleteOne({
        _id: new ObjectId(id),
      });
      if (deleteResponse?.acknowledged) {
        res.code(200).send({
          message: `${id} is deleted successfully ${deleteResponse.deletedCount}`,
        });
      }
    },
  });
};

export default authRoute;
