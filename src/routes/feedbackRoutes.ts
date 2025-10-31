import { FastifyPluginAsync, FastifyRequest } from "Fastify";
import { ObjectId } from "mongodb";
import {
  feedBackBodyResponseSchema,
  feedBackBodySchema,
} from "../schema/authSchema";
import { authorisationMiddleWare } from "../utils/authorisation";

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
  fastify.decorate("authenticate", authorisationMiddleWare);
  // post a feedback
  fastify.post("/feedback", {
    schema: {
      body: feedBackBodySchema,
      response: feedBackBodyResponseSchema,
    },
    preValidation: authorisationMiddleWare,
    handler: async (
      req: FastifyRequest<{ Body: FeedbackRequestBody }>,
      res
    ) => {
      //1. if authenticated check the database with the user Id and resource id combination
      const userID = (req.user as { userId: string })?.userId;
      const { resourceId, comment, rating, userId } = req.body;
      const feedbackCollection = fastify.mongo.db?.collection("feedback");
      const usersCollection = fastify.mongo.db?.collection("users");
      const getUser = await usersCollection?.findOne({
        _id: new ObjectId(userID),
      });

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
          userName: getUser?.username,
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
        console.log("getUserName", getUser);
        res.code(400).send({
          message: `rating for this resource id ${resourceId} is already done by ${getUser}`,
        });
      }
    },
  });

  // get all the feedbacks
  fastify.get("/feedback/ALL", {
    handler: async (req, res) => {
      const feedbackCollection = fastify.mongo.db?.collection("feedback");
      const feedbacks = await feedbackCollection?.find({}).toArray();
      res.code(200).send(feedbacks);
    },
  });

  // delete the feedbacks
  fastify.delete("/feedback/delete/:resourceId", {
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

  // get the feed back based on timestamp , filetring
  fastify.get("/feedback/:resourceId", {
    handler: async (req, res) => {
      const { resourceId } = req.params as { resourceId: any };
      const { page, sortBy, orderBy } = req.query as {
        page: number;
        sortBy: "date" | "rating";
        orderBy: "asc" | "dsc";
      };
      const pageSize = 2;
      const skip = (page - 1) * pageSize;
      const sortOrder = orderBy === "asc" ? 1 : -1;

      const collection = fastify.mongo.db?.collection("feedback");

      console.log("feedback array", resourceId);

      const feedbacks = await collection
        ?.find({
          resourceId,
          comment: { $exists: true },
        })
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(pageSize)
        .toArray();

      res.code(200).send(feedbacks);
    },
  });
};
