const axios = require("axios");

const sendBrevoEmail = async (to, subject, html) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "UniHub",
          email: process.env.EMAIL_FROM,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.BREVO_API_KEY,
        },
      }
    );

    console.log("📧 Brevo email sent:", response.status);
    return { success: true };
  } catch (err) {
    console.error(
      "❌ Brevo email failed:",
      err.response?.data || err.message
    );
    return { success: false };
  }
};

module.exports = sendBrevoEmail;

