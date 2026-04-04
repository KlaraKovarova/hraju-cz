import cs from "../../messages/cs.json";
import { routing } from "@/i18n/routing";

declare module "next-intl" {
  interface AppConfig {
    Messages: typeof cs;
    Locale: (typeof routing.locales)[number];
  }
}
