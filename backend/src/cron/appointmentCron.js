import cron from "node-cron";
import Appointment from "../models/Appointment.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { sendReminderEmail } from "../services/emailService.js";
import { io } from "../socket/index.js";
import {
  emitNewMessage,
  updateConversationAfterCreateMessage,
} from "../utils/messageHelper.js";

// Chạy cron job mỗi phút
export const startAppointmentCron = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      // Tìm các cuộc hẹn cần được nhắc (thời gian nhắc <= hiện tại và chưa nhắc)
      const appointmentsToRemind = await Appointment.find({
        remindTime: { $lte: now },
        remindSent: false,
      }).populate('userId', 'email displayName'); // Lấy thêm email và tên từ userId

      for (const appointment of appointmentsToRemind) {
        const user = appointment.userId;
        if (user && user.email) {
          // 1. Gửi email
          await sendReminderEmail(user.email, user.displayName, appointment.title, appointment.startTime);
          
          // 2. Gửi socket notification
          io.to(user._id.toString()).emit("appointmentReminder", {
            appointmentId: appointment._id,
            title: appointment.title,
            startTime: appointment.startTime,
            conversationId: appointment.conversationId,
          });
        }
        
        // 3. Optional: Gửi link meeting vào cuộc trò chuyện nếu có conversationId
        if (appointment.conversationId) {
          const conversation = await Conversation.findById(appointment.conversationId);
          if (conversation) {
            const hasMeetingUrl = Boolean(appointment.meetingUrl && /^https:\/\//.test(appointment.meetingUrl.trim()));
            const content = hasMeetingUrl ? appointment.meetingUrl.trim() : `⏰ Lịch hẹn "${appointment.title}" sẽ diễn ra trong vòng 10 phút nữa vào lúc ${new Date(appointment.startTime).toLocaleString('vi-VN')}!`;
            const msgType = hasMeetingUrl ? "meeting" : "text";

            const message = await Message.create({
              conversationId: conversation._id,
              senderId: appointment.userId._id, // User tạo appointment
              content,
              type: msgType,
            });

            updateConversationAfterCreateMessage(conversation, appointment.userId._id, message);
            await conversation.save();
            emitNewMessage(io, conversation, message);
          }
        }
        
        // 3. Mark as sent
        appointment.remindSent = true;
        await appointment.save();
      }
    } catch (error) {
      console.error("Lỗi khi chạy cron job nhắc lịch hẹn:", error);
    }
  });
  console.log("Appointment cron job started.");
};
