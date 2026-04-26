import * as brevo from '@sendinblue/client';
import dotenv from 'dotenv';
dotenv.config();

const apiInstance = new brevo.TransactionalEmailsApi();

// Cấu hình API key
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY || "YOUR_BREVO_API_KEY"
);

export const sendReminderEmail = async (toEmail, toName, title, startTime) => {
  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = `Nhắc nhở: Lịch hẹn sắp diễn ra`;
    sendSmtpEmail.htmlContent = `
      <html>
        <body>
          <h2>Xin chào ${toName},</h2>
          <p>Bạn có một lịch hẹn <strong>${title}</strong> sẽ diễn ra trong vòng 10 phút nữa.</p>
          <p>Thời gian bắt đầu: ${new Date(startTime).toLocaleString('vi-VN')}</p>
          <p>Hãy chuẩn bị sẵn sàng nhé!</p>
        </body>
      </html>
    `;
    sendSmtpEmail.sender = { "name": "TVChat", "email": process.env.BREVO_SENDER_EMAIL || "noreply@tvchat.com" };
    sendSmtpEmail.to = [
      { "email": toEmail, "name": toName }
    ];

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Email reminder sent to ${toEmail}`);
  } catch (error) {
    console.error("Lỗi khi gửi email qua Brevo:", error);
  }
};
