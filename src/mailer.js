// 透過 Gmail SMTP（App Password）寄送告警信
// 需要的 secrets：GMAIL_USER（寄件 gmail 帳號）、GMAIL_APP_PASSWORD（應用程式密碼，非登入密碼）
import { WorkerMailer } from 'worker-mailer';

export async function sendMail(env, { subject, text }) {
  // 用一次性的 static send()：內部會自己連線、送出、關閉 socket，
  // 不用像 WorkerMailer.connect() 那樣自己管連線生命週期。
  await WorkerMailer.send(
    {
      credentials: {
        username: env.GMAIL_USER,
        password: env.GMAIL_APP_PASSWORD,
      },
      authType: 'plain',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,    // 465 = 連線時就直接走 TLS
      startTls: false, // 已經是 TLS 連線了，不用再協商一次 STARTTLS
    },
    {
      from: { name: 'IAQ 告警系統', email: env.GMAIL_USER },
      to: { email: env.ALERT_EMAIL_TO },
      subject,
      text,
    }
  );
}
