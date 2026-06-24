import LandingPage from "@/components/landing/LandingPage";
import { dictionary } from "./dictionary";

export default function Home() {
  return <LandingPage dictionary={dictionary} />;
}
