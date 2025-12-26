import nodemailer from 'nodemailer';
import axios from 'axios';
import dotenv from 'dotenv';
import cron from 'node-cron';

dotenv.config();

const apiBase = process.env.API_BASE_URL || 'http://localhost:3000/api';
const adminToken = process.env.ADMIN_TOKEN;

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function fetchUsers() {
  const { data } = await axios.get(`${apiBase}/admin/users`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  return data.users || [];
}

async function fetchWeeklySummary(userId) {
  const { data } = await axios.get(`${apiBase}/stats/weekly-summary`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    params: { user_id: userId }
  });
  return data;
}

async function sendSummaryEmail(user, stats) {
  const subject = 'Your Weekly Fittrack Summary';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="background:#1976d2; color:#fff; padding:16px;">Your Weekly Fittrack Summary</h1>
      <p>Hi ${user.name || 'there'}, here is your past week:</p>
      <ul>
        <li><strong>Workouts:</strong> ${stats.workoutsCount}</li>
        <li><strong>Total Minutes:</strong> ${stats.totalMinutes}</li>
        <li><strong>Total Volume:</strong> ${Math.round(stats.totalVolume || 0)} kg</li>
      </ul>
      ${(stats.newPRs || []).length ? '<p>New PRs:</p>' : ''}
      ${(stats.newPRs || []).map(pr => `<div><strong>${pr.exercise_name}</strong>: ${Math.round(pr.max_weight || 0)} kg</div>`).join('')}
      <p>Keep going!</p>
    </div>
  `;

  await mailer.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: user.email,
    subject,
    html
  });
}

async function runWeeklyReport() {
  if (!adminToken) {
    console.error('ADMIN_TOKEN not set');
    return;
  }

  const users = await fetchUsers();

  for (const user of users) {
    try {
      const stats = await fetchWeeklySummary(user.id);
      await sendSummaryEmail(user, stats);
      console.log(`Weekly summary sent to ${user.email}`);
    } catch (err) {
      console.error(`Weekly summary failed for ${user.email}:`, err.message);
    }
  }
}

cron.schedule('* * * * *', runWeeklyReport);
//cron.schedule('0 20 * * 0', runWeeklyReport); sunday at 8pm