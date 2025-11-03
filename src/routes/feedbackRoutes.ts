import { FastifyPluginAsync, FastifyRequest } from "Fastify";
import { ObjectId } from "mongodb";
import {
  feedBackBodyResponseSchema,
  feedBackBodySchema,
} from "../schema/feedBackSchema";
import { authorisationMiddleWare } from "../utils/authorisation";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: typeof authorisationMiddleWare;
  }
}

interface FeedbackRequestBody {
  resourceId: string;
  rating: number;
  userId?: string;
  comment?: string;
}

interface FeedbackQueryParam {
  sort?: "date" | "rating";
}

export const feedbackRoutes: FastifyPluginAsync = async (fastify) => {
  // post a feedback
  fastify.post("/feedback", {
    schema: {
      body: feedBackBodySchema,
      response: feedBackBodyResponseSchema,
      tags: ["Feedback"],
      summary:
        "Allow users to share their experience by posting a star rating and optional comment for any resource.",
      security: [{ bearerAuth: [] }], // tells Swagger to use the defined scheme
    },
    preValidation: [fastify.authenticate],
    handler: async (
      req: FastifyRequest<{ Body: FeedbackRequestBody }>,
      res
    ) => {
      //1. if authenticated check the database with the user Id and resource id combination
      const userID = (req.user as { userId: string })?.userId;

      const isGuestUser = userID.includes("Guest");

      const { resourceId, comment, rating, userId } = req.body;
      const feedbackCollection = fastify.mongo.db?.collection("feedback");
      const usersCollection = fastify.mongo.db?.collection("users");
      let getUser;
      if (!isGuestUser) {
        getUser = await usersCollection?.findOne({
          _id: new ObjectId(userID),
        });
      }

      const getDocumentWithUserResourceId = await feedbackCollection?.findOne({
        userID,
        resourceId,
      });

      if (!getDocumentWithUserResourceId) {
        const insertFeedback = await feedbackCollection?.insertOne({
          userID,
          comment,
          rating,
          resourceId,
          userName: `${!isGuestUser} ? ${getUser?.username} : ${userID}`,
          createdAt: new Date(),
        });
        if (insertFeedback?.acknowledged) {
          res.code(200).send({
            userID,
            comment,
            rating,
            resourceId,
          });
        }
      } else {
        res.code(400).send({
          message: `rating for this resource id ${resourceId} is already done by ${
            !isGuestUser ? getUser?.username : userID
          }`,
        });
      }
    },
  });

  // get all the feedbacks
  fastify.get("/feedback/ALL", {
    schema: {
      tags: ["Feedback"],
      summary: "Get all the feedbacks",
    },
    handler: async (req, res) => {
      const feedbackCollection = fastify.mongo.db?.collection("feedback");
      const feedbacks = await feedbackCollection?.find({}).toArray();
      res.code(200).send(feedbacks);
    },
  });

  // delete the feedbacks
  fastify.delete("/feedback/:resourceId", {
    schema: {
      tags: ["Feedback"],
      summary: "Delete a resource by resource id",
    },

    handler: async (req, res) => {
      const feedBackCollection = fastify.mongo.db?.collection("feedback");
      const { resourceId } = req.params as { resourceId: string };
      const delResponse = await feedBackCollection?.deleteOne({ resourceId });
      if (delResponse?.acknowledged && delResponse.deletedCount > 0) {
        res.code(200).send({
          message: `${resourceId} has been deleted successfully and the number of count is ${delResponse.deletedCount}`,
        });
      } else res.code(401).send({ message: `${resourceId} does not exists` });
    },
  });

  // endpoint to fetch beedback with pagination , sort by field and order
  fastify.get("/feedback/:resourceId", {
    schema: {
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1, default: 1 },
          sortBy: { type: "string", enum: ["date", "rating"], default: "date" },
          orderBy: { type: "string", enum: ["asc", "dsc"], default: "asc" },
        },
      },
      params: {
        type: "object",
        properties: {
          resourceId: { type: "string" },
        },
        required: ["resourceId"],
      },
      response: {
        200: {
          type: "object",
          properties: {
            averageRating: { type: "number" },
            totalRatings: { type: "number" },
            recentFeedbacks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  comment: { type: "string" },
                  rating: { type: "number" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        500: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      },
      tags: ["Feedback"],
      summary:
        "Fetch average rating, total ratings, and recent comments for a resource",
    },
    handler: async (req, res) => {
      const { resourceId } = req.params as { resourceId: any };
      const { page, sortBy, orderBy } = req.query as {
        page: number;
        sortBy: "date" | "rating";
        orderBy: "asc" | "dsc";
      };
      const pageSize = 2;
      const skip = (page - 1) * pageSize;
      const sortOrder = orderBy == "asc" ? 1 : -1;
      const sortedField = sortBy === "date" ? "createdAt" : "rating";

      const feedBackCollection = fastify.mongo.db?.collection("feedback");
      if (!feedBackCollection) {
        return res.status(500).send({ message: "MongoDB not connected" });
      }

      const feedbacks = await feedBackCollection
        ?.find({
          resourceId,
          comment: { $exists: true },
        })
        .sort({ [sortedField]: sortOrder, createdAt: 1 })
        .skip(skip)
        .limit(pageSize)
        .project({ rating: 1, comment: 1, _id: 0, createdAt: -1 })
        .toArray();

      const avgResults = await feedBackCollection
        .aggregate([
          { $match: { resourceId } },
          { $group: { _id: resourceId, avgRating: { $avg: `$rating` } } },
        ])
        .toArray();

      const averageRating = avgResults[0]?.avgRating || 0;
      const totalRatings = await feedBackCollection.countDocuments({
        resourceId,
      });

      res.code(200).send({
        averageRating,
        totalRatings,
        recentFeedbacks: feedbacks,
      });
    },
  });
};
