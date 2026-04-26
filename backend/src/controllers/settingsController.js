import bcrypt from "bcrypt";
import User from "../models/User.js";
import Block from "../models/Block.js";
import Report from "../models/Report.js";
import Friend from "../models/Friend.js";
import Conversation from "../models/Conversation.js";
import { io } from "../socket/index.js";

const pair = (a, b) => (a < b ? [a, b] : [b, a]);

export const updateOnlineStatusPreference = async (req, res) => {
  try {
    const userId = req.user._id;
    const { showOnlineStatus } = req.body;

    if (typeof showOnlineStatus !== "boolean") {
      return res
        .status(400)
        .json({ message: "showOnlineStatus phải là boolean" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { "preferences.privacy.showOnlineStatus": showOnlineStatus } },
      { new: true },
    ).select("preferences");

    return res.status(200).json({
      message: "Cập nhật trạng thái online thành công",
      preferences: user?.preferences,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái online", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { friendRequest, directMessage, groupMessage } = req.body;

    const payload = {};
    if (typeof friendRequest === "boolean") {
      payload["preferences.notifications.friendRequest"] = friendRequest;
    }
    if (typeof directMessage === "boolean") {
      payload["preferences.notifications.directMessage"] = directMessage;
    }
    if (typeof groupMessage === "boolean") {
      payload["preferences.notifications.groupMessage"] = groupMessage;
    }

    if (Object.keys(payload).length === 0) {
      return res
        .status(400)
        .json({ message: "Không có cài đặt thông báo hợp lệ" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: payload },
      { new: true },
    ).select("preferences");

    return res.status(200).json({
      message: "Cập nhật cài đặt thông báo thành công",
      preferences: user?.preferences,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật cài đặt thông báo", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Cần nhập mật khẩu hiện tại và mật khẩu mới" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu mới cần ít nhất 6 ký tự" });
    }

    const user = await User.findById(userId).select("password");
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi khi đổi mật khẩu", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getBlockCandidates = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    const [friendsA, friendsB] = await Promise.all([
      Friend.find({ userA: userId }).populate(
        "userB",
        "_id displayName username avatarUrl",
      ),
      Friend.find({ userB: userId }).populate(
        "userA",
        "_id displayName username avatarUrl",
      ),
    ]);

    const friends = [
      ...friendsA.map((f) => f.userB),
      ...friendsB.map((f) => f.userA),
    ];

    const blockedList = await Block.find({ blocker: userId }).select("blocked");
    const blockedSet = new Set(blockedList.map((b) => b.blocked.toString()));

    const candidates = friends.map((f) => ({
      _id: f?._id,
      displayName: f?.displayName,
      username: f?.username,
      avatarUrl: f?.avatarUrl ?? null,
      isBlocked: blockedSet.has(f?._id?.toString()),
    }));

    return res.status(200).json({ candidates });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách chặn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const blockUser = async (req, res) => {
  try {
    const blockerId = req.user._id.toString();
    const { blockedUserId } = req.body;

    if (!blockedUserId) {
      return res.status(400).json({ message: "Thiếu blockedUserId" });
    }

    if (blockedUserId.toString() === blockerId) {
      return res.status(400).json({ message: "Không thể tự chặn chính mình" });
    }

    const [userA, userB] = pair(blockerId, blockedUserId.toString());
    const isFriend = await Friend.findOne({ userA, userB });
    if (!isFriend) {
      return res
        .status(400)
        .json({ message: "Chỉ có thể chặn người đã kết bạn" });
    }

    await Block.updateOne(
      { blocker: blockerId, blocked: blockedUserId },
      { $setOnInsert: { blocker: blockerId, blocked: blockedUserId } },
      { upsert: true },
    );

    io.to(blockerId).emit("block-updated", {
      blockedUserId,
      type: "blocked",
    });

    return res.status(200).json({ message: "Đã chặn người dùng" });
  } catch (error) {
    console.error("Lỗi khi chặn người dùng", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const blockerId = req.user._id.toString();
    const { blockedUserId } = req.params;

    await Block.deleteOne({ blocker: blockerId, blocked: blockedUserId });

    io.to(blockerId).emit("block-updated", {
      blockedUserId,
      type: "unblocked",
    });

    return res.status(200).json({ message: "Đã bỏ chặn người dùng" });
  } catch (error) {
    console.error("Lỗi khi bỏ chặn người dùng", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const getMyBlockedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const blocked = await Block.find({ blocker: userId }).populate(
      "blocked",
      "_id displayName username avatarUrl",
    );

    const users = blocked.map((b) => b.blocked);
    return res.status(200).json({ users });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bị chặn", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const reportUser = async (req, res) => {
  try {
    const reporterId = req.user._id;
    const { targetUserId, reason, conversationId = null } = req.body;

    if (!targetUserId || !reason) {
      return res
        .status(400)
        .json({ message: "Cần targetUserId và nội dung báo cáo" });
    }

    await Report.create({
      reporter: reporterId,
      targetUser: targetUserId,
      reason,
      conversationId,
    });

    return res.status(201).json({ message: "Báo cáo đã được ghi nhận" });
  } catch (error) {
    console.error("Lỗi khi báo cáo người dùng", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const leaveConversation = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Hộp thoại không tồn tại" });
    }

    if (conversation.type !== "group") {
      return res.status(400).json({ message: "Chỉ áp dụng cho nhóm" });
    }

    const before = conversation.participants.length;
    conversation.participants = conversation.participants.filter(
      (p) => p.userId.toString() !== userId,
    );

    if (conversation.participants.length === before) {
      return res.status(400).json({ message: "Bạn không thuộc nhóm này" });
    }

    conversation.mutedBy = (conversation.mutedBy || []).filter(
      (id) => id.toString() !== userId,
    );

    await conversation.save();

    io.to(conversationId).emit("conversation-member-left", {
      conversationId,
      userId,
    });

    return res.status(200).json({ message: "Đã rời nhóm" });
  } catch (error) {
    console.error("Lỗi khi rời nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const renameGroupConversation = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { conversationId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tên nhóm không được để trống" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Nhóm không tồn tại" });
    }

    const isMember = conversation.participants.some(
      (p) => p.userId.toString() === userId,
    );

    if (!isMember) {
      return res.status(403).json({ message: "Bạn không có quyền đổi tên nhóm" });
    }

    conversation.group = {
      ...conversation.group,
      name: name.trim(),
    };

    await conversation.save();

    io.to(conversationId).emit("group-renamed", {
      conversationId,
      name: conversation.group?.name,
    });

    return res.status(200).json({
      message: "Đổi tên nhóm thành công",
      conversation,
    });
  } catch (error) {
    console.error("Lỗi khi đổi tên nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

export const toggleGroupMute = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { conversationId } = req.params;
    const { muted } = req.body;

    if (typeof muted !== "boolean") {
      return res.status(400).json({ message: "muted phải là boolean" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.type !== "group") {
      return res.status(404).json({ message: "Nhóm không tồn tại" });
    }

    const isMember = conversation.participants.some(
      (p) => p.userId.toString() === userId,
    );
    if (!isMember) {
      return res.status(403).json({ message: "Bạn không thuộc nhóm này" });
    }

    if (muted) {
      conversation.mutedBy = Array.from(
        new Set([...(conversation.mutedBy || []).map((id) => id.toString()), userId]),
      );
    } else {
      conversation.mutedBy = (conversation.mutedBy || []).filter(
        (id) => id.toString() !== userId,
      );
    }

    await conversation.save();

    return res.status(200).json({
      message: muted ? "Đã tắt thông báo nhóm" : "Đã bật lại thông báo nhóm",
      muted,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật mute nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
