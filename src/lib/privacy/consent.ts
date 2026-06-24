export const TERMS_OF_USE_VERSION = "2026-06-23";
export const PRIVACY_POLICY_VERSION = "2026-06-23";

export function getPrivacyConsentMetadata() {
  return {
    privacy_consent: {
      accepted: true,
      accepted_at: new Date().toISOString(),
      locale: "en",
      statement: "I have read and accept the Terms of Use and Privacy Policy.",
      documents: {
        terms_of_use: TERMS_OF_USE_VERSION,
        privacy_policy: PRIVACY_POLICY_VERSION,
      },
    },
  };
}

export function getPrivacyConsentRevocationMetadata() {
  return {
    privacy_consent: {
      accepted: false,
      revoked_at: new Date().toISOString(),
      locale: "en",
      statement: "Terms of Use and Privacy Policy consent revoked.",
      documents: {
        terms_of_use: TERMS_OF_USE_VERSION,
        privacy_policy: PRIVACY_POLICY_VERSION,
      },
    },
  };
}

export function hasActivePrivacyConsent(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return false;
  }

  const consent = (metadata as { privacy_consent?: { accepted?: unknown } })
    .privacy_consent;

  return consent?.accepted === true;
}
