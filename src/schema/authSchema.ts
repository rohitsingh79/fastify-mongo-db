export const authBodySchema = {
  type: "object",
  required: ["email", "password"],
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string" },
    username: { type: "string" },
  },
};

export const feedBackBodySchema = {
  type: "object",
  required: ["resourceId", "rating"],
  properties: {
    resourceId: { type: "string" },
    rating: { type: "integer", minimum: 1, maximum: 5 },
    userId: { type: "string" },
    comment: { type: "string" },
  },
};

export const feedBackBodyResponseSchema = {
  200: {
    type: "object",
    properties: {
      resourceId: { type: "string" },
      userID: { type: "string" },
      comment: { type: "string" },
      rating: { type: "integer" },
    },
  },
  400: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
  },
};
