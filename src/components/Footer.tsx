import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { useState, useEffect } from 'react';

export default function Footer() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const socialLinks = [
    { href: 'https://linkedin.com/in/martin-dev', icon: '💼', color: 'blue' },
    { href: 'https://github.com/martin-dev', icon: '🐙', color: 'purple' },
    { href: 'https://twitter.com/martin_dev', icon: '🐦', color: 'blue' },
    { href: 'mailto:madezdev@gmail.com', icon: '📧', color: 'red' }
  ];

  const navLinks = [
    { href: '#home', key: 'nav.home' },
    { href: '#about', key: 'nav.about' },
    { href: '#services', key: 'nav.services' },
    { href: '#skills', key: 'nav.skills' },
    { href: '#contact', key: 'nav.contact' }
  ];

  return (
    <>
      <footer className="bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand & Description */}
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <a href="#home" className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Martin
                </a>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                {t('footer.description')}
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((link, index) => (
                  <a 
                    key={index}
                    href={link.href} 
                    className={`w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-gray-400 hover:text-${link.color}-400 hover:bg-slate-700 transition-all duration-300 group`}
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">{link.icon}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t('footer.navigation')}</h4>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-gray-400 hover:text-white transition-colors">
                      {t(link.key)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t('footer.services')}</h4>
              <ul className="space-y-2">
                {['frontend', 'backend', 'design', 'mobile', 'saas'].map((service, index) => (
                  <li key={service}>
                    <span className="text-gray-400">{t(`footer.servicesList.${index}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-slate-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                {t('footer.copyright')}
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  {t('footer.availableForProjects')}
                </div>
                <span>•</span>
                <div>{t('footer.madeWith')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll to top button */}
        <button 
          onClick={scrollToTop}
          className={`fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-40 ${
            showScrollTop ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </footer>
    </>
  );
}