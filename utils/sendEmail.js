const { transporter } = require('../config/mail');

/**
 * Reusable email sender
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email body
 * @param {string} text - Plain text email body (optional)
 * @returns {Promise} Email send result
 */
const sendEmail = async (to, subject, html, text = null) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      ...(text && { text }),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error.message);
    throw error;
  }
};

module.exports = sendEmail;

