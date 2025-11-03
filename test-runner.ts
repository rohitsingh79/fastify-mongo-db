// Simple test runner for auth routes
import { app } from "./src/app";

async function runTests() {
  console.log("Starting Auth Route Tests...\n");

  const fastifyApp = await app();
  await fastifyApp.ready();

  let passed = 0;
  let failed = 0;

  // Test helper function
  const test = async (name: string, testFn: () => Promise<void>) => {
    try {
      await testFn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}`);
      console.log(
        `   Error: ${error instanceof Error ? error.message : error}`
      );
      failed++;
    }
  };

  // Test 1: Register a new user successfully
  await test("Should register a new user successfully", async () => {
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

    if (res.statusCode !== 201) {
      throw new Error(
        `Expected status 201, got ${res.statusCode}. Response: ${res.body}`
      );
    }

    const body = res.json();
    if (!body.message || body.message !== "user is registered successfully") {
      throw new Error(`Expected success message, got: ${JSON.stringify(body)}`);
    }

    if (!body.userId || !body.username) {
      throw new Error(
        `Missing userId or username in response: ${JSON.stringify(body)}`
      );
    }

    // Verify the username matches what we sent
    if (body.username !== "testuser") {
      throw new Error(`Expected username 'testuser', got '${body.username}'`);
    }
  });

  // Test 2: Register user with existing email should fail
  await test("Should fail when registering user with existing email", async () => {
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

    if (res.statusCode !== 409) {
      throw new Error(
        `Expected status 409, got ${res.statusCode}. Response: ${res.body}`
      );
    }

    const body = res.json();
    if (!body.message || body.message !== "User already exists") {
      throw new Error(
        `Expected 'User already exists' message, got: ${JSON.stringify(body)}`
      );
    }
  });

  // Test 3: Login with correct credentials
  await test("Should login successfully with correct credentials", async () => {
    const testUser = {
      email: `logintest${Date.now()}@example.com`,
      password: "TestPassword123!",
      username: "loginuser",
    };

    // First create the user
    await fastifyApp.inject({
      method: "POST",
      url: "/register",
      payload: testUser,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Then try to login
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

    if (res.statusCode !== 200) {
      throw new Error(
        `Expected status 200, got ${res.statusCode}. Response: ${res.body}`
      );
    }

    const body = res.json();
    if (!body.token || !body.userId) {
      throw new Error(
        `Missing token or userId in response: ${JSON.stringify(body)}`
      );
    }

    if (typeof body.token !== "string" || body.token.length === 0) {
      throw new Error(`Invalid token received: ${body.token}`);
    }
  });

  // Test 4: Login with incorrect password
  await test("Should fail login with incorrect password", async () => {
    const testUser = {
      email: `wrongpass${Date.now()}@example.com`,
      password: "TestPassword123!",
      username: "wronguser",
    };

    // First create the user
    await fastifyApp.inject({
      method: "POST",
      url: "/register",
      payload: testUser,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Try to login with wrong password
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

    if (res.statusCode !== 400) {
      throw new Error(
        `Expected status 400, got ${res.statusCode}. Response: ${res.body}`
      );
    }

    const body = res.json();
    if (!body.message || body.message !== "Invalid credentials") {
      throw new Error(
        `Expected 'Invalid credentials' message, got: ${JSON.stringify(body)}`
      );
    }
  });

  // Test 5: Get all users
  await test("Should get all users", async () => {
    const res = await fastifyApp.inject({
      method: "GET",
      url: "/Users/ALL",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.statusCode !== 200) {
      throw new Error(
        `Expected status 200, got ${res.statusCode}. Response: ${res.body}`
      );
    }

    const body = res.json();
    if (!Array.isArray(body)) {
      throw new Error(`Expected array response, got: ${typeof body}`);
    }
  });

  await fastifyApp.close();

  console.log(`\n🎯 Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total: ${passed + failed}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log("All tests passed!");
  }
}

// Run the tests
runTests().catch((error) => {
  console.error("Test runner failed:", error);
  process.exit(1);
});
