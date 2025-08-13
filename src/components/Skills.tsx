import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';

export default function Skills() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);

  const skillCategories = [
    {
      key: 'frontend',
      icon: '⚛️',
      color: 'blue',
      skills: [
        { name: 'React', percentage: 95 },
        { name: 'TypeScript', percentage: 90 },
        { name: 'Next.js', percentage: 90 },
        { name: 'Astro', percentage: 85 },
        { name: 'Tailwind CSS', percentage: 95 }
      ]
    },
    {
      key: 'backend',
      icon: '🟢',
      color: 'green',
      skills: [
        { name: 'Node.js', percentage: 92 },
        { name: 'Java', percentage: 75 },
        { name: 'Express.js', percentage: 90 },
        { name: 'SQL', percentage: 78 },
        { name: 'MongoDB', percentage: 75 },
        { name: 'PostgreSQL', percentage: 78 }
      ]
    },
    {
      key: 'design',
      icon: '🎨',
      color: 'purple',
      skills: [
        { name: 'Figma', percentage: 93 },
        { name: 'Adobe XD', percentage: 87 },
        { name: 'Git & GitHub', percentage: 95 },
        { name: 'Docker', percentage: 72 }
      ]
    }
  ];

  const technologies = [
    { icon: '⚛️', name: 'React' },
    { icon: '🟢', name: 'Node.js' },
    { icon: '📘', name: 'TypeScript' },
    { icon: '⚫', name: 'Next.js' },
    { icon: '🔷', name: 'Tailwind' },
    { icon: '🚀', name: 'Astro' },
    { icon: '☕', name: 'Java' },
    { icon: '🗃️', name: 'SQL' },
    { icon: '🎨', name: 'Figma' },
    { icon: '📱', name: 'React Native' },
    { icon: '🐳', name: 'Docker' },
    { icon: '🔄', name: 'Git' }
  ];

  return (
    <section id="skills" className="py-20 bg-slate-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('skills.title').split(' ').slice(0, -1).join(' ')}{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {t('skills.title').split(' ').slice(-1)[0]}
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t('skills.subtitle')}
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full mt-6"></div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {skillCategories.map((category) => (
            <div key={category.key} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <div className={`w-12 h-12 bg-${category.color}-500/20 rounded-xl flex items-center justify-center mr-4`}>
                  <span className="text-2xl">{category.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {t(`skills.categories.${category.key}`)}
                </h3>
              </div>
              
              <div className="space-y-4">
                {category.skills.map((skill) => (
                  <div key={skill.name} className="skill-item">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium">{skill.name}</span>
                      <span className={`text-${category.color}-400 text-sm`}>{skill.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`bg-gradient-to-r from-${category.color}-400 to-${category.color}-600 h-2 rounded-full`}
                        style={{ width: `${skill.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Technology Icons Grid */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            {t('skills.technologies')}
          </h3>
          <div className="flex flex-wrap justify-center items-center gap-4 max-w-6xl mx-auto">
            {technologies.map((tech) => (
              <div key={tech.name} className="w-18 h-22 lg:w-20 lg:h-22 flex flex-col items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm border border-slate-800/50 rounded-xl hover:bg-slate-900/60 hover:border-slate-700/50 transition-all duration-300 group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {tech.icon}
                </div>
                <span className="text-gray-300 text-xs font-medium text-center leading-tight">{tech.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}