import express from "express";
import { createAppointment, getAppointments } from "../controllers/appointmentController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protectedRoute, createAppointment);
router.get("/", protectedRoute, getAppointments);

export default router;
