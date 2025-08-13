import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import LanguageToggle from './LanguageToggle';
import { useState } from 'react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <a href="#home" className="flex items-center space-x-2">
              <img src="/logoMadezdev-3.png" alt="Logo MadezDev" className="w-auto h-12" />
              <p className="text-xl font-bold">Martin Hernandez</p>
            </a>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-baseline space-x-8">
              <a href="#home" className="text-gray-300 hover:text-white transition-colors duration-300">
                {t('nav.home')}
              </a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors duration-300">
                {t('nav.about')}
              </a>
              <a href="#services" className="text-gray-300 hover:text-white transition-colors duration-300">
                {t('nav.services')}
              </a>
              <a href="#skills" className="text-gray-300 hover:text-white transition-colors duration-300">
                {t('nav.skills')}
              </a>
              <a href="#contact" className="text-gray-300 hover:text-white transition-colors duration-300">
                {t('nav.contact')}
              </a>
            </div>
            <LanguageToggle />
          </div>

          {/* Mobile menu button and language toggle */}
          <div className="md:hidden flex items-center space-x-3">
            <LanguageToggle />
            <button 
              type="button" 
              onClick={toggleMenu}
              className="text-gray-400 hover:text-white focus:outline-none focus:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-slate-900/95">
          <a 
            href="#home" 
            onClick={closeMenu}
            className="block px-3 py-2 text-gray-300 hover:text-white transition-colors duration-300"
          >
            {t('nav.home')}
          </a>
          <a 
            href="#about" 
            onClick={closeMenu}
            className="block px-3 py-2 text-gray-300 hover:text-white transition-colors duration-300"
          >
            {t('nav.about')}
          </a>
          <a 
            href="#services" 
            onClick={closeMenu}
            className="block px-3 py-2 text-gray-300 hover:text-white transition-colors duration-300"
          >
            {t('nav.services')}
          </a>
          <a 
            href="#skills" 
            onClick={closeMenu}
            className="block px-3 py-2 text-gray-300 hover:text-white transition-colors duration-300"
          >
            {t('nav.skills')}
          </a>
          <a 
            href="#contact" 
            onClick={closeMenu}
            className="block px-3 py-2 text-gray-300 hover:text-white transition-colors duration-300"
          >
            {t('nav.contact')}
          </a>
        </div>
      </div>
    </nav>
  );
}