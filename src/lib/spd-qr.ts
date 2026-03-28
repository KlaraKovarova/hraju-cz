import QRCode from "qrcode";

const IBAN = "CZ8820100000002700483161";
const AMOUNT = 1209; // 999 CZK + 21% VAT

export function buildSpdString(variableSymbol: string): string {
  return [
    "SPD*1.0",
    `ACC:${IBAN}`,
    `AM:${AMOUNT}.00`,
    "CC:CZK",
    `X-VS:${variableSymbol}`,
    "MSG:Premium hraju.cz",
  ].join("*");
}

export async function generateSpdQrDataUrl(variableSymbol: string): Promise<string> {
  const spd = buildSpdString(variableSymbol);
  return QRCode.toDataURL(spd, { width: 300, margin: 2 });
}

export function generateVariableSymbol(): string {
  // 10-digit numeric: timestamp-based + random suffix
  const ts = Date.now().toString().slice(-7);
  const rand = Math.floor(100 + Math.random() * 900).toString();
  return ts + rand;
}

export const PAYMENT_IBAN = IBAN;
export const PAYMENT_AMOUNT = AMOUNT;
export const PAYMENT_PRICE_EXCL_VAT = 999;
export const PAYMENT_VAT_RATE = 21;
