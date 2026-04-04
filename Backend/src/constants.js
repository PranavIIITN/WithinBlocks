module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || "changethislater",
  JWT_EXPIRES_IN: "7d",
  INVITE_TOKEN_EXPIRY_HOURS: 24,
};