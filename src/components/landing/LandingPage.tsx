"use client";

import { useState } from "react";
import CabinetGuide from "./CabinetGuide";
import DownloadModal from "./DownloadModal";
import Faq from "./Faq";
import Features from "./Features";
import Footer from "./Footer";
import Hero from "./Hero";
import MatchmakerSimulator from "./MatchmakerSimulator";
import Navbar from "./Navbar";
import RollbackSimulator from "./RollbackSimulator";

export default function LandingPage() {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadStep, setDownloadStep] = useState<"options" | "success">("options");
  const [selectedOS, setSelectedOS] = useState<string | null>(null);

  const handleDownloadOS = (os: string) => {
    setSelectedOS(os);
    setDownloadStep("success");
  };

  const handleCloseModal = () => {
    setShowDownloadModal(false);
    setTimeout(() => {
      setDownloadStep("options");
      setSelectedOS(null);
    }, 200);
  };

  const openDownloadModal = () => setShowDownloadModal(true);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-dark-obsidian text-gray-100">
      <div className="pointer-events-none absolute top-[8%] left-[10%] h-[350px] w-[350px] rounded-full bg-brand-purple-600/5 blur-[100px]" />
      <div className="pointer-events-none absolute top-[40%] right-[5%] h-[400px] w-[400px] rounded-full bg-brand-pink-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute top-[75%] left-[8%] h-[380px] w-[380px] rounded-full bg-brand-cyan-500/5 blur-[110px]" />
      <div className="retro-scanlines pointer-events-none fixed inset-0 z-40 opacity-[0.14] mix-blend-overlay" />

      <Navbar onDownloadClick={openDownloadModal} />

      <main>
        <Hero onDownloadClick={openDownloadModal} />
        <Features />
        <RollbackSimulator />
        <MatchmakerSimulator />
        <CabinetGuide />
        <Faq />
      </main>

      <Footer onDownloadClick={openDownloadModal} />

      {showDownloadModal && (
        <DownloadModal
          downloadStep={downloadStep}
          selectedOS={selectedOS}
          onClose={handleCloseModal}
          onDownloadOS={handleDownloadOS}
        />
      )}
    </div>
  );
}
