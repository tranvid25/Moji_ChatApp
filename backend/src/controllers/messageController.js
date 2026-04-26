import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Block from "../models/Block.js";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";
import { io } from "../socket/index.js";
import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId, imgUrl } = req.body;
    const senderId = req.user._id;
    const file = req.file;
    let conversation = null;

    if (!content && !imgUrl && !file) {
      return res
        .status(400)
        .json({ message: "Nội dung tin nhắn không được để trống" });
    }

    let finalImgUrl = imgUrl || null;
    if (file?.buffer) {
      const uploadResult = await uploadImageFromBuffer(file.buffer, {
        folder: "moji_chat/messages",
        transformation: [{ width: 1200, height: 1200, crop: "limit" }],
      });
      finalImgUrl = uploadResult?.secure_url;
    }
    // Tìm xem 2 người đó đã nhắn nếu có thì tiếp tục
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    }

    const blockedRecord = await Block.findOne({
      blocker: { $in: [senderId, recipientId] },
      blocked: { $in: [senderId, recipientId] },
    });

    if (blockedRecord) {
      return res.status(403).json({
        code: "DIRECT_MESSAGE_BLOCKED",
        message: "Không thể gửi tin nhắn vì một trong hai đã chặn người kia",
      });
    }

    // Nếu không có thì tạo hộp thoại mới
    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [
          { userId: senderId, joinedAt: new Date() },
          { userId: recipientId, joinedAt: new Date() },
        ],
        lastMessageAt: new Date(),
        unreadCount: new Map(),
      });
    }
    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      content: content || null,
      imgUrl: finalImgUrl,
      type: finalImgUrl ? "image" : "text",
    });
    updateConversationAfterCreateMessage(conversation, senderId, message);
    await conversation.save();
    emitNewMessage(io, conversation, message);
    return res.status(200).json({
      message,
    });
  } catch (error) {
    console.log("Lỗi khi gửi tin nhắn trực tiếp", error);
    return res.status(500).json({
      message: "Lỗi hệ thống",
    });
  }
};
export const sendGroupMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user._id;
    const conversation = req.conversation;
    const file = req.file;

    if (!content && !file) {
      return res
        .status(400)
        .json({ message: "Nội dung tin nhắn không được để trống" });
    }

    let finalImgUrl = null;
    if (file?.buffer) {
      const uploadResult = await uploadImageFromBuffer(file.buffer, {
        folder: "moji_chat/messages",
        transformation: [{ width: 1200, height: 1200, crop: "limit" }],
      });
      finalImgUrl = uploadResult?.secure_url;
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content: content || null,
      imgUrl: finalImgUrl,
      type: finalImgUrl ? "image" : "text",
    });
    updateConversationAfterCreateMessage(conversation, senderId, message);
    await conversation.save();
    emitNewMessage(io, conversation, message);
    return res.status(200).json({ message });
  } catch (error) {
    console.log("Lỗi khi gửi tin nhắn nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
