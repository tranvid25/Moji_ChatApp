import express from "express";
import {
  blockUser,
  changePassword,
  getBlockCandidates,
  getMyBlockedUsers,
  leaveConversation,
  renameGroupConversation,
  toggleGroupMute,
  reportUser,
  unblockUser,
  updateNotificationSettings,
  updateOnlineStatusPreference,
} from "../controllers/settingsController.js";

const router = express.Router();

router.patch("/privacy/online-status", updateOnlineStatusPreference);
router.patch("/notifications", updateNotificationSettings);
router.patch("/password", changePassword);

router.get("/blocks/candidates", getBlockCandidates);
router.get("/blocks", getMyBlockedUsers);
router.post("/blocks", blockUser);
router.delete("/blocks/:blockedUserId", unblockUser);

router.post("/reports", reportUser);
router.post("/conversations/:conversationId/leave", leaveConversation);
router.patch("/conversations/:conversationId/name", renameGroupConversation);
router.patch("/conversations/:conversationId/mute", toggleGroupMute);

export default router;
