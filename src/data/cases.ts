export type Case = {
  id: string;
  client: string;
  title: string;
  category: 'web' | 'product' | 'automation' | 'ai';
  /** Short human-readable type label shown on the card, e.g. "Fintech · Wallet". */
  tag?: string;
  summary: string;
  /** Two or three technologies listed under the entry, e.g. ['React', 'Node', 'Postgres']. */
  stack?: string[];
  /**
   * Whether a visitor can actually see the product. Private ones sit behind a
   * login, so the card states that it is in production instead of offering a link
   * into a credentials form. Defaults to public.
   */
  access?: 'public' | 'private';
  /** Linked from the card only when `access` is public. */
  liveUrl?: string;
  logo?: string;
  testimonial?: { quote: string; author: string; role: string };
};

// Real case studies. DRAFT summaries (Spanish) — owner to refine, and to add
// `stack`, `liveUrl`, `logo`, and `testimonial` when available. Every one of those
// fields degrades on its own: a case with none of them still renders as a complete
// index entry, since the section is typographic rather than media-led.
// Trust section (logos + testimonials) stays hidden until those are provided.
// Order is the hierarchy — the index is numbered, so keep the strongest case first.
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
    id: 'maspay',
    client: 'MasPay',
    title: 'MasPay',
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
    // No `liveUrl`: the root redirects straight to /login, so there is no public
    // surface to send a prospect to. Without a reachable URL there is no status
    // to report either — the entry stands on its name and what it does.
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
