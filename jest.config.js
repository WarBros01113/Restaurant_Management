module.exports = {
  testEnvironment: "jsdom",
  transformIgnorePatterns: ["node_modules/(?!(msw|@bundled-es-modules)/)"],
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },
};
