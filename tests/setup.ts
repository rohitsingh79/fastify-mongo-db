// Global test setup
jest.setTimeout(30000); // 30 second timeout for all tests

// Mock console.log to reduce noise during tests
const originalLog = console.log;
console.log = (...args) => {
  // Only log if not in test environment or if explicitly needed
  if (process.env.NODE_ENV !== "test" || process.env.VERBOSE_TESTS === "true") {
    originalLog(...args);
  }
};

// Set test environment
process.env.NODE_ENV = "test";
