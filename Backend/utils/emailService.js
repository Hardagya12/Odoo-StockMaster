const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD.replace(/\s/g, '') // Remove all spaces from password
    }
});

// Function to send OTP email
const sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: `"StockMaster" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your OTP for Password Reset - StockMaster',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 3px solid #000; background-color: #fff;">
                <h1 style="color: #FF6B9D; border-bottom: 3px solid #000; padding-bottom: 10px;">StockMaster</h1>
                <h2 style="color: #000;">Password Reset OTP</h2>
                <p style="font-size: 16px; color: #333;">Hello,</p>
                <p style="font-size: 16px; color: #333;">You requested to reset your password. Please use the following OTP to verify your identity:</p>
                <div style="background-color: #f0f0f0; border: 3px solid #000; padding: 20px; margin: 20px 0; text-align: center;">
                    <h1 style="color: #FF6B9D; font-size: 48px; margin: 0; letter-spacing: 5px;">${otp}</h1>
                </div>
                <p style="font-size: 14px; color: #666;">This OTP will expire in 10 minutes.</p>
                <p style="font-size: 14px; color: #666;">If you didn't request this, please ignore this email.</p>
                <hr style="border: 1px solid #000; margin: 20px 0;">
                <p style="font-size: 12px; color: #999;">This is an automated message from StockMaster. Please do not reply.</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};

module.exports = { sendOTPEmail };
