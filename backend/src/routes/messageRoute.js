import express from "express";
import {
  sendDirectMessage,
  sendGroupMessage,
  saveCallHistoryMessage,
} from "../controllers/messageController.js";
import {
  checkFriendship,
  checkGroupMembers,
} from "../middlewares/friendMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { locationRateLimiter, gifRateLimiter } from "../middlewares/rateLimitMiddleware.js";

const router = express.Router();
router.post("/direct", upload.single("file"), checkFriendship, locationRateLimiter, gifRateLimiter, sendDirectMessage);
router.post("/group", upload.single("file"), checkGroupMembers, locationRateLimiter, gifRateLimiter, sendGroupMessage);
router.post("/call-history", saveCallHistoryMessage);

export default router;
