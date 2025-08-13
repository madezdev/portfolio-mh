import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';

export default function TeamWork() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);

  const teamWorkContent = {
    es: {
      title: '¿Proyecto Grande?',
      subtitle: 'Trabajo en Equipo',
      description: 'Para proyectos de mayor envergadura, colaboro con un equipo de desarrolladores especializados. Esto nos permite acelerar los tiempos de entrega y asegurar la calidad en cada aspecto del desarrollo.',
      features: [
        'Equipos escalables según el proyecto',
        'Desarrolladores especializados por área',
        'Metodologías ágiles de desarrollo',
        'Comunicación constante y transparente',
        'Tiempos de entrega optimizados'
      ]
    },
    en: {
      title: 'Large Project?',
      subtitle: 'Team Work',
      description: 'For larger projects, I collaborate with a team of specialized developers. This allows us to accelerate delivery times and ensure quality in every aspect of development.',
      features: [
        'Scalable teams based on project needs',
        'Developers specialized by area',
        'Agile development methodologies',
        'Constant and transparent communication',
        'Optimized delivery times'
      ]
    }
  };

  const content = teamWorkContent[lang];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-950/20 to-purple-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full text-blue-300 text-sm font-medium mb-6">
            {content.title}
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {content.subtitle}
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {content.description}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Features list */}
          <div className="space-y-6">
            {content.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-4 bg-slate-900/30 rounded-xl border border-slate-800/50 hover:bg-slate-900/50 transition-all duration-300">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{index + 1}</span>
                </div>
                <p className="text-gray-300 font-medium">{feature}</p>
              </div>
            ))}
          </div>

          {/* Right side - Visual representation */}
          <div className="relative">
            <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
              {/* Team visualization */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* Team members representation */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-2xl mb-2 mx-auto">
                    👨‍💻
                  </div>
                  <span className="text-xs text-gray-400">Frontend</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-2xl mb-2 mx-auto">
                    ⚙️
                  </div>
                  <span className="text-xs text-gray-400">Backend</span>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-2xl mb-2 mx-auto">
                    🎨
                  </div>
                  <span className="text-xs text-gray-400">UX/UI</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-white mb-2">50%</div>
                  <div className="text-sm text-gray-400">
                    {lang === 'es' ? 'Más rápido' : 'Faster'}
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-2">3x</div>
                  <div className="text-sm text-gray-400">
                    {lang === 'es' ? 'Más capacidad' : 'More capacity'}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-500/20 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}