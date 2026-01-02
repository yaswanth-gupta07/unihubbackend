const axios = require("axios");

const sendBrevoEmail = async (to, subject, html) => {
  try {

    console.log("📨 Sending email via Brevo to:", to);

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "UniHub",
          email: "unilancer.in@gmail.com",   // MUST be raw email only
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

    console.log("📧 Brevo email sent successfully:", response.status);
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
