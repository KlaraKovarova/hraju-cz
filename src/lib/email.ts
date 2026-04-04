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
      from: `"Klára z hraju.cz" <${process.env.SMTP_USER}>`,
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

export async function sendUserLoginEmail(
  to: string,
  loginUrl: string
): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("SMTP not configured, skipping user login email");
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"Klára z hraju.cz" <${process.env.SMTP_USER}>`,
      to,
      subject: "Přihlášení na hraju.cz",
      text: [
        `Dobrý den,`,
        ``,
        `pro přihlášení na hraju.cz klikněte na tento odkaz:`,
        loginUrl,
        ``,
        `Odkaz je platný 1 hodinu. Pokud jste o přihlášení nežádali, tento e-mail ignorujte.`,
        ``,
        `S pozdravem,`,
        `tým hraju.cz`,
      ].join("\n"),
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #18181b;">Přihlášení na hraju.cz</h2>
          <p>Dobrý den,</p>
          <p>pro přihlášení na hraju.cz klikněte na tlačítko:</p>
          <p style="margin: 24px 0;">
            <a href="${loginUrl}" style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Přihlásit se
            </a>
          </p>
          <p style="color: #71717a; font-size: 14px;">Odkaz je platný 1 hodinu. Pokud jste o přihlášení nežádali, tento e-mail ignorujte.</p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="color: #a1a1aa; font-size: 12px;">hraju.cz – sportoviště v Česku</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send user login email:", error);
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
      from: `"Klára z hraju.cz" <${process.env.SMTP_USER}>`,
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

export async function sendEventSubmissionConfirmationEmail(
  to: string,
  eventName: string
): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("SMTP not configured, skipping event submission email");
    return false;
  }

  try {
    await transporter.sendMail({
      from: `"Klára z hraju.cz" <${process.env.SMTP_USER}>`,
      to,
      subject: `Akce „${eventName}" byla odeslána ke kontrole`,
      text: [
        `Dobrý den,`,
        ``,
        `potvrzujeme přijetí vaší turistické akce „${eventName}" na portál hraju.cz.`,
        ``,
        `Akci zkontrolujeme a po schválení se zobrazí v kalendáři na hraju.cz.`,
        ``,
        `Máte otázky? Napište nám na klara@hraju.cz.`,
        ``,
        `S pozdravem,`,
        `tým hraju.cz`,
      ].join("\n"),
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #18181b;">Akce odeslána ke kontrole</h2>
          <p>Dobrý den,</p>
          <p>potvrzujeme přijetí vaší turistické akce <strong>${eventName}</strong> na portál hraju.cz.</p>
          <p>Akci zkontrolujeme a po schválení se zobrazí v kalendáři na hraju.cz.</p>
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
    console.error("Failed to send event submission email:", error);
    return false;
  }
}

