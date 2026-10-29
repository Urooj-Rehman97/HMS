import helmet from "helmet";

// =====================================================
// SECURITY MIDDLEWARE
// =====================================================

const securityMiddleware = [
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },

    contentSecurityPolicy: false,

    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
  }),
];

export default securityMiddleware;