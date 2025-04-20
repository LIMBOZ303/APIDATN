const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // **Email HTML Template Nâng Cao**
    const htmlTemplate = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mã Xác Minh OTP</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f5f7;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05); overflow: hidden; margin-top: 40px; margin-bottom: 40px;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%); padding: 30px 0; text-align: center;">
              <img src="../assets/logopng.png" alt="Logo" style="height: 40px; margin-bottom: 15px;">
              <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 600;">Xác Minh Tài Khoản</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #4B5563; margin-top: 0; margin-bottom: 25px; line-height: 1.6;">Xin chào,</p>
              <p style="font-size: 16px; color: #4B5563; margin-bottom: 25px; line-height: 1.6;">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi. Để hoàn tất quá trình xác minh, vui lòng sử dụng mã OTP dưới đây:</p>
              
              <!-- OTP Box -->
              <div style="text-align: center; margin: 35px 0;">
                <div style="display: inline-block; background-color: #F3F4F6; border-radius: 8px; padding: 20px 40px; border-left: 4px solid #4F46E5;">
                  <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px; margin: 0; color: #1F2937;">${otp}</p>
                </div>
              </div>
              
              <p style="font-size: 16px; color: #4B5563; margin-bottom: 25px; line-height: 1.6;">Mã xác minh này sẽ hết hạn sau <strong>5 phút</strong>.</p>
              <p style="font-size: 16px; color: #4B5563; margin-bottom: 35px; line-height: 1.6;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này hoặc liên hệ với bộ phận hỗ trợ của chúng tôi nếu bạn có bất kỳ thắc mắc nào.</p>
              
              <!-- Safety Tips -->
              <div style="background-color: #FFFBEB; border-radius: 8px; padding: 15px 20px; margin-bottom: 30px; border-left: 4px solid #F59E0B;">
                <p style="font-size: 15px; color: #92400E; margin: 0; font-weight: 600;">Lưu ý bảo mật:</p>
                <ul style="margin-top: 10px; margin-bottom: 0; padding-left: 20px; color: #B45309;">
                  <li style="margin-bottom: 5px;">Không chia sẻ mã OTP này với bất kỳ ai, kể cả nhân viên hỗ trợ.</li>
                  <li style="margin-bottom: 5px;">Chúng tôi không bao giờ yêu cầu mã OTP qua điện thoại hoặc tin nhắn.</li>
                  <li>Kiểm tra kỹ địa chỉ email người gửi để tránh lừa đảo.</li>
                </ul>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 20px 30px; border-top: 1px solid #E5E7EB;">
              <p style="color: #6B7280; font-size: 14px; margin: 0; text-align: center;">Cần hỗ trợ? <a href="#" style="color: #4F46E5; text-decoration: none; font-weight: 500;">Liên hệ với chúng tôi</a></p>
              <div style="text-align: center; margin-top: 15px;">
                <a href="#" style="display: inline-block; margin: 0 8px; color: #6B7280; text-decoration: none;">
                  <img src="../assets/fblogo.png" alt="Facebook" style="height: 20px; width: 20px;">
                </a>
                <a href="#" style="display: inline-block; margin: 0 8px; color: #6B7280; text-decoration: none;">
                  <img src="../assets/zllogo.webp" alt="Zalo" style="height: 20px; width: 20px;">
                </a>
                <a href="#" style="display: inline-block; margin: 0 8px; color: #6B7280; text-decoration: none;">
                  <img src="../assets/iglogo.webp" alt="Instagram" style="height: 20px; width: 20px;">
                </a>
              </div>
              <p style="color: #9CA3AF; font-size: 12px; margin-top: 20px; text-align: center;">
                © ${new Date().getFullYear()} WEDDING PLANNER. Tất cả các quyền được bảo lưu.<br>
                Địa chỉ: 123 Đường Nguyễn Văn Cừ, Quận 5, Hồ Chí Minh
              </p>
              <p style="color: #9CA3AF; font-size: 11px; margin-top: 15px; text-align: center;">
                Email này được gửi tự động, vui lòng không trả lời.
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"WEDDING PLANNER" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject,
      html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email gửi thành công:", to);
  } catch (error) {
    console.error("❌ Lỗi gửi email:", error);
    throw error;
  }
};

module.exports = { sendEmail };