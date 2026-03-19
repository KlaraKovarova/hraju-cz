import nodemailer from "nodemailer";
import { readFileSync } from "fs";
import { join } from "path";

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

export async function sendDelistConfirmationEmail(
  to: string,
  facilityName: string
): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("SMTP not configured, skipping delist confirmation email");
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"hraju.cz" <${process.env.SMTP_USER}>`,
      to,
      subject: `Potvrzení žádosti o odebrání – ${facilityName}`,
      text: [
        `Dobrý den,`,
        ``,
        `potvrzujeme přijetí vaší žádosti o odebrání sportoviště „${facilityName}" z portálu hraju.cz.`,
        ``,
        `Vaši žádost zpracujeme do 30 dnů v souladu s GDPR. O výsledku vás budeme informovat e-mailem.`,
        ``,
        `Máte otázky? Napište nám na klara@hraju.cz.`,
        ``,
        `S pozdravem,`,
        `tým hraju.cz`,
      ].join("\n"),
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #18181b;">Potvrzení žádosti o odebrání</h2>
          <p>Dobrý den,</p>
          <p>potvrzujeme přijetí vaší žádosti o odebrání sportoviště <strong>${facilityName}</strong> z portálu hraju.cz.</p>
          <p>Vaši žádost zpracujeme do 30 dnů v souladu s GDPR. O výsledku vás budeme informovat e-mailem.</p>
          <p style="color: #71717a; font-size: 14px;">
            Máte otázky? Napište nám na <a href="mailto:klara@hraju.cz" style="color: #059669;">klara@hraju.cz</a>.
          </p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="color: #a1a1aa; font-size: 12px;">hraju.cz – sportoviště v Česku</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send delist confirmation email:", error);
    return false;
  }
}

interface OutreachEmailParams {
  facilityName: string;
  facilityUrl: string;
  facilitySlug: string;
  claimUrl: string;
  sportName: string;
  city: string;
}

let cachedTemplate: string | null = null;

function getOutreachTemplate(): string {
  if (!cachedTemplate) {
    cachedTemplate = readFileSync(
      join(process.cwd(), "src/emails/claim-outreach.html"),
      "utf-8"
    );
  }
  return cachedTemplate;
}

function renderOutreachTemplate(params: OutreachEmailParams): string {
  let html = getOutreachTemplate();
  html = html.replace(/\{facilityName\}/g, params.facilityName);
  html = html.replace(/\{facilityUrl\}/g, params.facilityUrl);
  html = html.replace(/\{claimUrl\}/g, params.claimUrl);
  html = html.replace(/\{sportName\}/g, params.sportName);
  html = html.replace(/\{city\}/g, params.city);
  html = html.replace(/\{facilitySlug\}/g, params.facilitySlug);
  return html;
}

export async function sendClaimOutreachEmail(
  to: string,
  params: OutreachEmailParams
): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("SMTP not configured, skipping outreach email");
    return false;
  }

  try {
    const html = renderOutreachTemplate(params);

    await transporter.sendMail({
      from: `"hraju.cz" <${process.env.SMTP_USER}>`,
      to,
      subject: `Vaše sportoviště ${params.facilityName} je na hraju.cz — převezměte si svůj profil`,
      text: [
        `Dobrý den,`,
        ``,
        `na portálu hraju.cz jsme vytvořili profil vašeho sportoviště „${params.facilityName}" v kategorii ${params.sportName}, ${params.city}.`,
        ``,
        `hraju.cz je nový český adresář sportovišť, který pomáhá lidem najít místa pro sport ve svém okolí.`,
        ``,
        `Váš profil: ${params.facilityUrl}`,
        ``,
        `Pro převzetí profilu klikněte na tento odkaz:`,
        params.claimUrl,
        ``,
        `Po převzetí můžete aktualizovat údaje, přidat fotografie a reagovat na dotazy návštěvníků.`,
        ``,
        `Máte otázky? Napište nám na klara@hraju.cz.`,
        ``,
        `S pozdravem,`,
        `tým hraju.cz`,
        ``,
        `---`,
        `Pokud si nepřejete být uvedeni na hraju.cz, můžete požádat o odebrání:`,
        `https://hraju.cz/odhlasit?facility=${params.facilitySlug}`,
        `Silex, spol. s r.o. · hraju.cz`,
      ].join("\n"),
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send outreach email:", error);
    return false;
  }
}
