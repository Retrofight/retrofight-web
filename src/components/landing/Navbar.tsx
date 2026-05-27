import { useEffect, useState } from 'react';
import { Gamepad2, Menu, X, Download, Code } from 'lucide-react';

interface NavbarProps {
  onDownloadClick: () => void;
}

export default function Navbar({ onDownloadClick }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Caratteristiche', href: '#features' },
    { name: 'Simulatore Rollback', href: '#simulator' },
    { name: 'Matchmaking', href: '#matchmaking' },
    { name: 'Guida Cabinati', href: '#cabinet-guide' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <nav
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        isScrolled
          ? 'bg-dark-obsidian/85 backdrop-blur-md border-dark-border py-3'
          : 'bg-transparent border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute -inset-1 rounded bg-gradient-to-r from-brand-purple-500 to-brand-cyan-500 opacity-70 blur-xs group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-dark-obsidian p-1.5 rounded border border-brand-purple-500/30 flex items-center justify-center">
                <Gamepad2 className="h-6 w-6 text-brand-cyan-400 rotate-[-12deg] group-hover:rotate-[12deg] transition-transform duration-300" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black italic tracking-tighter text-xl text-white">
                RETROFIGHT
              </span>
              <span className="font-pixel text-[8px] tracking-[0.2em] text-brand-purple-400 leading-none">
                GGPO INTERFACE
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-zinc-400 hover:text-white font-display font-bold uppercase tracking-wider text-xs transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Download and GitHub Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-sm border border-transparent hover:border-dark-border transition duration-200"
              title="GitHub Repository"
            >
              <Code className="h-5 w-5" />
            </a>
            
            <button
              id="navbar-download-btn"
              onClick={onDownloadClick}
              className="px-5 py-2.5 bg-brand-purple-600 hover:bg-brand-purple-500 text-white font-display font-black text-xs uppercase tracking-tighter italic rounded-sm transition-all duration-150 inline-flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Scarica</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-400 hover:text-white p-2 rounded-md outline-hidden hover:bg-white/5 transition duration-200"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? 'max-h-screen opacity-100 py-4 px-4 bg-dark-obsidian/95 border-b border-dark-border'
            : 'max-h-0 opacity-0 overflow-hidden py-0 border-transparent'
        }`}
      >
        <div className="space-y-3 pb-3">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block rounded-lg px-4 py-2.5 text-base font-medium text-gray-300 hover:text-brand-cyan-400 hover:bg-white/5 transition duration-200"
            >
              {link.name}
            </a>
          ))}
          <div className="pt-4 border-t border-dark-border flex flex-col space-y-3 px-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-2 text-gray-400 hover:text-white py-2 transition duration-200"
            >
              <Code className="h-5 w-5" />
              <span>Sorgente GitHub</span>
            </a>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onDownloadClick();
              }}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-brand-purple-600 to-brand-cyan-500 font-display font-bold text-center text-white text-sm hover:from-brand-purple-500 hover:to-brand-cyan-400 cursor-pointer shadow-lg shadow-brand-purple-500/20"
            >
              Scarica per Electron
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
