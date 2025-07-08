import User from '../model/User.js';
import emailService from '../services/email.js';
import emailTemplates from '../templates/emailTemplates.js';
import jwt from 'jsonwebtoken';
import loggerUtil from "../utils/logger.js";
import bcrypt from 'bcryptjs';

const registerUser = async ({ firstName, lastName, email, password, roleId, status }, session) => {
    let emailSent = false;
    try {
        const user = await User.findOne({ email }).session(session);
        if (user) {
            throw new AppError("This email address is already in use", 400);
        }

        // Encrypt password
        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            roleId,
            status,
        });
        await newUser.save({ session });

        const token = jwt.sign(
        { email: newUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
        );
        const activationLink = `${process.env.FRONTEND_URL}/activate-account/${token}`;

        if (!emailSent) {
            const emailTemplate = emailTemplates.generateWelcomeEmailTemplate({ firstName, activationLink });
            const senderEmail = process.env.EMAIL_USERNAME;
            const recipientEmail = email;
            emailService.sendEmail(senderEmail, recipientEmail, emailTemplate.subject, emailTemplate.message);
            loggerUtil.info(`RegisterUser Service: Try to send the email for registered users.`);
        }

    } catch (err) {
        console.log(err)
        throw err.isOperational ? err : new Error(`UserService - registerUser : ${err.message}`);
    }
};

const userService = {
registerUser
};
export default userService;