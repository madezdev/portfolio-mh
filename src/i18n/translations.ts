export const translations = {
  es: {
    // Brand
    brand: {
      name: 'madezdev',
      tagline: 'Del concepto a la realidad.',
    },

    // Navigation
    nav: {
      services: 'Servicios',
      cases: 'Casos',
      process: 'Proceso',
      contactCta: 'Agendá una llamada',
      // Shown instead of `contactCta` below md. The full label plus the wordmark and
      // the language toggle need 357px of a 375px topbar, so the long one cannot fit
      // on a phone at any type size.
      contactCtaShort: 'Hablemos',
    },

    // Hero Section
    hero: {
      eyebrow: 'Estudio de producto digital',
      title: {
        line1: 'Del concepto',
        line2: 'a la realidad',
      },
      subtitle: 'Diseñamos y construimos productos, SaaS y automatizaciones con IA. De la idea a producción.',
      cta: {
        primary: 'Definí tu proyecto',
        secondary: 'Ver casos',
      },
      scroll: 'scroll',
      scrollAria: 'Bajar a servicios',
    },

    // AI Front Door
    ai: {
      eyebrow: '// definí tu idea',
      title: 'Definamos tu proyecto',
      subtitle: 'Contanos qué tenés en mente y nuestra IA te ayuda a darle forma. Después el equipo sigue la conversación.',
      chips: { 0: 'Quiero un SaaS', 1: 'Automatizar un proceso', 2: 'Rehacer mi web', 3: 'Quiero una web nueva' },
      inputPlaceholder: 'Escribí tu idea...',
      send: 'Enviar',
      capture: {
        prompt: '¿Seguimos? Dejanos tu contacto y el equipo te escribe.',
        name: 'Tu nombre',
        email: 'tu@email.com',
        submit: 'Enviar a madezdev',
        success: '¡Listo! Te contactamos pronto.',
      },
      fallback: {
        text: 'La IA no está disponible en este momento.',
        cta: 'Contanos tu proyecto por el formulario',
      },
      disclosure: 'Conversación procesada por IA.',
    },

    // About Section
    about: {
      title: 'Sobre mí',
      description1: 'Soy un apasionado desarrollador Full Stack con experiencia en la creación de interfaces web atractivas y funcionales utilizando React y Node.js. Mi enfoque no se limita solo al código, también soy un diseñador UX/UI que se preocupa por crear experiencias digitales intuitivas y atractivas.',
      description2: 'Junto a mi equipo, desarrollamos aplicaciones web y sitios web modernos, rápidos y seguros con tecnologías como React y Node.js. Creamos soluciones personalizadas, responsivas y optimizadas para ofrecer experiencias fluidas y atractivas. Combinamos diseño UX/UI con funcionalidad, integrando características dinámicas, alto rendimiento y SEO, para que tu proyecto digital esté listo para crecer y destacar en el mercado.',
      points: {
        development: {
          title: 'Desarrollo Moderno',
          desc: 'Aplicaciones web con las últimas tecnologías'
        },
        design: {
          title: 'Diseño UX/UI',
          desc: 'Interfaces centradas en el usuario'
        },
        performance: {
          title: 'Performance',
          desc: 'Optimización para máxima velocidad'
        },
        collaboration: {
          title: 'Trabajo en Equipo',
          desc: 'Colaboración escalable para proyectos grandes'
        }
      },
      stats: {
        experience: 'Años de experiencia',
        projects: 'Proyectos completados',
        availability: 'Disponibilidad'
      }
    },

    // Services Section
    services: {
      eyebrow: '// servicios',
      title: 'Lo que construimos',
      subtitle: 'Diseñamos y desarrollamos el producto completo — de la idea a producción — y lo dejamos listo para crecer.',
      pillars: {
        web: {
          title: 'Webs y sitios que venden',
          description: 'Sitios y landing pages rápidos, medibles y hechos para convertir, no solo para verse bien.',
          outcomes: { 0: 'Diseño a medida', 1: 'Performance y SEO', 2: 'Listos para escalar' },
        },
        product: {
          title: 'Productos y SaaS a medida',
          description: 'Del concepto al producto en producción: arquitectura sólida, pagos, paneles y multi-tenant.',
          outcomes: { 0: 'MVP a producción', 1: 'Suscripciones y pagos', 2: 'Arquitectura escalable' },
        },
        automation: {
          title: 'Automatizaciones',
          description: 'Conectamos tus herramientas y eliminamos el trabajo manual repetitivo que te frena.',
          outcomes: { 0: 'Integraciones a medida', 1: 'Flujos automáticos', 2: 'Menos errores, más tiempo' },
        },
        ai: {
          title: 'IA aplicada',
          description: 'Asistentes, agentes y features con IA que mueven de verdad el negocio, no demos de laboratorio.',
          outcomes: { 0: 'Asistentes y agentes', 1: 'Automatización con IA', 2: 'Integración de modelos' },
        },
      },
    },

    // Cases Section
    cases: {
      eyebrow: '// casos',
      title: 'Del concepto a la realidad',
      subtitle: 'Algunos productos que llevamos de la idea a producción.',
      liveLabel: 'Ver en vivo',
      privateLabel: 'En producción · acceso privado',
      emptyLabel: 'Casos en camino.',
    },

    // Process Section
    process: {
      eyebrow: '// proceso',
      title: 'Del concepto a la realidad, paso a paso',
      subtitle: 'Un proceso claro: sabés qué pasa en cada etapa y ves avances seguido.',
      steps: {
        idea: {
          title: 'Idea',
          description: 'Entendemos tu negocio y definimos el problema real antes de escribir una línea de código.',
        },
        design: {
          title: 'Diseño',
          description: 'UX/UI y arquitectura primero: prototipamos y decidimos antes de construir.',
        },
        build: {
          title: 'Construcción',
          description: 'Desarrollo iterativo con entregas frecuentes. Vas viendo el producto tomar forma.',
        },
        ship: {
          title: 'Producción',
          description: 'Deploy, medición y escala. Tu producto vivo y listo para crecer.',
        },
      },
    },

    // Trust Section
    trust: {
      title: 'Confían en nosotros',
      subtitle: 'Marcas y equipos que ya construyeron con madezdev.',
    },

    // Skills Section
    skills: {
      title: 'Habilidades Clave',
      subtitle: 'Tecnologías y herramientas que domino para crear soluciones digitales excepcionales',
      technologies: 'Tecnologías',
      categories: {
        frontend: 'Frontend',
        backend: 'Backend',
        design: 'Design & Tools'
      }
    },

    // Contact Section
    contact: {
      eyebrow: '// contacto',
      title: 'Contanos tu proyecto',
      subtitle: 'Contanos qué tenés en mente y te respondemos con los próximos pasos. Normalmente en 24 h.',
      subjects: {
        web: 'Web o sitio',
        product: 'Producto / SaaS',
        automation: 'Automatización',
        ai: 'IA aplicada',
        other: 'Otro',
      },
      form: {
        name: 'Nombre',
        namePlaceholder: 'Tu nombre',
        email: 'Email',
        emailPlaceholder: 'tu@email.com',
        subject: '¿Qué necesitás?',
        subjectPlaceholder: 'Elegí una opción',
        message: 'Mensaje',
        messagePlaceholder: 'Contanos sobre tu proyecto...',
        submit: 'Enviar',
        sending: 'Enviando...',
        success: '¡Mensaje enviado! Te respondemos pronto.',
        error: 'No se pudo enviar. Probá de nuevo en un momento.',
      },
    },

    // Footer
    footer: {
      tagline: 'Llevamos tus ideas digitales del concepto a la realidad.',
      navTitle: 'Navegación',
      servicesTitle: 'Servicios',
      rights: 'Todos los derechos reservados.',
      builtWith: 'Diseñado y construido por madezdev.',
    }
  },
  
  en: {
    // Brand
    brand: {
      name: 'madezdev',
      tagline: 'From concept to reality.',
    },

    // Navigation
    nav: {
      services: 'Services',
      cases: 'Work',
      process: 'Process',
      contactCta: 'Book a call',
      // See the Spanish note: the full label does not fit a phone topbar.
      contactCtaShort: "Let's talk",
    },

    // Hero Section
    hero: {
      eyebrow: 'Digital product studio',
      title: {
        line1: 'From concept',
        line2: 'to reality',
      },
      subtitle: 'We design and build products, SaaS, and AI automations. From idea to production.',
      cta: {
        primary: 'Define your project',
        secondary: 'See our work',
      },
      scroll: 'scroll',
      scrollAria: 'Scroll to services',
    },

    // AI Front Door
    ai: {
      eyebrow: '// define your idea',
      title: "Let's define your project",
      subtitle: 'Tell us what you have in mind and our AI helps you shape it. Then the team picks up the conversation.',
      chips: { 0: 'I want a SaaS', 1: 'Automate a process', 2: 'Rebuild my website', 3: 'I want a new website' },
      inputPlaceholder: 'Type your idea...',
      send: 'Send',
      capture: {
        prompt: 'Want to continue? Leave your contact and the team will reach out.',
        name: 'Your name',
        email: 'you@email.com',
        submit: 'Send to madezdev',
        success: "Done! We'll be in touch soon.",
      },
      fallback: {
        text: 'The AI is unavailable right now.',
        cta: 'Tell us about your project via the form',
      },
      disclosure: 'Conversation processed by AI.',
    },

    // About Section
    about: {
      title: 'About me',
      description1: 'I\'m a passionate Full Stack developer with experience creating attractive and functional web interfaces using React and Node.js. My approach is not limited to code alone, I\'m also a UX/UI designer who cares about creating intuitive and appealing digital experiences.',
      description2: 'Together with my team, we develop modern, fast and secure web applications and websites using technologies like React and Node.js. We create personalized, responsive and optimized solutions to offer fluid and attractive experiences. We combine UX/UI design with functionality, integrating dynamic features, high performance and SEO, so your digital project is ready to grow and stand out in the market.',
      points: {
        development: {
          title: 'Modern Development',
          desc: 'Web applications with latest technologies'
        },
        design: {
          title: 'UX/UI Design',
          desc: 'User-centered interfaces'
        },
        performance: {
          title: 'Performance',
          desc: 'Optimization for maximum speed'
        },
        collaboration: {
          title: 'Team Work',
          desc: 'Scalable collaboration for large projects'
        }
      },
      stats: {
        experience: 'Years of experience',
        projects: 'Completed projects',
        availability: 'Availability'
      }
    },

    // Services Section
    services: {
      eyebrow: '// services',
      title: 'What we build',
      subtitle: 'We design and build the whole product — from idea to production — and leave it ready to grow.',
      pillars: {
        web: {
          title: 'Websites that sell',
          description: 'Fast, measurable sites and landing pages built to convert, not just to look good.',
          outcomes: { 0: 'Custom design', 1: 'Performance & SEO', 2: 'Ready to scale' },
        },
        product: {
          title: 'Products & custom SaaS',
          description: 'From concept to production: solid architecture, payments, dashboards, and multi-tenant.',
          outcomes: { 0: 'MVP to production', 1: 'Subscriptions & payments', 2: 'Scalable architecture' },
        },
        automation: {
          title: 'Automations',
          description: 'We connect your tools and remove the repetitive manual work that slows you down.',
          outcomes: { 0: 'Custom integrations', 1: 'Automated workflows', 2: 'Fewer errors, more time' },
        },
        ai: {
          title: 'Applied AI',
          description: 'Assistants, agents, and AI features that actually move the business — not lab demos.',
          outcomes: { 0: 'Assistants & agents', 1: 'AI automation', 2: 'Model integration' },
        },
      },
    },

    // Cases Section
    cases: {
      eyebrow: '// work',
      title: 'From concept to reality',
      subtitle: 'A few products we took from idea to production.',
      liveLabel: 'View live',
      privateLabel: 'In production · private access',
      emptyLabel: 'Case studies coming soon.',
    },

    // Process Section
    process: {
      eyebrow: '// process',
      title: 'From concept to reality, step by step',
      subtitle: 'A clear process: you know what happens at each stage and see progress often.',
      steps: {
        idea: {
          title: 'Idea',
          description: 'We understand your business and define the real problem before writing a line of code.',
        },
        design: {
          title: 'Design',
          description: 'UX/UI and architecture first: we prototype and decide before building.',
        },
        build: {
          title: 'Build',
          description: 'Iterative development with frequent releases. You watch the product take shape.',
        },
        ship: {
          title: 'Production',
          description: 'Deploy, measure, and scale. Your product live and ready to grow.',
        },
      },
    },

    // Trust Section
    trust: {
      title: 'Trusted by',
      subtitle: 'Brands and teams that already built with madezdev.',
    },

    // Skills Section
    skills: {
      title: 'Key Skills',
      subtitle: 'Technologies and tools I master to create exceptional digital solutions',
      technologies: 'Technologies',
      categories: {
        frontend: 'Frontend',
        backend: 'Backend',
        design: 'Design & Tools'
      }
    },

    // Contact Section
    contact: {
      eyebrow: '// contact',
      title: 'Tell us about your project',
      subtitle: 'Tell us what you have in mind and we’ll reply with the next steps. Usually within 24h.',
      subjects: {
        web: 'Website',
        product: 'Product / SaaS',
        automation: 'Automation',
        ai: 'Applied AI',
        other: 'Other',
      },
      form: {
        name: 'Name',
        namePlaceholder: 'Your name',
        email: 'Email',
        emailPlaceholder: 'you@email.com',
        subject: 'What do you need?',
        subjectPlaceholder: 'Pick one',
        message: 'Message',
        messagePlaceholder: 'Tell us about your project...',
        submit: 'Send',
        sending: 'Sending...',
        success: 'Message sent! We’ll get back to you soon.',
        error: 'Could not send. Please try again in a moment.',
      },
    },

    // Footer
    footer: {
      tagline: 'We turn your digital ideas from concept into reality.',
      navTitle: 'Navigation',
      servicesTitle: 'Services',
      rights: 'All rights reserved.',
      builtWith: 'Designed and built by madezdev.',
    }
  }
} as const;

export type Language = 'es' | 'en';
export type TranslationKey = keyof typeof translations.es;