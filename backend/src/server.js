import express from 'express';
import dotenv from "dotenv";
import connectDB from './config/database.js';
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import cookieParser from 'cookie-parser';
import { protectedRoute } from './middlewares/authMiddleware.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cookieParser());
// public route
app.use("/api/auth", authRoute);

app.use(protectedRoute);
app.use("/api/users",userRoute);
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