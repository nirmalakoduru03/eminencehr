// Minimal backend to deliver contact form emails
// Requires environment variables for SMTP or a local relay

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
let PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Serve the frontend
app.use(express.static(path.join(__dirname, 'Html')));

// Serve project-level assets (logo image in project root) at /assets/* so the frontend can reference them
app.use('/assets', express.static(path.join(__dirname)));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});

// Email transport
function buildTransport() {
    // Prefer explicit SMTP settings
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
        return nodemailer.createTransport({
            host,
            port: port || 587,
            secure: Boolean(process.env.SMTP_SECURE === 'true' || (port === 465)),
            auth: { user, pass },
        });
    }

    // On Windows or when sendmail is unavailable, use a JSON transport for local testing
    if (process.platform === 'win32') {
        return nodemailer.createTransport({ jsonTransport: true });
    }
    // Fallback to local sendmail if available (Linux/Mac)
    return nodemailer.createTransport({ sendmail: true, newline: 'unix', path: '/usr/sbin/sendmail' });
}

const transporter = buildTransport();

app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body || {};
        if (!name || !email || !message) {
            return res.status(400).json({ ok: false, error: 'Missing required fields' });
        }

        const toAddress = process.env.TO_EMAIL || 'eminencehrconsult@gmail.com';
        const fromAddress = process.env.FROM_EMAIL || `noreply@${(req.hostname || 'localhost')}`;

        const subject = `New Website Inquiry from ${name}`;
        const text = `Name: ${name}\nEmail: ${email}\n\n${message}`;
        const html = `
            <h2>New Website Inquiry</h2>
            <table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;border-color:#ddd;">
                <tr><th align="left">Name</th><td>${escapeHtml(name)}</td></tr>
                <tr><th align="left">Email</th><td>${escapeHtml(email)}</td></tr>
                <tr><th align="left">Message</th><td><pre style="white-space:pre-wrap">${escapeHtml(message)}</pre></td></tr>
            </table>`;

        await transporter.sendMail({
            to: toAddress,
            from: fromAddress,
            replyTo: email,
            subject,
            text,
            html,
        });

        res.json({ ok: true });
    } catch (err) {
        console.error('Email send failed:', err);
        res.status(500).json({ ok: false, error: 'Failed to send email' });
    }
});

// Fallback to index.html for root
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'Html', 'index.html'));
});

function start(port) {
    const server = app.listen(port, () => {
        console.log(`Eminence HR site running on http://localhost:${port}`);
    });
    server.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE') {
            if (port === 3000) {
                const fallback = 3001;
                console.warn(`Port ${port} in use, retrying on ${fallback}...`);
                start(fallback);
            } else {
                console.error(`Port ${port} in use. Set PORT env var to a free port.`);
                process.exit(1);
            }
        } else {
            console.error('Server error:', err);
            process.exit(1);
        }
    });
}

start(PORT);

function escapeHtml(str = '') {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}


