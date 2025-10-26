import { FastifyRequest, FastifyReply } from "Fastify";

export const authorisationMiddleWare = async (
  req: FastifyRequest,
  res: FastifyReply
) => {
  const { userId } = req.body as { userId?: string };
  try {
    await req.jwtVerify(); // attaches user id to or the payload to the req.user object
    const id = (req.user as { userId?: string }).userId;

    if (!id) {
      res.code(401).send({
        message: "user id is not valid",
      });
    }

    if (id !== userId) {
      res.code(401).send({ message: "user is not authorised" });
    }
  } catch (err) {
    res.code(401).send({ message: "invalid token" });
  }
};