export async function sendReviewNotificationEmail(
  to: string,
  facilityName: string,
  rating: number,
  reviewText: string | null,
  facilityUrl: string
): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("SMTP not configured, skipping review notification email");
    return false;
  }

  const stars = "\u2605".repeat(rating) + "\u2606".repeat(5 - rating);
  const preview = reviewText ? reviewText.slice(0, 200) + (reviewText.length > 200 ? "\u2026" : "") : "";
  const claimUrl = "https://www.hraju.cz/moje-sportoviste";

  try {
    await transporter.sendMail({
      from: `"Klára z hraju.cz" <${process.env.SMTP_USER}>`,
      to,
      subject: `Nové hodnocení vašeho sportoviště ${facilityName}`,
      text: [
        `Dobrý den,`,
        ``,
        `vaše sportoviště „${facilityName}" na hraju.cz získalo nové hodnocení.`,
        ``,
        `Hodnocení: ${stars} (${rating}/5)`,
        ...(preview ? [`Text: ${preview}`] : []),
        ``,
        `Chcete spravovat svůj profil a reagovat na hodnocení?`,
        `Převezměte svůj profil: ${claimUrl}`,
        ``,
        `Zobrazit sportoviště: ${facilityUrl}`,
        ``,
        `S pozdravem,`,
        `tým hraju.cz`,
      ].join("\n"),
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #18181b;">Nové hodnocení vašeho sportoviště</h2>
          <p>Dobrý den,</p>
          <p>vaše sportoviště <strong>${facilityName}</strong> na hraju.cz získalo nové hodnocení.</p>
          <div style="background: #f4f4f5; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <div style="font-size: 24px; color: #f59e0b;">${stars}</div>
            ${preview ? `<p style="color: #3f3f46; margin-top: 8px;">${preview}</p>` : ""}
          </div>
          <p>Chcete spravovat svůj profil a reagovat na hodnocení?</p>
          <p style="margin: 24px 0;">
            <a href="${claimUrl}" style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Spravujte své sportoviště
            </a>
          </p>
          <p style="font-size: 14px;">
            <a href="${facilityUrl}" style="color: #059669;">Zobrazit sportoviště na hraju.cz</a>
          </p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="color: #a1a1aa; font-size: 12px;">hraju.cz – sportoviště v Česku</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send review notification email:", error);
    return false;
  }
}

export async function sendNewReviewOnFacilityEmail(
  to: string,
  userName: string | null,
  facilityName: string,
  reviewerName: string,
  rating: number,
  reviewText: string | null,
  facilityUrl: string,
  unsubscribeUrl: string
): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("SMTP not configured, skipping review activity email");
    return false;
  }

  const stars = "\u2605".repeat(rating) + "\u2606".repeat(5 - rating);
  const preview = reviewText
    ? reviewText.slice(0, 200) + (reviewText.length > 200 ? "\u2026" : "")
    : "";
  const greeting = userName ? `Ahoj ${userName}` : "Dobrý den";

  try {
    await transporter.sendMail({
      from: `"hraju.cz" <${process.env.SMTP_USER}>`,
      to,
      subject: `Nová recenze na ${facilityName}`,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      text: [
        `${greeting},`,
        ``,
        `na sportoviště „${facilityName}", které jste navštívili nebo hodnotili, přibyla nová recenze.`,
        ``,
        `${reviewerName} hodnotí: ${stars} (${rating}/5)`,
        ...(preview ? [preview] : []),
        ``,
        `Zobrazit sportoviště: ${facilityUrl}`,
        ``,
        `S pozdravem,`,
        `tým hraju.cz`,
        ``,
        `---`,
        `Nechcete dostávat tyto e-maily? Odhlaste se: ${unsubscribeUrl}`,
      ].join("\n"),
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #18181b;">Nová recenze na ${facilityName}</h2>
          <p>${greeting},</p>
          <p>na sportoviště <strong>${facilityName}</strong>, které jste navštívili nebo hodnotili, přibyla nová recenze.</p>
          <div style="background: #f4f4f5; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 4px; font-weight: 600;">${reviewerName}</p>
            <div style="font-size: 24px; color: #f59e0b;">${stars}</div>
            ${preview ? `<p style="color: #3f3f46; margin-top: 8px;">${preview}</p>` : ""}
          </div>
          <p style="margin: 24px 0;">
            <a href="${facilityUrl}" style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Zobrazit sportoviště
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="color: #a1a1aa; font-size: 12px;">
            hraju.cz – sportoviště v Česku |
            <a href="${unsubscribeUrl}" style="color: #a1a1aa;">Odhlásit se z notifikací</a>
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send review activity email:", error);
    return false;
  }
}

export interface WeeklyDigestData {
  userName: string | null;
  newReviews: Array<{
    facilityName: string;
    facilityUrl: string;
    reviewerName: string;
    rating: number;
  }>;
  newPosts: Array<{
    title: string;
    url: string;
  }>;
  upcomingEvents: Array<{
    name: string;
    date: string;
    city: string;
  }>;
  seasonalFerraty: {
    heading: string;
    description: string;
    facilities: Array<{
      name: string;
      url: string;
      rating: number | null;
      region: string | null;
    }>;
    categoryUrl: string;
  } | null;
}

export async function sendWeeklyDigestEmail(
  to: string,
  data: WeeklyDigestData,
  unsubscribeUrl: string
): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("SMTP not configured, skipping weekly digest email");
    return false;
  }

  const greeting = data.userName ? `Ahoj ${data.userName}` : "Dobrý den";
  const hasContent =
    data.newReviews.length > 0 ||
    data.newPosts.length > 0 ||
    data.upcomingEvents.length > 0 ||
    !!data.seasonalFerraty;

  if (!hasContent) return false;

  const reviewsHtml = data.newReviews.length > 0
    ? `<h3 style="color:#18181b;margin-top:24px;">Nové recenze</h3>
       <ul style="padding-left:20px;">${data.newReviews
         .slice(0, 5)
         .map(
           (r) =>
             `<li><a href="${r.facilityUrl}" style="color:#059669;font-weight:600;">${r.facilityName}</a> — ${r.reviewerName} (${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)})</li>`
         )
         .join("")}</ul>`
    : "";

  const postsHtml = data.newPosts.length > 0
    ? `<h3 style="color:#18181b;margin-top:24px;">Nové články</h3>
       <ul style="padding-left:20px;">${data.newPosts
         .slice(0, 5)
         .map(
           (p) =>
             `<li><a href="${p.url}" style="color:#059669;">${p.title}</a></li>`
         )
         .join("")}</ul>`
    : "";

  const eventsHtml = data.upcomingEvents.length > 0
    ? `<h3 style="color:#18181b;margin-top:24px;">Nadcházející akce</h3>
       <ul style="padding-left:20px;">${data.upcomingEvents
         .slice(0, 5)
         .map((e) => `<li><strong>${e.name}</strong> — ${e.date}, ${e.city}</li>`)
         .join("")}</ul>`
    : "";

  const reviewsText = data.newReviews.length > 0
    ? `\nNové recenze:\n${data.newReviews.slice(0, 5).map((r) => `- ${r.facilityName}: ${r.reviewerName} (${"★".repeat(r.rating)})`).join("\n")}\n`
    : "";

  const postsText = data.newPosts.length > 0
    ? `\nNové články:\n${data.newPosts.slice(0, 5).map((p) => `- ${p.title}: ${p.url}`).join("\n")}\n`
    : "";

  const eventsText = data.upcomingEvents.length > 0
    ? `\nNadcházející akce:\n${data.upcomingEvents.slice(0, 5).map((e) => `- ${e.name} — ${e.date}, ${e.city}`).join("\n")}\n`
    : "";

  const sf = data.seasonalFerraty;
  const seasonalHtml = sf
    ? `<div style="background:#f0fdf4;border-radius:12px;padding:20px;margin:24px 0;">
        <h3 style="color:#059669;margin:0 0 8px;">🧗 ${sf.heading}</h3>
        <p style="color:#3f3f46;margin:0 0 12px;">${sf.description}</p>
        <ul style="padding-left:20px;margin:0 0 12px;">${sf.facilities
          .map((f) => {
            const stars = f.rating ? ` (${"★".repeat(Math.round(f.rating))}${"☆".repeat(5 - Math.round(f.rating))})` : "";
            return `<li><a href="${f.url}" style="color:#059669;font-weight:600;">${f.name}</a>${stars}${f.region ? ` — ${f.region}` : ""}</li>`;
          })
          .join("")}</ul>
        <a href="${sf.categoryUrl}" style="color:#059669;font-weight:600;">Zobrazit všechny ferraty →</a>
      </div>`
    : "";

  const seasonalText = sf
    ? `\n${sf.heading}\n${sf.description}\n${sf.facilities.map((f) => `- ${f.name}${f.rating ? ` (${f.rating.toFixed(1)}/5)` : ""}${f.region ? ` — ${f.region}` : ""}`).join("\n")}\nVšechny ferraty: ${sf.categoryUrl}\n`
    : "";

  try {
    await transporter.sendMail({
      from: `"hraju.cz" <${process.env.SMTP_USER}>`,
      to,
      subject: "Týdenní přehled z hraju.cz",
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      text: [
        `${greeting},`,
        ``,
        `tady je váš týdenní přehled z hraju.cz.`,
        reviewsText,
        postsText,
        eventsText,
        seasonalText,
        `S pozdravem,`,
        `tým hraju.cz`,
        ``,
        `---`,
        `Nechcete dostávat týdenní přehled? Odhlaste se: ${unsubscribeUrl}`,
      ].join("\n"),
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #18181b;">Týdenní přehled z hraju.cz</h2>
          <p>${greeting},</p>
          <p>tady je váš týdenní přehled z hraju.cz.</p>
          ${reviewsHtml}
          ${postsHtml}
          ${eventsHtml}
          ${seasonalHtml}
          <p style="margin: 24px 0;">
            <a href="https://www.hraju.cz" style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Prozkoumat hraju.cz
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="color: #a1a1aa; font-size: 12px;">
            hraju.cz – sportoviště v Česku |
            <a href="${unsubscribeUrl}" style="color: #a1a1aa;">Odhlásit se z týdenního přehledu</a>
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send weekly digest email:", error);
    return false;
  }
}

export async function sendReviewReplyNotificationEmail(
  to: string,
  reviewAuthorName: string,
  replierName: string,
  replyText: string,
  facilityName: string,
  facilityUrl: string,
  unsubscribeUrl: string
): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("SMTP not configured, skipping review reply email");
    return false;
  }

  const preview = replyText.slice(0, 200) + (replyText.length > 200 ? "\u2026" : "");
  const greeting = reviewAuthorName ? `Ahoj ${reviewAuthorName}` : "Dobrý den";

  try {
    await transporter.sendMail({
      from: `"hraju.cz" <${process.env.SMTP_USER}>`,
      to,
      subject: `${replierName} odpověděl/a na vaši recenzi – ${facilityName}`,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      text: [
        `${greeting},`,
        ``,
        `${replierName} odpověděl/a na vaši recenzi sportoviště „${facilityName}":`,
        ``,
        `"${preview}"`,
        ``,
        `Zobrazit diskuzi: ${facilityUrl}#recenze`,
        ``,
        `S pozdravem,`,
        `tým hraju.cz`,
        ``,
        `---`,
        `Nechcete dostávat tyto e-maily? Odhlaste se: ${unsubscribeUrl}`,
      ].join("\n"),
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #18181b;">Nová odpověď na vaši recenzi</h2>
          <p>${greeting},</p>
          <p><strong>${replierName}</strong> odpověděl/a na vaši recenzi sportoviště <strong>${facilityName}</strong>:</p>
          <div style="background: #f4f4f5; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="color: #3f3f46; margin: 0;">${preview}</p>
          </div>
          <p style="margin: 24px 0;">
            <a href="${facilityUrl}#recenze" style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Zobrazit diskuzi
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="color: #a1a1aa; font-size: 12px;">
            hraju.cz – sportoviště v Česku |
            <a href="${unsubscribeUrl}" style="color: #a1a1aa;">Odhlásit se z notifikací</a>
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send review reply email:", error);
    return false;
  }
}

export interface BadgeNudgeItem {
  emoji: string;
  name: string;
  progress: number;
  target: number;
  remaining: number;
}

export async function sendBadgeProximityNudgeEmail(
  to: string,
  userName: string | null,
  badges: BadgeNudgeItem[],
  unsubscribeUrl: string
): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("SMTP not configured, skipping badge nudge email");
    return false;
  }

  if (badges.length === 0) return false;

  const greeting = userName ? `Ahoj ${userName}` : "Dobrý den";
  const profileUrl = "https://www.hraju.cz/muj-ucet";

  const badgesText = badges
    .map(
      (b) =>
        `${b.emoji} ${b.name} — ${b.progress}/${b.target} (zbývá ${b.remaining === 1 ? "už jen 1" : `ještě ${b.remaining}`})`
    )
    .join("\n");

  const badgesHtml = badges
    .map(
      (b) => `
        <div style="background: #f4f4f5; border-radius: 12px; padding: 16px; margin: 8px 0;">
          <div style="font-size: 20px; margin-bottom: 4px;">${b.emoji} <strong>${b.name}</strong></div>
          <div style="color: #3f3f46; font-size: 14px;">${b.progress}/${b.target} — ${b.remaining === 1 ? "už jen 1 akce!" : `ještě ${b.remaining} akce`}</div>
          <div style="background: #e4e4e7; border-radius: 999px; height: 8px; margin-top: 8px; overflow: hidden;">
            <div style="background: #059669; height: 100%; width: ${Math.round((b.progress / b.target) * 100)}%; border-radius: 999px;"></div>
          </div>
        </div>`
    )
    .join("");

  const subject =
    badges.length === 1 && badges[0].remaining === 1
      ? `${badges[0].emoji} Zbývá ti jen 1 krok k odznaku ${badges[0].name}!`
      : `Jsi blízko k získání odznaku na hraju.cz!`;

  try {
    await transporter.sendMail({
      from: `"hraju.cz" <${process.env.SMTP_USER}>`,
      to,
      subject,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      text: [
        `${greeting},`,
        ``,
        `máš blízko k získání odznaku na hraju.cz!`,
        ``,
        badgesText,
        ``,
        `Pokračuj v návštěvách a recenzích a odznak bude tvůj!`,
        ``,
        `Můj účet: ${profileUrl}`,
        ``,
        `S pozdravem,`,
        `tým hraju.cz`,
        ``,
        `---`,
        `Nechcete dostávat tyto e-maily? Odhlaste se: ${unsubscribeUrl}`,
      ].join("\n"),
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #18181b;">Máš blízko k odznaku!</h2>
          <p>${greeting},</p>
          <p>chybí ti už jen málo k získání nového odznaku na hraju.cz:</p>
          ${badgesHtml}
          <p style="margin-top: 16px;">Pokračuj v návštěvách a recenzích — odznak bude tvůj!</p>
          <p style="margin: 24px 0;">
            <a href="${profileUrl}" style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Můj účet
            </a>
          </p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="color: #a1a1aa; font-size: 12px;">
            hraju.cz – sportoviště v Česku |
            <a href="${unsubscribeUrl}" style="color: #a1a1aa;">Odhlásit se z notifikací</a>
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send badge nudge email:", error);
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

export interface ChallengeCountdownData {
  userName: string | null;
  challenges: Array<{
    emoji: string;
    title: string;
    daysLeft: number;
    progress: number;
    target: number;
    completedCount: number;
    categoryUrl: string;
  }>;
}

export async function sendChallengeCountdownEmail(
  to: string,
  data: ChallengeCountdownData,
  unsubscribeUrl: string
): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("SMTP not configured, skipping challenge countdown email");
    return false;
  }

  if (data.challenges.length === 0) return false;

  const greeting = data.userName ? `Ahoj ${data.userName}` : "Ahoj";
  const first = data.challenges[0];
  const subject =
    first.daysLeft === 1
      ? `${first.emoji} Poslední den výzvy ${first.title}!`
      : `${first.emoji} Zbývá ${first.daysLeft} dní do konce výzvy!`;

  const challengesText = data.challenges
    .map(
      (c) =>
        `${c.emoji} ${c.title}\n` +
        `  Tvůj postup: ${c.progress}/${c.target}\n` +
        `  Zbývá dní: ${c.daysLeft}\n` +
        `  ${c.completedCount} lidí už splnilo výzvu\n` +
        `  Najít sportoviště: ${c.categoryUrl}`
    )
    .join("\n\n");

  const challengesHtml = data.challenges
    .map(
      (c) => `
        <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 12px 0;">
          <div style="background: #dc2626; color: white; text-align: center; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 14px; margin-bottom: 12px;">
            ${c.daysLeft === 1 ? "POSLEDNÍ DEN!" : `Zbývá ${c.daysLeft} dní`}
          </div>
          <div style="font-size: 18px; font-weight: 700; color: #18181b; margin-bottom: 8px;">${c.emoji} ${c.title}</div>
          <div style="color: #3f3f46; margin-bottom: 12px;">Tvůj postup: <strong>${c.progress}/${c.target}</strong></div>
          <div style="background: #e4e4e7; border-radius: 999px; height: 10px; margin-bottom: 12px; overflow: hidden;">
            <div style="background: #059669; height: 100%; width: ${Math.round((c.progress / c.target) * 100)}%; border-radius: 999px;"></div>
          </div>
          <div style="color: #71717a; font-size: 13px; margin-bottom: 16px;">${c.completedCount} lidí už splnilo výzvu</div>
          <a href="${c.categoryUrl}" style="background: #059669; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Najít sportoviště poblíž
          </a>
        </div>`
    )
    .join("");

  try {
    await transporter.sendMail({
      from: `"hraju.cz" <${process.env.SMTP_USER}>`,
      to,
      subject,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      text: [
        `${greeting},`,
        ``,
        `výzva končí — stihneš to?`,
        ``,
        challengesText,
        ``,
        `Pokračuj v návštěvách a získej odznak!`,
        ``,
        `S pozdravem,`,
        `tým hraju.cz`,
        ``,
        `---`,
        `Nechcete dostávat tyto e-maily? Odhlaste se: ${unsubscribeUrl}`,
      ].join("\n"),
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #18181b;">Výzva končí — stihneš to?</h2>
          <p>${greeting},</p>
          <p>do konce výzvy zbývá už jen pár dní. Podívej se, jak jsi na tom:</p>
          ${challengesHtml}
          <p style="margin-top: 20px; color: #3f3f46;">Pokračuj v návštěvách a získej odznak!</p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="color: #a1a1aa; font-size: 12px;">
            hraju.cz – sportoviště v Česku |
            <a href="${unsubscribeUrl}" style="color: #a1a1aa;">Odhlásit se z notifikací</a>
          </p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Failed to send challenge countdown email:", error);
    return false;
  }
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
      from: `"Klára z hraju.cz" <${process.env.SMTP_USER}>`,
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
        `https://www.hraju.cz/odhlasit?facility=${params.facilitySlug}`,
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
