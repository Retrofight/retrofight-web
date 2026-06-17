import { redirect, notFound } from "next/navigation";
import { hasLocale } from "../dictionaries";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    notFound();
  }

  redirect(`/${lang}/profile`);
}
