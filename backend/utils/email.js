import nodemailer from 'nodemailer';

let cachedTransport = null;
let cachedTestAccount = null;

async function createTransport() {
  const hasConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasConfig) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  if (!cachedTestAccount) {
    cachedTestAccount = await nodemailer.createTestAccount();
  }

  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: cachedTestAccount.user,
      pass: cachedTestAccount.pass
    }
  });
}

async function getTransport() {
  if (!cachedTransport) {
    cachedTransport = await createTransport();
  }
  return cachedTransport;
}

export async function sendEmail({ to, subject, html, text }) {
  try {
    const transport = await getTransport();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@fittrack.dev';

    const info = await transport.sendMail({
      from,
      to,
      subject,
      text,
      html
    });

    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) {
      console.log('Test email preview:', preview);
    } else if (info.messageId) {
      console.log(`Email sent to ${to}`);
    }

    return info;
  } catch (error) {
    console.error('Email sending failed:', error.message);
    throw new Error('Failed to send email');
  }
}