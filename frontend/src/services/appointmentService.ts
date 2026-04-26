import api from "@/lib/axios";

export interface AppointmentData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  conversationId?: string;
  meetingUrl?: string;
}

export const appointmentService = {
  createAppointment: async (data: AppointmentData) => {
    const res = await api.post("/appointments", data);
    return res.data;
  },
  getAppointments: async () => {
    const res = await api.get("/appointments");
    return res.data;
  },
};
