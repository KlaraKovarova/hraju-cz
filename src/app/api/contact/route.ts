import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    // Server-side validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Vyplňte prosím všechna povinná pole." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Zadejte platnou e-mailovou adresu." },
        { status: 400 }
      );
    }

    // Save to database
    try {
      await prisma.contactMessage.create({
        data: {
          name: name.trim(),
          email: email.trim(),
          phone: phone?.trim() || null,
          message: message.trim(),
        },
      });
    } catch (dbError) {
      console.error("Failed to save contact message to DB:", dbError);
    }

    // Send email notification if SMTP is configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: (process.env.SMTP_PORT || "587") === "465",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const contactEmail = process.env.CONTACT_EMAIL || "klara@hraju.cz";

        await transporter.sendMail({
          from: `"hraju.cz kontakt" <${process.env.SMTP_USER}>`,
          to: contactEmail,
          replyTo: email.trim(),
          subject: `Nová zpráva z hraju.cz od ${name.trim()}`,
          text: [
            `Jméno: ${name.trim()}`,
            `E-mail: ${email.trim()}`,
            `Telefon: ${phone?.trim() || "neuvedeno"}`,
            ``,
            `Zpráva:`,
            message.trim(),
          ].join("\n"),
        });
      } catch (mailError) {
        console.error("Failed to send contact email:", mailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Nepodařilo se odeslat zprávu. Zkuste to prosím znovu." },
      { status: 500 }
    );
  }
}
