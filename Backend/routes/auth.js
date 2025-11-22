const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// In-memory OTP store (in production, use Redis or database)
// Structure: { email: { otp: string, expiresAt: Date, verified: boolean } }
const otpStore = new Map();

// OTP expiration time (10 minutes)
const OTP_EXPIRATION_TIME = 10 * 60 * 1000;

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Clean expired OTPs
function cleanExpiredOTPs() {
    const now = new Date();
    for (const [email, data] of otpStore.entries()) {
        if (data.expiresAt < now) {
            otpStore.delete(email);
        }
    }
}

// Sign Up
router.post('/signup', async (req, res) => {
    try {
        const { email, name, password, loginId } = req.body;

        // Validation
        if (!email || !password || !loginId) {
            return res.status(400).json({ message: 'Email, login ID, and password are required' });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                name: name || loginId,
                password: hashedPassword,
            },
        });

        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Error creating user' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { loginId, password } = req.body;

        // Validation
        if (!loginId || !password) {
            return res.status(400).json({ message: 'Login ID and password are required' });
        }

        // Find user by email (using loginId as email for now)
        const user = await prisma.user.findUnique({ where: { email: loginId } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find user by email
        const user = await prisma.user.findUnique({ where: { email } });
        
        // For security, don't reveal if user exists or not
        if (!user) {
            // Still return success to prevent email enumeration
            return res.json({ 
                message: 'If an account exists with this email, an OTP has been sent.' 
            });
        }

        // Clean expired OTPs
        cleanExpiredOTPs();

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + OTP_EXPIRATION_TIME);

        // Store OTP
        otpStore.set(email, {
            otp,
            expiresAt,
            verified: false
        });

        // In production, send OTP via email/SMS
        // For now, we'll log it (remove in production)
        console.log(`OTP for ${email}: ${otp} (expires in 10 minutes)`);

        // TODO: Send OTP via email service (nodemailer, SendGrid, etc.)
        // await sendOTPEmail(email, otp);

        res.json({ 
            message: 'OTP has been sent to your email',
            // Remove this in production - only for development
            otp: process.env.NODE_ENV === 'development' ? otp : undefined
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Error processing forgot password request' });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        // Clean expired OTPs
        cleanExpiredOTPs();

        // Get stored OTP data
        const storedData = otpStore.get(email);

        if (!storedData) {
            return res.status(400).json({ message: 'OTP not found or expired. Please request a new OTP.' });
        }

        // Check if OTP is expired
        if (storedData.expiresAt < new Date()) {
            otpStore.delete(email);
            return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
        }

        // Check if OTP matches
        if (storedData.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Mark OTP as verified
        storedData.verified = true;
        otpStore.set(email, storedData);

        // Generate a temporary token for password reset (valid for 15 minutes)
        const resetToken = jwt.sign(
            { email, type: 'password-reset' },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.json({ 
            message: 'OTP verified successfully',
            resetToken
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ message: 'Error verifying OTP' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({ message: 'Reset token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Verify reset token
        let decoded;
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
            if (decoded.type !== 'password-reset') {
                return res.status(400).json({ message: 'Invalid reset token' });
            }
        } catch (error) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        const { email } = decoded;

        // Verify OTP was verified
        const storedData = otpStore.get(email);
        if (!storedData || !storedData.verified) {
            return res.status(400).json({ message: 'OTP not verified. Please verify OTP first.' });
        }

        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        // Remove OTP from store
        otpStore.delete(email);

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Error resetting password' });
    }
});

module.exports = router;
