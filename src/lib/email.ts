import nodemailer from "nodemailer";

function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: (process.env.SMTP_PORT || "587") === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendMagicLinkEmail(
  to: string,
  facilityName: string,
  magicLinkUrl: string
): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("SMTP not configured, skipping magic-link email");
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"hraju.cz" <${process.env.SMTP_USER}>`,
      to,
      subject: `Ověření vlastnictví – ${facilityName}`,
      text: [
        `Dobrý den,`,
        ``,
        `obdrželi jsme žádost o ověření vlastnictví sportoviště „${facilityName}" na hraju.cz.`,
        ``,
        `Pro přihlášení a správu vašeho sportoviště klikněte na tento odkaz:`,
        magicLinkUrl,
        ``,
        `Odkaz je platný 30 dní. Pokud jste tuto žádost neodeslali, tento e-mail ignorujte.`,
        ``,
        `S pozdravem,`,
        `tým hraju.cz`,
      ].join("\n"),
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #18181b;">Ověření vlastnictví sportoviště</h2>
          <p>Dobrý den,</p>
          <p>obdrželi jsme žádost o ověření vlastnictví sportoviště <strong>${facilityName}</strong> na hraju.cz.</p>
          <p>Pro přihlášení a správu vašeho sportoviště klikněte na tlačítko:</p>
          <p style="margin: 24px 0;">
            <a href="${magicLinkUrl}" style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Přihlásit se a spravovat sportoviště
            </a>
          </p>
          <p style="color: #71717a; font-size: 14px;">Odkaz je platný 30 dní. Pokud jste tuto žádost neodeslali, tento e-mail ignorujte.</p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="color: #a1a1aa; font-size: 12px;">hraju.cz – sportoviště v Česku</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send magic-link email:", error);
    return false;
  }
}
