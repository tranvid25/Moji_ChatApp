import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import cookieParser from "cookie-parser";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import cors from "cors";
import friendRoute from "./routes/friendRoute.js";
import messageRoute from "./routes/messageRoute.js";
import conversationRoute from "./routes/conversationRoute.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

//swagger
const swaggerDocument=JSON.parse(fs.readFileSync("./src/swagger.json","utf8"));
app.use("/api-docs",swaggerUi.serve,swaggerUi.setup(swaggerDocument));
// public route
app.use("/api/auth", authRoute);

app.use(protectedRoute);
app.use("/api/user", userRoute);
app.use("/api/friends", friendRoute);
app.use("/api/messages", messageRoute);
app.use("/api/conversations", conversationRoute);
// connect DB rồi mới start server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server bắt đầu trên cổng ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("DB connect fail:", error);
  });
