import express from "express";
import {
  sendDirectMessage,
  sendGroupMessage,
} from "../controllers/messageController.js";
import {
  checkFriendship,
  checkGroupMembers,
} from "../middlewares/friendMiddleware.js";
const router = express.Router();
router.post("/direct", checkFriendship, sendDirectMessage);
router.post("/group", checkGroupMembers, sendGroupMessage);
export default router;
