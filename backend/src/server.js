import express from "express";
import dotenv from "dotenv";
import path from "path";
import connectDB from "./config/database.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import cookieParser from "cookie-parser";
import { protectedRoute } from "./middlewares/authMiddleware.js";
import cors from "cors";
import friendRoute from "./routes/friendRoute.js";
import messageRoute from "./routes/messageRoute.js";
import conversationRoute from "./routes/conversationRoute.js";
import settingsRoute from "./routes/settingsRoute.js";
import groupCallRoute from "./routes/groupCallRoute.js";
import appointmentRoute from "./routes/appointmentRoute.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import { io } from "./socket/index.js";
import http from "http";
import cloudinary from "cloudinary";
import { startAppointmentCron } from "./cron/appointmentCron.js";
dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:5173"].filter(
  Boolean,
);

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));
//cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
//swagger
const swaggerDocument = JSON.parse(
  fs.readFileSync("./src/swagger.json", "utf8"),
);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Serve files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// public route
app.use("/api/auth", authRoute);

app.use(protectedRoute);
app.use("/api/user", userRoute);
app.use("/api/friends", friendRoute);
app.use("/api/messages", messageRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/settings", settingsRoute);
app.use("/api/group-call", groupCallRoute);
app.use("/api/appointments", appointmentRoute);

// connect DB rồi mới start server
connectDB()
  .then(() => {
    io.attach(server);
    startAppointmentCron();
    server.listen(PORT, () => {
      console.log(`Server bắt đầu trên cổng ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("DB connect fail:", error);
  });
