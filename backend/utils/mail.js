const nodemailer = require('nodemailer');

const sendMail = async (to, subject, text, html) => {
    try {
        // Validate configuration
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('[MAIL] Email credentials (EMAIL_USER / EMAIL_PASS) are not set in environment');
            throw new Error('Email service not configured');
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail', // or any other email provider
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            ...(html ? { html } : {})
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[MAIL] Email sent to ${to}. messageId=${info.messageId}`);
        return info;
    } catch (err) {
        console.error('[MAIL] Error sending email:', err && err.message ? err.message : err);
        // Propagate error so callers can act (don't silently swallow)
        throw err;
    }
};

module.exports = { sendMail };
