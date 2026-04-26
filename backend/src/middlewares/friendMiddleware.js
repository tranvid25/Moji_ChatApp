import Conversation from "../models/Conversation.js";
import Friend from "../models/Friend.js";
import Block from "../models/Block.js";

const pair = (a, b) => (a < b ? [a, b] : [b, a]);
export const checkFriendship = async (req, res, next) => {
  try {
    const me = req.user._id.toString();
    const recipientId = req.body?.recipientId ?? null;
    const memberIds = req.body?.memberIds ?? [];
    if (!recipientId && memberIds.length === 0) {
      return res.status(400).json({ message: "Người nhận không tồn tại" });
    }
    if (recipientId) {
      const [userA, userB] = pair(me, recipientId);
      const isFriend = await Friend.findOne({ userA, userB });
      if (!isFriend) {
        return res
          .status(400)
          .json({ message: "Bạn không phải là bạn bè với người này" });
      }
      return next();
    }
    // TODO: check group members
    const friendChecks = memberIds.map(async (memberId) => {
      const [userA, userB] = pair(me, memberId);
      const friend = await Friend.findOne({ userA, userB });
      return friend ? null : memberId;
    });
    const results = await Promise.all(friendChecks);
    const notFriends = results.filter(Boolean);
    if (notFriends.length > 0) {
      return res
        .status(400)
        .json({
          message: `Bạn không phải là bạn bè với ${notFriends.join(", ")}`,
        });
    }
    next();
  } catch (error) {
    console.error("Lỗi khi kiểm tra tình bạn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
export const checkGroupMembers = async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    const allowBlockedGroupMessage =
      req.body?.allowBlockedGroupMessage === true ||
      req.body?.allowBlockedGroupMessage === "true";
    const userId = req.user._id;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(400).json({ message: "Hộp thoại không tồn tại" });
    }
    const isMember = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString(),
    );
    if (!isMember) {
      return res
        .status(400)
        .json({ message: "Bạn không phải là thành viên của hộp thoại này" });
    }

    const participantIds = conversation.participants
      .map((p) => p.userId.toString())
      .filter((id) => id !== userId.toString());

    const blockedUsersInGroupRaw = await Block.find({
      blocker: userId,
      blocked: { $in: participantIds },
    }).select("blocked");

    const blockedUsersInGroup = blockedUsersInGroupRaw.map((b) =>
      b.blocked.toString(),
    );

    if (blockedUsersInGroup.length > 0 && !allowBlockedGroupMessage) {
      return res.status(409).json({
        code: "GROUP_BLOCKED_MEMBER_CONFIRM_REQUIRED",
        message:
          "Trong nhóm có người bạn đã chặn. Bạn có muốn tiếp tục nhắn tin không?",
        blockedUserIds: blockedUsersInGroup,
      });
    }

    req.conversation = conversation;
    req.blockedUsersInGroup = blockedUsersInGroup;
    next();
  } catch (error) {
    console.error("Lỗi khi kiểm tra thành viên nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
