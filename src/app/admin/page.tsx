import Link from "next/link";
import { Activity, Newspaper, Users } from "lucide-react";

const SECTIONS = [
    {
        href: "/admin/telemetry",
        label: "Telemetry",
        description: "Diagnostic netplay & crash logs pulled from the game server.",
        icon: Activity
    },
    {
        href: "/admin/users",
        label: "Users",
        description: "Manage accounts: roles, passwords, bans, and forced deletion.",
        icon: Users
    },
    {
        href: "/admin/news",
        label: "News",
        description: "Author news, events and updates for the site and the client ticker.",
        icon: Newspaper
    }
] as const;

export default function AdminHome() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map(({ href, label, description, icon: Icon }) => (
                <Link
                    key={href}
                    href={href}
                    className="group rounded-sm border border-white/10 bg-dark-card p-5 shadow-2xl shadow-black/30 transition hover:border-brand-purple-500/40 hover:bg-white/[0.03]"
                >
                    <div className="mb-3 flex items-center gap-2">
                        <Icon className="h-5 w-5 text-brand-purple-400" />
                        <h2 className="font-display text-base font-black text-white">{label}</h2>
                    </div>
                    <p className="text-sm text-zinc-400">{description}</p>
                </Link>
            ))}
        </div>
    );
}
