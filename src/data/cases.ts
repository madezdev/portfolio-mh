export type Case = {
  id: string;
  client: string;
  title: string;
  category: 'web' | 'product' | 'automation' | 'ai';
  /** Short human-readable type label shown on the card, e.g. "Fintech · Wallet". */
  tag?: string;
  summary: string;
  /** Product screenshot. When absent, the card shows a branded fallback tile. */
  image?: string;
  liveUrl?: string;
  logo?: string;
  testimonial?: { quote: string; author: string; role: string };
};

// Real case studies. DRAFT summaries (Spanish) — owner to refine, and to add
// `image` (product screenshot), `liveUrl`, `logo`, and `testimonial` when available.
// Trust section (logos + testimonials) stays hidden until those are provided.
export const cases: Case[] = [
  {
    id: 'billetera-pais',
    client: 'Billetera País',
    title: 'Billetera País',
    category: 'product',
    tag: 'Fintech · Wallet',
    summary: 'Billetera digital y medios de pago para el día a día.',
  },
  {
    id: 'totalpay',
    client: 'TotalPay',
    title: 'TotalPay',
    category: 'product',
    tag: 'Fintech · Wallet',
    summary: 'Plataforma de pagos y billetera virtual.',
  },
  {
    id: 'ses-sa',
    client: 'SES-SA',
    title: 'SES-SA',
    category: 'product',
    tag: 'SaaS',
    summary: 'Plataforma SaaS a medida para gestión operativa.',
  },
  {
    id: 'consultora-mutual',
    client: 'Consultora Mutual',
    title: 'Consultora Mutual',
    category: 'product',
    tag: 'SaaS',
    summary: 'Plataforma de gestión para una mutual.',
  },
  {
    id: 'mercado-solar',
    client: 'Mercado Solar',
    title: 'Mercado Solar',
    category: 'web',
    tag: 'E-commerce',
    summary: 'Tienda online de productos de energía solar.',
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
