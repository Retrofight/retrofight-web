import { downloadDisclaimerMarkdown } from "@/lib/legal/documents";

const shared = {
  githubOrg: "https://github.com/Retrofight",
  releaseUrl:
    "https://github.com/Retrofight/retrofight-releases/releases/tag/v0.6.8-beta.0",
  installerUrl:
    "https://github.com/Retrofight/retrofight-releases/releases/download/v0.6.8-beta.0/RetroFight-Windows-Setup-0.6.8-beta.0-x64.exe",
  portableUrl:
    "https://github.com/Retrofight/retrofight-releases/releases/download/v0.6.8-beta.0/RetroFight-Windows-0.6.8-beta.0-x64.zip",
  linuxAppImageUrl:
    "https://github.com/Retrofight/retrofight-releases/releases/download/v0.6.8-beta.0/RetroFight-Linux-0.6.8-beta.0-x86_64.AppImage",
  linuxDebUrl:
    "https://github.com/Retrofight/retrofight-releases/releases/download/v0.6.8-beta.0/RetroFight-Linux-0.6.8-beta.0-amd64.deb",
};

export const dictionary = {
    ...shared,
    nav: {
      project: "Project",
      downloads: "Downloads",
      wiki: "How to play",
      github: "GitHub",
      auth: "Sign in / Register",
      profile: "Profile",
      userMenu: "User menu",
      signOut: "Sign out",
    },
    footer: {
      copyright:
        "RetroFight Project. Game files and trademarks belong to their respective owners.",
      backToTop: "Back to top",
    },
    legal: {
      back: "Back to home",
      navLabel: "Legal pages",
    },
    downloadConsent: {
      eyebrow: "Download",
      fallbackFileName: "RetroFight download",
      cancel: "Cancel",
      agree: "I understand and agree",
      markdown: downloadDisclaimerMarkdown,
    },
    auth: {
      eyebrow: "RetroFight profile",
      title: "Sign in or create your player profile",
      subtitle:
        "Player profiles are the base for future public pages, match history, and ranking features.",
      signIn: "Sign in",
      signUp: "Register",
      email: "Email",
      password: "Password",
      displayName: "Player name",
      displayNameHint: "Choose a unique player name",
      back: "Back to home",
      invalid: "Check your email and password, then try again.",
      consentRequired:
        "Read and accept the Terms of Use and Privacy Policy to register.",
      signupFailed:
        "Registration did not complete. Try another email or password.",
      emailTaken:
        "This email address is already registered. Sign in or use a different email.",
      displayNameTaken:
        "This player name is already taken. Choose a different one.",
      callbackFailed:
        "The confirmation link is incomplete. Request a new registration email.",
      linkExpired:
        "The confirmation link is invalid or expired. Register again or request a new email.",
      verifierMissing:
        "Email confirmed, but this browser could not complete automatic sign-in. Sign in with your email and password.",
      checkEmail: "Check your inbox to confirm the profile before signing in.",
      signedOut: "You have been signed out.",
      accountDeleted: "Your account has been deleted.",
      passwordReset: "Password updated. Sign in with the new password.",
      forgotPassword: "Forgot password?",
      acceptLegalPrefix: "I have read and accept the",
      acceptLegalMiddle: "and",
      acceptLegalSuffix: ".",
      termsOfUse: "Terms of Use",
      privacyPolicy: "Privacy Policy",
    },
    forgotPassword: {
      eyebrow: "Profile recovery",
      title: "Recover your password",
      subtitle:
        "Enter your email and we will send a secure link to choose a new password.",
      email: "Email",
      submit: "Send recovery email",
      back: "Back to sign in",
      missingEmail: "Enter your email address.",
      requestFailed: "The recovery email could not be sent. Try again later.",
      resetSent:
        "If a profile exists for this email, you will receive a recovery link.",
    },
    resetPassword: {
      eyebrow: "Password recovery",
      title: "Choose a new password",
      subtitle:
        "Use at least 8 characters. Additional security rules are enforced automatically.",
      password: "New password",
      confirmPassword: "Confirm new password",
      submit: "Update password",
      missing: "Complete every password field.",
      mismatch: "The new password and confirmation do not match.",
      weak: "Use at least 8 characters for the new password.",
      policy: "The new password does not match the configured security policy.",
      back: "Back to sign in",
    },
    profile: {
      title: "Profile",
      subtitle: "Your RetroFight profile is active.",
      email: "Email",
      player: "Player name",
      home: "Back to home",
      signOut: "Sign out",
      readOnly: "Locked",
      identityTitle: "Identity",
      passwordTitle: "Change password",
      currentPassword: "Current password",
      newPassword: "New password",
      confirmPassword: "Confirm new password",
      passwordHint:
        "Use at least 8 characters. Additional security rules are enforced automatically.",
      updatePassword: "Update password",
      passwordMessages: {
        missing: "Complete every password field.",
        mismatch: "The new password and confirmation do not match.",
        weak: "Use at least 8 characters for the new password.",
        current_invalid: "The current password is not correct.",
        policy: "The new password does not match the configured security policy.",
        updated: "Password updated.",
      },
      privacyMessages: {
        accepted: "Privacy consent is active.",
        revoked:
          "Privacy consent has been revoked. Online services that require consent may be unavailable.",
        update_failed: "Privacy consent could not be updated. Try again later.",
      },
      privacyConsent: {
        title: "Privacy consent",
        description:
          "Manage your acceptance of the Terms of Use and Privacy Policy stored on your RetroFight account.",
        checkbox: "I accept the Terms of Use and Privacy Policy.",
        revocationWarning:
          "Without this consent, services that require account privacy consent may be unavailable.",
        save: "Save privacy preference",
      },
      accountMessages: {
        email_mismatch: "The confirmation email does not match your account.",
        delete_failed: "The account could not be deleted. Try again later.",
        admin_unavailable:
          "Account deletion is not configured for this environment.",
      },
      editProfile: {
        title: "Public profile",
        description:
          "Control your public profile visibility and add optional profile details.",
        publicLabel: "Show my profile and match history publicly",
        avatarUrl: "Avatar URL",
        avatarUrlHint: "Direct link to an image (optional)",
        country: "Country code",
        countryHint: "Two-letter country code, e.g. IT or US (optional)",
        save: "Save profile",
      },
      profileMessages: {
        updated: "Profile updated.",
        update_failed: "Profile could not be updated. Try again later.",
      },
      matchHistoryTitle: "Match history",
      noMatches: "No matches recorded yet.",
      viewPublicProfile: "View your public profile",
      deleteAccount: {
        title: "Delete account",
        description:
          "Permanently remove your RetroFight account and sign out from this browser.",
        open: "Delete account",
        modalTitle: "Delete your account",
        disclaimer:
          "This action permanently deletes your RetroFight account. Online access, profile identity, and authentication data associated with this account will no longer be available. This cannot be undone.",
        confirmLabel: "Type your email address to confirm",
        cancel: "Cancel",
        confirm: "Delete account",
      },
      diagnostics: {
        title: "Network diagnostics",
        description:
          "The RetroFight desktop client can optionally send anonymous technical data to help diagnose connection problems. This is disabled by default.",
        dataCollected: "When enabled, the client reports after each match attempt:",
        items: [
          "UDP candidate type (LAN, STUN, public)",
          "STUN discovery outcome",
          "Punch result and reason",
          "Probe round-trip latency",
          "Client and runtime version",
          "Game driver name",
          "Runtime crash exit code when applicable",
        ],
        notCollected:
          "No ROM files, game inputs, display names, or personally identifiable data are collected.",
        howToManage:
          "Diagnostic telemetry can be enabled or disabled from the Quick Actions menu inside the desktop client.",
      },
    },
    players: {
      home: "Back to home",
      joined: "Member since",
      matchHistory: "Match history",
      noMatches: "No recorded matches.",
      columns: {
        date: "Date",
        game: "Game",
        type: "Type",
        p1: "Player 1",
        p2: "Player 2",
        score: "Score",
        result: "Result",
      },
      matchTypes: {
        casual: "Casual",
        ranked: "Ranked",
      },
      results: {
        win: "Win",
        loss: "Defeat",
        played: "Played",
        forfeit: "Forfeit",
        disputed: "Disputed",
        unknown: "—",
      },
    },
    home: {
      badge: "Beta test version",
      title: "RetroFight",
      subtitle:
        "A desktop arcade fighting game matchmaking client focused on direct, low-latency 1v1 play.",
      intro:
        "RetroFight combines a desktop client for Windows and Linux, online lobbies, match challenges, and a custom RetroFight FBNeo runtime built for competitive arcade sessions.",
      platforms: "Beta builds for Windows and Linux.",
      downloadWindowsInstaller: "Windows installer",
      downloadWindowsPortable: "Windows portable zip",
      downloadLinuxAppImage: "Linux AppImage",
      downloadLinuxDeb: "Linux deb",
      howTo: "Read how to play",
      heroImageAlt: "RetroFight game selection screen",
      highlights: ["Windows + Linux", "1v1", "UDP direct"],
      screenshots: [
        {
          src: "/request-match.png",
          alt: "RetroFight match request screen",
          label: "Challenge",
        },
        {
          src: "/game-test-running.png",
          alt: "RetroFight test mode running",
          label: "Runtime",
        },
        {
          src: "/login-screen.png",
          alt: "RetroFight login screen",
          label: "Profile",
        },
      ],
      cards: [
        {
          title: "Beta for testing",
          text: "The current release is a beta focused on stable direct online play, clear connection feedback, and clean Windows and Linux packages.",
        },
        {
          title: "Custom FBNeo runtime",
          text: "RetroFight uses a custom FBNeo emulator that includes a GGPO integration for direct arcade netplay sessions.",
        },
        {
          title: "1v1 arcade flow",
          text: "Choose a game, enter its lobby, challenge another player, and let RetroFight handle signaling before the runtime starts.",
        },
        {
          title: "Bring your own game files",
          text: "RetroFight does not include, distribute, sell, or provide ROMs. Use only files you legally own and are authorized to use.",
        },
      ],
      projectTitle: "Project notes",
      projectNotes: [
        "Author: Stefano, RetroFight project.",
        "The project is present on GitHub under the RetroFight organization.",
        "The architecture is open source. The Electron client, the heart of the project, is not open source.",
        "Some mature-platform features are outside the first beta, including accounts, rankings, spectator mode, advanced chat, and relay fallback for networks where direct play is not possible.",
      ],
      githubCta: "Open RetroFight on GitHub",
    },
    wiki: {
      title: "How to Play RetroFight Beta",
      subtitle: "Basic RetroFight beta flow for Windows and Linux users.",
      back: "Back to home",
      sections: [
        {
          title: "Before You Start",
          items: [
            "A Windows or Linux PC.",
            "A RetroFight beta release build.",
            "Network access to the RetroFight server.",
            "Permission for RetroFight and RetroFight FBNeo through your firewall.",
            "Game files that you legally own and are authorized to use.",
          ],
          note: "RetroFight does not include, distribute, or download game ROMs.",
        },
        {
          title: "Install Or Launch",
          items: [
            "On Windows, run the setup EXE or extract the portable ZIP.",
            "On Linux, use the AppImage or install the deb package. The beta package includes the Wine runtime used to launch RetroFight FBNeo.",
            "If your OS blocks the first launch, allow the downloaded beta package and try again.",
          ],
        },
        {
          title: "Add Your Game Files",
          paragraphs: [
            "Open RetroFight and use Window > Open ROMs Folder to open the local ROM folder.",
            "Place the required game ZIP files in that folder. RetroFight will not let you enter a game lobby when the required local game file is missing.",
          ],
        },
        {
          title: "Start A Match",
          ordered: [
            "Launch RetroFight.",
            "Select a game from the catalog.",
            "Enter the game lobby.",
            "Choose an available player and send a challenge.",
            "The challenged player can accept or reject the match.",
            "When accepted, RetroFight starts signaling and UDP direct connection checks.",
            "When the connection succeeds, RetroFight launches the RetroFight FBNeo runtime.",
            "Play the match.",
            "When the runtime closes, RetroFight returns to the lobby.",
          ],
          note: "Ranked play is disabled by default during the beta release.",
        },
        {
          title: "Connection Status",
          items: [
            "Signaling: players are exchanging match setup information.",
            "UDP direct: RetroFight is checking whether direct UDP play is possible.",
            "Connected: the direct path is ready and the runtime can start.",
            "Direct failed: UDP direct play did not succeed.",
          ],
          note: "If direct UDP fails, this beta cannot automatically recover through a relay.",
        },
        {
          title: "Troubleshooting",
          groups: [
            {
              title: "Server unavailable",
              items: [
                "Check your internet or LAN connection.",
                "Restart RetroFight.",
                "Try again after confirming the server is online.",
              ],
            },
            {
              title: "Game file missing",
              items: [
                "Open Window > Open ROMs Folder.",
                "Place the required game ZIP in the folder.",
                "Return to the catalog and select the game again.",
              ],
            },
            {
              title: "Runtime does not start",
              items: [
                "On Windows, allow RetroFight and RetroFight FBNeo through your antivirus or firewall if they were blocked.",
                "On Linux, make the AppImage executable or reinstall the deb package.",
                "Check whether antivirus software blocked the runtime.",
                "Reinstall or re-extract the RetroFight release build.",
              ],
            },
            {
              title: "UDP direct failed",
              items: [
                "Allow RetroFight and RetroFight FBNeo through your firewall.",
                "Avoid VPNs, hotspots, hotel networks, school networks, office networks, or restrictive routers during beta testing.",
                "Try again from a home network.",
                "If the network blocks UDP direct traffic, this beta does not provide a relay fallback.",
              ],
            },
            {
              title: "Challenge flow gets stuck after rejecting",
              items: [
                "Reject the next challenge and try again.",
                "Note the player names, approximate time, and click sequence before reporting the issue.",
              ],
            },
          ],
        },
        {
          title: "Where To Find Local Data",
          paragraphs: [
            "RetroFight stores per-instance data under %APPDATA%\\RetroFight-instances\\.",
            "The ROM folder is available from the app menu through Window > Open ROMs Folder.",
          ],
        },
      ],
    },
  } as const;

export type Dictionary = typeof dictionary;
