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

    async sendOrderConfirmationEmail(userEmail, userName, orderId, orderDetails) {
        if (!this.transporter) {
            console.log('Email service not configured. Skipping confirmation email.');
            return false;
        }

        try {
            const mailOptions = {
                from: 'TechStock <noreply@techstock.com>',
                to: userEmail,
                subject: `Order Confirmation #${orderId} - TechStock`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">Order Confirmed!</h2>
                        <p>Dear ${userName},</p>
                        <p>Your order #${orderId} has been successfully placed and is being processed.</p>
                        <p><strong>Order Summary:</strong></p>
                        <ul>
                            <li>Order ID: ${orderId}</li>
                            <li>Total Amount: ₪${orderDetails.total_amount}</li>
                            <li>Payment Method: ${orderDetails.payment_method}</li>
                            <li>Shipping Address: ${orderDetails.shipping_address}</li>
                        </ul>
                        <p>You will receive a separate email with your invoice shortly.</p>
                        <p>Thank you for choosing TechStock!</p>
                        <br>
                        <p>Best regards,<br>The TechStock Team</p>
                    </div>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Order confirmation email sent successfully:', info.messageId);
            return true;
        } catch (error) {
            console.error('Error sending order confirmation email:', error);
            return false;
        }
    }
}

module.exports = EmailService; 