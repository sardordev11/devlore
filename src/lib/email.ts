import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// onboarding@resend.dev only delivers to the Resend account owner;
// set EMAIL_FROM to an address on a verified domain for real users
const EMAIL_FROM = process.env.EMAIL_FROM ?? "DevLore <onboarding@resend.dev>";

export async function sendVerificationEmail(email: string, url: string) {
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Verify your DevLore email",
    text: `Confirm your email address to finish setting up your DevLore account:\n\n${url}\n\nThis link expires in 24 hours. If you didn't create an account, you can ignore this email.`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111827;">
        <h1 style="font-size: 20px; margin: 0 0 16px;">Verify your email</h1>
        <p style="margin: 0 0 24px; line-height: 1.5;">Confirm your email address to finish setting up your DevLore account.</p>
        <a href="${url}" style="display: inline-block; background: #111827; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600;">Verify email</a>
        <p style="margin: 24px 0 0; font-size: 13px; color: #6b7280; line-height: 1.5;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
      </div>
    `,
  });

  if (error) throw new Error(`Failed to send verification email: ${error.message}`);
}

export async function sendPasswordResetEmail(email: string, url: string) {
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Reset your DevLore password",
    text: `Someone asked to reset the password for your DevLore account. Use this link to choose a new one:\n\n${url}\n\nThis link expires in 1 hour. If you didn't ask for this, you can ignore this email and your password won't change.`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #111827;">
        <h1 style="font-size: 20px; margin: 0 0 16px;">Reset your password</h1>
        <p style="margin: 0 0 24px; line-height: 1.5;">Someone asked to reset the password for your DevLore account. Use the button below to choose a new one.</p>
        <a href="${url}" style="display: inline-block; background: #111827; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600;">Reset password</a>
        <p style="margin: 24px 0 0; font-size: 13px; color: #6b7280; line-height: 1.5;">This link expires in 1 hour. If you didn't ask for this, you can ignore this email and your password won't change.</p>
      </div>
    `,
  });

  if (error) throw new Error(`Failed to send password reset email: ${error.message}`);
}
