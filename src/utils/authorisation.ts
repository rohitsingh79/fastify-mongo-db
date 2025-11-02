import { FastifyRequest, FastifyReply } from "Fastify";

export const authorisationMiddleWare = async (
  req: FastifyRequest,
  res: FastifyReply
) => {
  const { userId } = req.body as { userId?: string };

  if (!userId) {
    // check for guest id
    const guestId = req.cookies.guestId;
    if (!guestId) {
      const newGuestId = crypto.randomUUID();
      // set the cookie
      res.setCookie("guestId", newGuestId, {
        path: "/", // all routes
        signed: false, // plain text cookie
        httpOnly: true, // no accessible by js in the browser,
        sameSite: "lax", // prevents csrf
        maxAge: 60 * 60 * 24 * 365, // maximum age limit
      });

      req.user = { userId: `Guest-${newGuestId}` };
    } else req.user = { userId: `Guest-${guestId}` };
    return;
  }

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
