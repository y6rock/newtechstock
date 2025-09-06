const nodemailer = require('nodemailer');
const fs = require('fs');

class EmailService {
    constructor() {
        // Check if email credentials are configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email credentials not configured. Invoice emails will not be sent.');
            this.transporter = null;
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    async sendInvoiceEmail(userEmail, userName, orderId, invoicePath) {
        if (!this.transporter) {
            console.log('Email service not configured. Skipping invoice email.');
            return false;
        }

        try {
            const mailOptions = {
                from: 'TechStock <noreply@techstock.com>',
                to: userEmail,
                subject: `Invoice for Order #${orderId} - TechStock`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">Thank you for your order!</h2>
                        <p>Dear ${userName},</p>
                        <p>Your order #${orderId} has been successfully placed. Please find your invoice attached to this email.</p>
                        <p><strong>Order Details:</strong></p>
                        <ul>
                            <li>Order ID: ${orderId}</li>
                            <li>Date: ${new Date().toLocaleDateString()}</li>
                        </ul>
                        <p>If you have any questions about your order, please don't hesitate to contact our support team.</p>
                        <p>Thank you for choosing TechStock!</p>
                        <br>
                        <p>Best regards,<br>The TechStock Team</p>
                    </div>
                `,
                attachments: [
                    {
                        filename: `invoice_${orderId}.pdf`,
                        path: invoicePath
                    }
                ]
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Invoice email sent successfully:', info.messageId);
            return true;
        } catch (error) {
            console.error('Error sending invoice email:', error);
            return false;
        }
    }

    async sendContactNotification(name, email, message) {
        if (!this.transporter) {
            console.log('Email service not configured. Skipping contact notification email.');
            return false;
        }

        try {
            const mailOptions = {
                from: 'TechStock Contact Form <noreply@techstock.com>',
                to: process.env.EMAIL_USER, // Send to admin email
                subject: `New Contact Form Message from ${name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">New Contact Form Message</h2>
                        <p><strong>From:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Message:</strong></p>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                        <br>
                        <p>Please respond to this customer inquiry as soon as possible.</p>
                    </div>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Contact notification email sent successfully:', info.messageId);
            return true;
        } catch (error) {
            console.error('Error sending contact notification email:', error);
            return false;
        }
    }

    async sendPasswordResetEmail(userEmail, userName, resetUrl) {
        if (!this.transporter) {
            console.log('Email service not configured. Skipping password reset email.');
            return false;
        }

        try {
            const mailOptions = {
                from: 'TechStock <noreply@techstock.com>',
                to: userEmail,
                subject: 'Password Reset Request - TechStock',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #2563eb;">Password Reset Request</h2>
                        <p>Hello ${userName},</p>
                        <p>You requested a password reset for your TechStock account. Click the button below to reset your password:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">${resetUrl}</p>
                        <p><strong>This link will expire in 1 hour.</strong></p>
                        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 14px;">This email was sent from TechStock. If you have any questions, please contact our support team.</p>
                    </div>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Password reset email sent successfully:', info.messageId);
            return true;
        } catch (error) {
            console.error('Error sending password reset email:', error);
            return false;
        }
    }
}

module.exports = EmailService; 