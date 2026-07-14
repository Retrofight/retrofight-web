"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import type { Dictionary } from "@/app/dictionary";

// Routes that render their own full-screen chrome (admin shell) or are auth flows
// where the marketing navbar/footer would be out of place.
const BARE_PREFIXES = ["/admin", "/login", "/auth", "/forgot-password", "/reset-password"];

interface SiteChromeProps {
    dictionary: Dictionary;
    isAuthenticated: boolean;
    children: React.ReactNode;
}

// Wraps every page with the shared site header + footer, except bare routes.
// Rendered once from the root layout so navigation is consistent across pages.
export function SiteChrome({ dictionary, isAuthenticated, children }: SiteChromeProps) {
    const pathname = usePathname();
    const bare = BARE_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));

    if (bare) {
        return <>{children}</>;
    }

    return (
        <>
            <Navbar dictionary={dictionary} isAuthenticated={isAuthenticated} />
            <div className="flex-1">{children}</div>
            <Footer dictionary={dictionary} />
        </>
    );
}
