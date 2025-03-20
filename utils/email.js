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

    // **Email HTML Template**
    const htmlTemplate = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
                <h2 style="color: #333; text-align: center;">🔐 Mã Xác Minh OTP</h2>
                <p style="font-size: 16px; color: #555;">Xin chào,</p>
                <p style="font-size: 16px; color: #555;">Bạn đang thực hiện một yêu cầu xác minh. Đây là mã OTP của bạn:</p>
                <div style="text-align: center; font-size: 24px; font-weight: bold; color: #007bff; padding: 10px; border: 2px dashed #007bff; display: inline-block; margin: 20px auto;">
                    ${otp}
                </div>
                <p style="font-size: 14px; color: #999;">Mã OTP này có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
                <hr>
                <p style="font-size: 12px; color: #999; text-align: center;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
            </div>
        `;

    const mailOptions = {
      from: `"Hỗ trợ" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject,
      html: htmlTemplate, // Sử dụng HTML template ở trên
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email gửi thành công:", to);
  } catch (error) {
    console.error("❌ Lỗi gửi email:", error);
    throw error;
  }
};

module.exports = { sendEmail };
