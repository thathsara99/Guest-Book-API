const generateWelcomeEmailTemplate = ({ firstName, activationLink }) => {
    return {
        subject: "Welcome to Guest Book! Activate Your Account",
        message: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
                body {
                    font-family: 'Poppins', sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                }
                .email-container {
                    max-width: 60A0px;
                    margin: 30px auto;
                    background-color: #ffffff;
                    padding: 20px;
                    border-radius: 12px;
                    box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.1);
                    border-top: 5px solid #4CAF50;
                }
                .header {
                    text-align: center;
                    background-color: #2d3436;
                    color: #ffffff;
                    padding: 20px;
                    border-radius: 8px 8px 0 0;
                }
                .header img {
                    max-width: 100px;
                    margin-bottom: 10px;
                }
                .header h1 {
                    font-size: 24px;
                    margin: 0;
                }
                .content {
                    padding: 20px;
                }
                .content h2 {
                    font-size: 22px;
                    color: #2c3e50;
                    margin-bottom: 10px;
                }
                .content p {
                    font-size: 16px;
                    color: #555555;
                    line-height: 1.6;
                }
                .button {
                    display: inline-block;
                    margin: 20px 0;
                    padding: 12px 24px;
                    background-color: #4CAF50;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: bold;
                    font-size: 16px;
                }
                .footer {
                    text-align: center;
                    font-size: 14px;
                    color: #888888;
                    margin-top: 30px;
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <img src="https://res.cloudinary.com/dt5qfeqla/image/upload/v1751379044/Guest_Book_Logo_vp8jpf.png" alt="Guest Book Logo" />
                    <h1>Guest Book</h1>
                </div>
                <div class="content">
                    <h2>Hi ${firstName},</h2>
                    <p>Welcome to <strong>Guest Book</strong> – a place to share your thoughts and connect with others through posts and comments.</p>
                    <p>We're excited to have you on board! Please click the button below to activate your account and start engaging with the community.</p>
                    <p style="text-align: center;">
                        <a href="${activationLink}" class="button">Activate Account</a>
                    </p>
                    <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
                    <p style="word-break: break-all;">${activationLink}</p>
                    <p>Thank you,<br>— The Guest Book Team</p>
                </div>
                <div class="footer">
                    &copy; 2024 Guest Book. All rights reserved.
                </div>
            </div>
        </body>
        </html>
        `
    };
};

const generateForgotPasswordEmailTemplate = ({ firstName, resetLink }) => {
    return {
        subject: "Reset Your Password - Guest Book",
        message: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
                body { font-family: 'Poppins', sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
                .email-container { max-width: 600px; margin: 30px auto; background-color: #ffffff; padding: 20px; border-radius: 12px; box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.1); border-top: 5px solid #4CAF50; }
                .header { text-align: center; background-color: #2d3436; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0; }
                .header img { max-width: 100px; margin-bottom: 10px; }
                .header h1 { font-size: 24px; margin: 0; }
                .content { padding: 20px; }
                .content h2 { font-size: 22px; color: #2c3e50; margin-bottom: 10px; }
                .content p { font-size: 16px; color: #555555; line-height: 1.6; }
                .button { display: inline-block; margin: 20px 0; padding: 12px 24px; background-color: #4CAF50; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; }
                .footer { text-align: center; font-size: 14px; color: #888888; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <img src="https://res.cloudinary.com/dt5qfeqla/image/upload/v1751379044/Guest_Book_Logo_vp8jpf.png" alt="Guest Book Logo" />
                    <h1>Guest Book</h1>
                </div>
                <div class="content">
                    <h2>Hi ${firstName},</h2>
                    <p>We received a request to reset your password for your <strong>Guest Book</strong> account.</p>
                    <p>Please click the button below to reset your password. This link will expire in 1 hour for your security.</p>
                    <p style="text-align: center;">
                        <a href="${resetLink}" class="button">Reset Password</a>
                    </p>
                    <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
                    <p style="word-break: break-all;">${resetLink}</p>
                    <p>If you did not request a password reset, please ignore this email or contact support.</p>
                    <p>Thank you,<br>— The Guest Book Team</p>
                </div>
                <div class="footer">
                    &copy; 2024 Guest Book. All rights reserved.
                </div>
            </div>
        </body>
        </html>
        `
    };
};

const emailTemplates = { generateWelcomeEmailTemplate, generateForgotPasswordEmailTemplate };
export default emailTemplates;
