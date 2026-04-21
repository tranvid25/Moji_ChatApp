import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { updateConversationAfterCreateMessage } from "../utils/messageHelper.js";
export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, content, conversationId, imgUrl } = req.body;
    const senderId = req.user._id;
    let conversation = null;
    if (!content) {
      return res
        .status(400)
        .json({ message: "Nội dung tin nhắn không được để trống" });
    }
    // Tìm xem 2 người đó đã nhắn nếu có thì tiếp tục
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
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
      content,
      imgUrl,
    });
    updateConversationAfterCreateMessage(conversation, senderId, message);
    await conversation.save();
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
    if (!content) {
      return res
        .status(400)
        .json({ message: "Nội dung tin nhắn không được để trống" });
    }
    const message = await Message.create({
      conversationId,
      senderId,
      content,
    });
    updateConversationAfterCreateMessage(conversation, senderId, message);
    await conversation.save();
    return res.status(200).json({ message });
  } catch (error) {
    console.log("Lỗi khi gửi tin nhắn nhóm", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
