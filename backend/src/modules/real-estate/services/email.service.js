import { env } from "../../../config/env.js";

export const sendOtpEmail = async ({ to, name, otp, purpose }) => {
  const subject =
    purpose === "FORGOT_PASSWORD"
      ? "Reset your password - OTP"
      : "Verify your email - OTP";

  if (
    !env.emailjs.serviceId ||
    !env.emailjs.templateId ||
    !env.emailjs.privateKey
  ) {
    // Local/dev fallback so the flow is testable without EmailJS configured.
    // eslint-disable-next-line no-console
    console.log(
      `\n📧 [DEV EMAIL FALLBACK] To: ${to} | Subject: ${subject}\nOTP: ${otp}\n`,
    );
    return { delivered: false, devFallback: true };
  }

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: env.emailjs.serviceId,
      template_id: env.emailjs.templateId,
      user_id: env.emailjs.publicKey,
      accessToken: env.emailjs.privateKey,
      template_params: {
        to_email: to,
        to_name: name,
        otp_code: otp,
        subject,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`EmailJS send failed: ${response.status} ${errText}`);
  }

  return { delivered: true, devFallback: false };
};
