export type LegalDocumentSlug =
  | "legal-notice"
  | "terms-of-use"
  | "third-party-content"
  | "copyright-policy"
  | "legal-faq";

export type LegalDocument = {
  slug: LegalDocumentSlug;
  title: string;
  footerLabel: string;
  markdown: string;
};

export const downloadDisclaimerMarkdown = `# Important Legal Notice

RetroFight is software only.

No ROMs, BIOS files, games, firmware, commercial software, copyrighted game archives, or copyrighted content are included, provided, hosted, distributed, or made available by RetroFight.

RetroFight does not support, encourage, promote, or facilitate software piracy or copyright infringement.

Users are solely responsible for ensuring that any content used with RetroFight is legally acquired and lawfully used.

By downloading, installing, or using RetroFight, you acknowledge and accept full responsibility for your use of the software.`;

export const legalDocuments: LegalDocument[] = [
  {
    slug: "legal-notice",
    title: "Legal Notice",
    footerLabel: "Legal Notice",
    markdown: `# Legal Notice

Last Updated: 23/06/2026

RetroFight is an independent software project providing emulation and online netplay functionality.

RetroFight does not provide, host, distribute, sell, sublicense, index, aggregate, facilitate access to, or make available any ROM files, BIOS files, firmware, game archives, commercial games, copyrighted software, or other copyrighted content.

RetroFight is distributed exclusively as software.

The software is intended to allow users to run and synchronize compatible content that they are legally authorized to use.

Game titles, system names, trademarks, screenshots, artwork, metadata, thumbnails, and other descriptive materials displayed by RetroFight are used solely for identification, compatibility, cataloging, informational, and user-interface purposes.

All trademarks, registered trademarks, copyrights, logos, game titles, artwork, and related intellectual property remain the property of their respective owners.

RetroFight does not claim ownership of any third-party intellectual property referenced or displayed by the software.

RetroFight is not affiliated with, endorsed by, sponsored by, or approved by any game publisher, developer, console manufacturer, copyright holder, trademark owner, or rights holder unless explicitly stated otherwise.

Users are solely responsible for ensuring that any content used with RetroFight is lawfully acquired and used in accordance with applicable laws and regulations.

The operators, developers, contributors, and maintainers of RetroFight do not encourage, endorse, support, or promote copyright infringement, software piracy, unauthorized copying, unauthorized distribution, or any unlawful activity.

RetroFight reserves the right to update this Legal Notice at any time.`
  },
  {
    slug: "terms-of-use",
    title: "Terms of Use",
    footerLabel: "Terms of Use",
    markdown: `# Terms of Use

Last Updated: 23/06/2026

By downloading, installing, accessing, or using RetroFight, you agree to these Terms of Use.

## 1. User Responsibility

You are solely responsible for all content used with RetroFight.

You must possess all necessary rights, licenses, ownership interests, or permissions required to use any ROM, BIOS, firmware, disc image, game asset, save data, or other content loaded through the software.

## 2. No Content Distribution

RetroFight does not include, provide, distribute, host, sell, sublicense, aggregate, index, or facilitate access to:

- ROM files
- BIOS files
- Commercial games
- Copyrighted software
- Firmware files
- Disc images
- Copyrighted game archives

RetroFight functions solely as software.

## 3. Prohibited Uses

You agree not to use RetroFight for:

- Copyright infringement
- Unauthorized distribution of copyrighted works
- Software piracy
- Circumvention of technological protection measures
- Distribution of ROM collections
- Distribution of BIOS collections
- Unauthorized sharing of copyrighted content
- Any activity prohibited by applicable law

## 4. Third-Party Intellectual Property

RetroFight may display game titles, screenshots, thumbnails, artwork, metadata, identifiers, compatibility information, or other descriptive materials solely for identification and compatibility purposes.

All rights relating to such materials remain with their respective owners.

Nothing in RetroFight shall be interpreted as transferring ownership or granting rights in any third-party intellectual property.

## 5. No Warranty

RetroFight is provided "AS IS" and "AS AVAILABLE".

The software is provided without warranties of any kind, whether express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, title, non-infringement, reliability, or availability.

## 6. Limitation of Liability

To the fullest extent permitted by applicable law, the developers, contributors, maintainers, operators, and affiliates of RetroFight shall not be liable for:

- Direct damages
- Indirect damages
- Incidental damages
- Special damages
- Consequential damages
- Loss of profits
- Loss of data
- Service interruptions
- User misuse of the software
- Copyright violations committed by users

Users assume all responsibility arising from their use of the software.

## 7. Termination

RetroFight may restrict, suspend, or terminate access to any associated services for users who violate these Terms.

## 8. Modifications

RetroFight may modify these Terms at any time. Continued use of the software constitutes acceptance of any modifications.

## 9. Governing Law

These Terms shall be interpreted and enforced in accordance with applicable laws and regulations.`
  },
  {
    slug: "third-party-content",
    title: "Third-Party Content Notice",
    footerLabel: "Third-Party Content",
    markdown: `# Third-Party Content Notice

RetroFight may display game titles, screenshots, artwork, thumbnails, metadata, identifiers, compatibility information, and other descriptive materials originating from third-party sources.

Such materials are displayed exclusively for:

- Identification
- Cataloging
- Compatibility verification
- User interface presentation
- Informational purposes

All copyrights, trademarks, logos, artwork, screenshots, and related intellectual property remain the property of their respective owners.

RetroFight does not claim ownership of any third-party intellectual property.

The display of such materials does not imply affiliation, sponsorship, endorsement, authorization, or approval by any rights holder.

Where applicable, metadata and descriptive materials may originate from publicly available databases, community-maintained repositories, or third-party metadata providers.

If you believe any displayed material infringes your intellectual property rights, please contact us through the procedures described in the Copyright Policy.`
  },
  {
    slug: "copyright-policy",
    title: "Copyright Policy",
    footerLabel: "Copyright Policy",
    markdown: `# Copyright Policy

Last Updated: 23/06/2026

RetroFight respects intellectual property rights and expects all users to do the same.

RetroFight does not host, distribute, provide, sell, or facilitate access to copyrighted games, ROM files, BIOS files, firmware, commercial software, disc images, or similar copyrighted content.

## Reporting Intellectual Property Concerns

If you believe that content, metadata, artwork, screenshots, thumbnails, or other materials associated with RetroFight infringe your intellectual property rights, please provide:

- Identification of the copyrighted work
- Identification of the allegedly infringing material
- Your full contact information
- Evidence of ownership or authorization
- A statement made in good faith that the use is unauthorized
- A statement that the information provided is accurate

Reports may be submitted to:

stefanopascazi@gmail.com

RetroFight will review all legitimate requests and, where appropriate, take reasonable action including modification, removal, replacement, or restriction of access to the disputed material.

RetroFight reserves the right to request additional information before taking action.`
  },
  {
    slug: "legal-faq",
    title: "Legal FAQ",
    footerLabel: "Legal FAQ",
    markdown: `# Legal FAQ

## Does RetroFight provide ROMs?

No.

RetroFight does not provide, host, distribute, sell, or facilitate access to ROM files.

## Does RetroFight provide BIOS files?

No.

RetroFight does not provide, host, distribute, sell, or facilitate access to BIOS files.

## Does RetroFight include games?

No.

RetroFight is distributed as software only.

## Does RetroFight support piracy?

No.

RetroFight does not encourage, endorse, support, or promote copyright infringement or software piracy.

## Why are game names displayed?

Game names are displayed exclusively for identification, compatibility, cataloging, and informational purposes.

## Why are screenshots or artwork displayed?

Screenshots, artwork, thumbnails, and metadata may be displayed solely to identify compatible content and improve the user experience.

All related intellectual property remains the property of the respective rights holders.

## Is RetroFight affiliated with game publishers or console manufacturers?

No.

RetroFight is an independent project and is not affiliated with, endorsed by, sponsored by, or approved by any publisher, developer, console manufacturer, or rights holder unless explicitly stated otherwise.

## Where can I obtain games?

RetroFight does not provide guidance, links, services, or instructions regarding the acquisition of copyrighted content.

Users are solely responsible for ensuring they possess the legal rights necessary to use any content with the software.`
  }
];

export function getLegalDocument(slug: string) {
  return legalDocuments.find((document) => document.slug === slug) || null;
}
