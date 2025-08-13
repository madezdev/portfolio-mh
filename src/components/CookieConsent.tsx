import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { useState } from 'react';

export default function CookieConsent() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  const [showDetails, setShowDetails] = useState(false);

  const cookieContent = {
    es: {
      title: '🍪 Uso de Cookies',
      description: 'Utilizamos cookies para analizar el tráfico del sitio y mejorar tu experiencia. Los datos son completamente anónimos y nos ayudan a crear contenido más relevante.',
      whatWeTrack: '¿Qué rastreamos?',
      trackingItems: [
        'Páginas visitadas y tiempo de permanencia',
        'Interacciones con elementos (clics, scroll)',
        'Idioma preferido',
        'Tipo de dispositivo y resolución',
        'País de origen (aproximado)'
      ],
      privacy: 'Tu privacidad es importante para nosotros. No recopilamos información personal identificable.',
      accept: 'Aceptar cookies',
      decline: 'Rechazar',
      showDetails: 'Ver detalles',
      hideDetails: 'Ocultar detalles'
    },
    en: {
      title: '🍪 Cookie Usage',
      description: 'We use cookies to analyze site traffic and improve your experience. The data is completely anonymous and helps us create more relevant content.',
      whatWeTrack: 'What do we track?',
      trackingItems: [
        'Pages visited and time spent',
        'Interactions with elements (clicks, scroll)',
        'Preferred language',
        'Device type and resolution',
        'Country of origin (approximate)'
      ],
      privacy: 'Your privacy is important to us. We do not collect personally identifiable information.',
      accept: 'Accept cookies',
      decline: 'Decline',
      showDetails: 'Show details',
      hideDetails: 'Hide details'
    }
  };

  const content = cookieContent[lang];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                {content.title}
              </h3>
              
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                {content.description}
              </p>

              {/* Details section */}
              {showDetails && (
                <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <h4 className="text-white font-medium mb-3">{content.whatWeTrack}</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    {content.trackingItems.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-gray-500 mt-3 italic">
                    {content.privacy}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      console.log('Accept button clicked');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    {content.accept}
                  </button>
                  
                  <button
                    onClick={() => {
                      console.log('Decline button clicked');
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
                  >
                    {content.decline}
                  </button>
                </div>
                
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-gray-400 hover:text-blue-400 text-xs underline transition-colors duration-200"
                >
                  {showDetails ? content.hideDetails : content.showDetails}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}