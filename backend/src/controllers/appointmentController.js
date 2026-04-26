import Appointment from "../models/Appointment.js";

export const createAppointment = async (req, res) => {
  try {
    const { title, description, startTime, endTime, conversationId, meetingUrl } = req.body;
    const userId = req.user._id;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    // Tính thời gian nhắc trước 10 phút
    const remindTime = new Date(start.getTime() - 10 * 60000);

    const newAppointment = await Appointment.create({
      title,
      description,
      startTime: start,
      endTime: end,
      remindTime,
      userId,
      conversationId,
      meetingUrl,
      remindSent: false,
    });

    return res.status(201).json(newAppointment);

  } catch (error) {
    console.error("Lỗi khi tạo lịch hẹn:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};

export const getAppointments = async (req, res) => {
  try {
    const userId = req.user._id;
    const appointments = await Appointment.find({ userId }).sort({ startTime: -1 });
    return res.status(200).json(appointments);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách lịch hẹn:", error);
    return res.status(500).json({ message: "Lỗi Server" });
  }
};
