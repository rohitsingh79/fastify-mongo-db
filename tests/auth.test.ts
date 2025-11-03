import { app } from "../src/app";
import { FastifyInstance } from "Fastify";

describe("Auth API Tests", () => {
  let fastifyApp: FastifyInstance;

  beforeAll(async () => {
    fastifyApp = await app();
    await fastifyApp.ready();
  });

  afterAll(async () => {
    await fastifyApp.close();
  });

  describe("User Registration", () => {
    test("Should register a new user successfully", async () => {
      const uniqueEmail = `newuser${Date.now()}@example.com`;

      const res = await fastifyApp.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: uniqueEmail,
          password: "SecurePassword123!",
          username: "testuser",
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.statusCode).toBe(201);
    });

    test("Should fail when registering user with existing email", async () => {
      const existingEmail = "existing@example.com";

      // First registration
      await fastifyApp.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: existingEmail,
          password: "Password123!",
          username: "user1",
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Second registration with same email
      const res = await fastifyApp.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: existingEmail,
          password: "DifferentPassword123!",
          username: "user2",
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.statusCode).toBe(409);
      const body = res.json();
      expect(body).toHaveProperty("message");
      expect(body.message).toBe("User already exists");
    });

    test("Should fail with invalid email format", async () => {
      const res = await fastifyApp.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: "invalid-email-format",
          password: "ValidPassword123!",
          username: "testuser",
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.statusCode).toBe(400);
    });

    test("Should fail with missing email", async () => {
      const res = await fastifyApp.inject({
        method: "POST",
        url: "/register",
        payload: {
          password: "ValidPassword123!",
          username: "testuser",
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.statusCode).toBe(400);
    });

    test("Should fail with missing password", async () => {
      const uniqueEmail = `nopass${Date.now()}@example.com`;

      const res = await fastifyApp.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: uniqueEmail,
          username: "testuser",
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.statusCode).toBe(400);
    });

    test("Should fail with missing username", async () => {
      const uniqueEmail = `nousername${Date.now()}@example.com`;

      const res = await fastifyApp.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: uniqueEmail,
          password: "ValidPassword123!",
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.statusCode).toBe(400);
    });

    test("Should fail with empty payload", async () => {
      const res = await fastifyApp.inject({
        method: "POST",
        url: "/register",
        payload: {},
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("User Login", () => {
    const testUser = {
      email: `logintest${Date.now()}@example.com`,
      password: "TestPassword123!",
      username: "loginuser",
    };

    beforeAll(async () => {
      // Create a test user for login tests
      await fastifyApp.inject({
        method: "POST",
        url: "/register",
        payload: testUser,
        headers: {
          "Content-Type": "application/json",
        },
      });
    });

    test("Should login successfully with correct credentials", async () => {
      const res = await fastifyApp.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: testUser.email,
          password: testUser.password,
          username: testUser.username,
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toHaveProperty("token");
      expect(body).toHaveProperty("userId");
      expect(typeof body.token).toBe("string");
      expect(body.token.length).toBeGreaterThan(0);
    });

    test("Should fail login with incorrect password", async () => {
      const res = await fastifyApp.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: testUser.email,
          password: "WrongPassword123!",
          username: testUser.username,
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body).toHaveProperty("message");
      expect(body.message).toBe("Invalid credentials");
    });

    test("Should fail login with non-existent email", async () => {
      const res = await fastifyApp.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: "nonexistent@example.com",
          password: "SomePassword123!",
          username: "someuser",
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.statusCode).toBe(400);
      const body = res.json();
      expect(body).toHaveProperty("message");
      expect(body.message).toBe("Invalid credentials");
    });

    test("Should fail login with missing email", async () => {
      const res = await fastifyApp.inject({
        method: "POST",
        url: "/login",
        payload: {
          password: testUser.password,
          username: testUser.username,
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.statusCode).toBe(400);
    });

    test("Should fail login with missing password", async () => {
      const res = await fastifyApp.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: testUser.email,
          username: testUser.username,
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.statusCode).toBe(400);
    });

    test("Should fail login with empty payload", async () => {
      const res = await fastifyApp.inject({
        method: "POST",
        url: "/login",
        payload: {},
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("User Management", () => {
    test("Should get all users", async () => {
      const res = await fastifyApp.inject({
        method: "GET",
        url: "/Users/ALL",
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body)).toBe(true);
    });

    test("Should delete a user by ID", async () => {
      // First create a user to delete
      const uniqueEmail = `deletetest${Date.now()}@example.com`;
      const createRes = await fastifyApp.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: uniqueEmail,
          password: "TestPassword123!",
          username: "deleteuser",
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      const createdUser = createRes.json();
      const userId = createdUser.userId;

      // Now delete the user
      const deleteRes = await fastifyApp.inject({
        method: "DELETE",
        url: `/Users/${userId}`,
        headers: {
          "Content-Type": "application/json",
        },
      });

      expect(deleteRes.statusCode).toBe(200);
      const body = deleteRes.json();
      expect(body).toHaveProperty("message");
      expect(body.message).toContain("deleted successfully");
    });

    test("Should handle invalid user ID for deletion", async () => {
      const invalidId = "invalidObjectId";

      const res = await fastifyApp.inject({
        method: "DELETE",
        url: `/Users/${invalidId}`,
        headers: {
          "Content-Type": "application/json",
        },
      });

      // This should either return 400 (bad request) or 500 (server error) depending on your error handling
      expect([400, 500]).toContain(res.statusCode);
    });
  });

  describe("JWT Token Validation", () => {
    let validToken: string;
    let userId: string;

    beforeAll(async () => {
      // Create user and get token
      const uniqueEmail = `jwttest${Date.now()}@example.com`;
      await fastifyApp.inject({
        method: "POST",
        url: "/register",
        payload: {
          email: uniqueEmail,
          password: "TestPassword123!",
          username: "jwtuser",
        },
      });

      const loginRes = await fastifyApp.inject({
        method: "POST",
        url: "/login",
        payload: {
          email: uniqueEmail,
          password: "TestPassword123!",
          username: "jwtuser",
        },
      });

      const loginBody = loginRes.json();
      validToken = loginBody.token;
      userId = loginBody.userId;
    });

    test("Token should contain valid user information", () => {
      expect(validToken).toBeDefined();
      expect(typeof validToken).toBe("string");
      expect(validToken.split(".")).toHaveLength(3); // JWT has 3 parts
    });

    test("Should be able to decode JWT token", () => {
      // Decode JWT payload (base64)
      const tokenParts = validToken.split(".");
      const payload = JSON.parse(
        Buffer.from(tokenParts[1], "base64").toString()
      );

      expect(payload).toHaveProperty("userId");
      expect(payload).toHaveProperty("username");
      expect(payload.username).toBe("jwtuser");
    });
  });
});
