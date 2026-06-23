import type { Locale } from "@/app/[lang]/dictionaries";

export const TERMS_OF_USE_VERSION = "2026-06-23";
export const PRIVACY_POLICY_VERSION = "2026-06-23";

export function getPrivacyConsentMetadata(locale: Locale) {
  const statement =
    locale === "it"
      ? "Ho letto e accetto i Termini di utilizzo e la Privacy Policy."
      : "I have read and accept the Terms of Use and Privacy Policy.";

  return {
    privacy_consent: {
      accepted: true,
      accepted_at: new Date().toISOString(),
      locale,
      statement,
      documents: {
        terms_of_use: TERMS_OF_USE_VERSION,
        privacy_policy: PRIVACY_POLICY_VERSION,
      },
    },
  };
}
