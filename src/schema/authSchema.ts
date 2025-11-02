export const authBodySchema = {
  type: "object",
  required: ["email", "password"],
  properties: {
    email: { type: "string", format: "email" },
    password: { type: "string" },
    username: { type: "string" },
  },
};

export const authLoginBodyResponseSchema = {
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
};

export const authRegisterResponseSchema = {
  200: {
    type: "object",
    properties: {
      message: { type: "string" },
      userId: { type: "string" },
      username: { type: "string" },
    },
  },
  201: {
    type: "object",
    properties: {
      message: { type: "string" },
      userId: { type: "string" },
    },
  },
  409: {
    type: "object",
    properties: {
      message: { type: "string" },
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
};
