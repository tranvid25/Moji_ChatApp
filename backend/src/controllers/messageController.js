import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Block from "../models/Block.js";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";
import { io } from "../socket/index.js";
import { uploadImageFromBuffer } from "../middlewares/uploadMiddleware.js";
import fs from "fs";
import path from "path";

const saveFileLocally = (buffer, originalname) => {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = path.extname(originalname);
  const fileName = uniqueSuffix + ext;
  const filePath = path.join(process.cwd(), "uploads", "files", fileName);
  fs.writeFileSync(filePath, buffer);
  return {
    fileUrl: `/uploads/files/${fileName}`,
    fileName: originalname
  };
};

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
    let fileUrl = null;
    let fileName = null;
    let fileSize = null;
    let msgType = req.body.type || (finalImgUrl ? "image" : "text");

    if (file?.buffer) {
      fileSize = file.size; // Or file.buffer.length
      if (file.mimetype.startsWith("image/")) {
        const uploadResult = await uploadImageFromBuffer(file.buffer, {
          folder: "moji_chat/messages",
          transformation: [{ width: 1200, height: 1200, crop: "limit" }],
        });
        finalImgUrl = uploadResult?.secure_url;
        if (!req.body.type) msgType = "image";
      } else {
        const result = saveFileLocally(file.buffer, file.originalname);
        fileUrl = result.fileUrl;
        fileName = result.fileName;
        if (!req.body.type) {
          if (file.mimetype.startsWith("audio/")) {
              msgType = "audio";
          } else {
              msgType = "file";
          }
        }
      }
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
      fileUrl,
      fileName,
      fileSize,
      type: msgType,
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

    let finalImgUrl = req.body.imgUrl || null;
    let fileUrl = null;
    let fileName = null;
    let fileSize = null;
    let msgType = req.body.type || (finalImgUrl ? "image" : "text");

    if (file?.buffer) {
      fileSize = file.size;
      if (file.mimetype.startsWith("image/")) {
        const uploadResult = await uploadImageFromBuffer(file.buffer, {
          folder: "moji_chat/messages",
          transformation: [{ width: 1200, height: 1200, crop: "limit" }],
        });
        finalImgUrl = uploadResult?.secure_url;
        if (!req.body.type) msgType = "image";
      } else {
        const result = saveFileLocally(file.buffer, file.originalname);
        fileUrl = result.fileUrl;
        fileName = result.fileName;
        if (!req.body.type) {
          if (file.mimetype.startsWith("audio/")) {
              msgType = "audio";
          } else {
              msgType = "file";
          }
        }
      }
    }

    const message = await Message.create({
      conversationId,
      senderId,
      content: content || null,
      imgUrl: finalImgUrl,
      fileUrl,
      fileName,
      fileSize,
      type: msgType,
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
