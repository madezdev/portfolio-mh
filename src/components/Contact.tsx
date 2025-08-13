import { useStore } from '@nanostores/react';
import { currentLanguage } from '../i18n/store';
import { useTranslations } from '../i18n/utils';
import { useState } from 'react';

export default function Contact() {
  const lang = useStore(currentLanguage);
  const { t } = useTranslations(lang);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setShowError(false);

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const contactData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      budget: formData.get('budget') as string,
      message: formData.get('message') as string,
      language: lang
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData)
      });

      const result = await response.json();

      if (result.success) {
        setIsSubmitting(false);
        setShowSuccess(true);
        form.reset();
        
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
    } catch (error) {
      setIsSubmitting(false);
      setShowError(true);
      setErrorMessage(lang === 'es' 
        ? 'Error al enviar el mensaje. Por favor intenta de nuevo.' 
        : 'Error sending message. Please try again.'
      );
    
      setTimeout(() => setShowError(false), 5000);
    }
  };

  const contactMethods = [
    { key: 'email', icon: '📧', color: 'blue', href: 'mailto:madezdev@gmail.com', value: 'madezdev@gmail.com' },
    { key: 'whatsapp', icon: '💬', color: 'green', href: 'https://wa.me/1234567890', value: '+54 9 11 3326-6874' },
    { key: 'linkedin', icon: '💼', color: 'blue', href: 'https://linkedin.com/in/madezdev', value: '/in/madezdev' },
    { key: 'github', icon: '🐙', color: 'purple', href: 'https://github.com/madezdev', value: '/madezdev' }
  ];

  return (
    <section id="contact" className="py-20 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('contact.title').split(' ').slice(0, -1).join(' ')}{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {t('contact.title').split(' ').slice(-1)[0]}
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t('contact.subtitle')}
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto rounded-full mt-6"></div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">{t('contact.getInTouch')}</h3>
              <p className="text-gray-300 mb-8">
                {t('contact.description')}
              </p>
            </div>

            {/* Contact Methods */}
            <div className="space-y-6">
              {contactMethods.map((method) => (
                <div key={method.key} className={`flex items-center p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-${method.color}-500/50 transition-colors group`}>
                  <div className={`w-12 h-12 bg-${method.color}-500/20 rounded-lg flex items-center justify-center mr-4 group-hover:bg-${method.color}-500/30 transition-colors`}>
                    <span className={`text-${method.color}-400 text-xl`}>{method.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{t(`contact.methods.${method.key}`)}</h4>
                    <a 
                      href={method.href} 
                      className={`text-gray-400 hover:text-${method.color}-400 transition-colors`}
                    >
                      {method.value}
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Availability Status */}
            <div className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-center mb-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-3"></div>
                <span className="text-green-400 font-semibold">{t('contact.availability.status')}</span>
              </div>
              <p className="text-gray-300 text-sm">
                {t('contact.availability.description')}
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6">{t('contact.form.title')}</h3>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    {t('contact.form.fields.name')}
                  </label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    required
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder={t('contact.form.fields.namePlaceholder')}
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    {t('contact.form.fields.email')}
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder={t('contact.form.fields.emailPlaceholder')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                  {t('contact.form.fields.subject')}
                </label>
                <select 
                  id="subject" 
                  name="subject" 
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  <option value="">{t('contact.form.fields.subjectPlaceholder')}</option>
                  <option value="frontend">{t('contact.form.subjects.frontend')}</option>
                  <option value="fullstack">{t('contact.form.subjects.fullstack')}</option>
                  <option value="design">{t('contact.form.subjects.design')}</option>
                  <option value="mobile">{t('contact.form.subjects.mobile')}</option>
                  <option value="saas">{t('contact.form.subjects.saas')}</option>
                  <option value="other">{t('contact.form.subjects.other')}</option>
                </select>
              </div>

              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-300 mb-2">
                  {t('contact.form.fields.budget')}
                </label>
                <select 
                  id="budget" 
                  name="budget"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  <option value="">{t('contact.form.fields.budgetPlaceholder')}</option>
                  <option value="under-1k">{t('contact.form.budgets.under1k')}</option>
                  <option value="1k-5k">{t('contact.form.budgets.1k5k')}</option>
                  <option value="5k-10k">{t('contact.form.budgets.5k10k')}</option>
                  <option value="10k-plus">{t('contact.form.budgets.10kplus')}</option>
                  <option value="discuss">{t('contact.form.budgets.discuss')}</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                  {t('contact.form.fields.message')}
                </label>
                <textarea 
                  id="message" 
                  name="message" 
                  rows={5}
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                  placeholder={t('contact.form.fields.messagePlaceholder')}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>{isSubmitting ? t('contact.form.sending') : t('contact.form.submit')}</span>
                  {isSubmitting ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </span>
              </button>
            </form>

            {/* Success Message */}
            {showSuccess && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center text-green-400">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {t('contact.form.success')}
                </div>
              </div>
            )}

            {/* Error Message */}
            {showError && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center text-red-400">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errorMessage}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}