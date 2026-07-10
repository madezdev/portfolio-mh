export type Case = {
  id: string;
  client: string;
  title: string;
  category: 'web' | 'product' | 'automation' | 'ai';
  summary: string;
  image: string;
  liveUrl?: string;
  logo?: string;
  testimonial?: { quote: string; author: string; role: string };
};

// PLACEHOLDER DATA — replace with real case studies (owner has screenshots,
// live links, client logos, and testimonials; no metrics). Keep the shape.
export const cases: Case[] = [
  {
    id: 'placeholder-1',
    client: 'Cliente ejemplo',
    title: 'Plataforma SaaS de gestión',
    category: 'product',
    summary:
      'Placeholder — reemplazar. Qué construimos y qué resolvió para el cliente, en 1–2 frases.',
    image: '/cases/placeholder-1.png',
    liveUrl: 'https://example.com',
    logo: '/cases/logos/placeholder-1.svg',
    testimonial: {
      quote: 'Placeholder — cita real del cliente sobre trabajar con madezdev.',
      author: 'Nombre Apellido',
      role: 'CEO, Cliente ejemplo',
    },
  },
  {
    id: 'placeholder-2',
    client: 'Cliente ejemplo 2',
    title: 'Sitio de alto rendimiento',
    category: 'web',
    summary: 'Placeholder — reemplazar con el segundo caso real.',
    image: '/cases/placeholder-2.png',
    liveUrl: 'https://example.com',
  },
];

export function getTestimonials() {
  return cases
    .filter((c): c is Case & { testimonial: NonNullable<Case['testimonial']> } => Boolean(c.testimonial))
    .map((c) => ({ ...c.testimonial, client: c.client }));
}

export function getClientLogos() {
  return cases
    .filter((c): c is Case & { logo: string } => Boolean(c.logo))
    .map((c) => ({ client: c.client, logo: c.logo }));
}
