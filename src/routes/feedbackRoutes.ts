import { FastifyPluginAsync, FastifyRequest } from "Fastify";
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
          message: `rating for this resource id ${resourceId} is already done by ${userId}`,
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
};
