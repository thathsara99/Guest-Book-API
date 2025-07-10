import nodemailer from 'nodemailer';

import loggerUtil from '../utils/logger.js';

/**
 * Sends an email using Nodemailer.
 * @param {string} senderEmail - The email address of the sender.
 * @param {string} recipientEmail - The email address of the recipient.
 * @param {string} subject - The subject of the email.
 * @param {string} htmlContent - The HTML content of the email body.
 * @param {string} smtpConfig - SMTP configuration object { host, port, secure, auth: { user, pass } }.
 */
const sendEmail = async (senderEmail, recipientEmail, subject, htmlContent) => {
  try {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, 
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      // later I need to remove this part
      tls: {
        rejectUnauthorized: false
      }
    });

    let info = await transporter.sendMail({
      from: senderEmail,
      to: recipientEmail,
      subject: subject,
      html: htmlContent,
    });

    loggerUtil.info(`Email reset token sent: ${info.messageId}`);

  } catch (err) {
    loggerUtil.error(`Email service: ${err.message}`);
  }
};

const emailService = { sendEmail };
export default emailService;