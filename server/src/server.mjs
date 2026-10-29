import app from "./app.mjs";
import connectDB from "./config/db.mjs";
import env from "./config/env.mjs";

const startServer = async () => {
  try {
    await connectDB();

    app.listen(env.PORT, () => {
      console.log(
        `LuxuryStay HMS Server running on http://localhost:${env.PORT}`
      );
    });
  } catch (error) {
    console.error(`Server Startup Error: ${error.message}`);
    process.exit(1);
  }
};

startServer();