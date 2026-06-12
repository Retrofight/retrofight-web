import LandingPage from "@/components/landing/LandingPage";
import { getDictionary, hasLocale } from "./dictionaries";
import { notFound } from "next/navigation";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  return <LandingPage lang={lang} dictionary={getDictionary(lang)} />;
}
