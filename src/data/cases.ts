export type Case = {
  id: string;
  client: string;
  title: string;
  category: 'web' | 'product' | 'automation' | 'ai';
  /** Short human-readable type label shown on the card, e.g. "Fintech · Wallet". */
  tag?: string;
  summary: string;
  /**
   * Product screenshot, served from `public/cases/`, e.g. `/cases/totalpay.webp`.
   * Export at 2x the render box (featured ~1600x800, standard ~1200x750) and crop
   * so the product's own header stays in frame — the card anchors it to the top.
   * When absent, the card shows a branded fallback tile.
   */
  image?: string;
  /** Intrinsic size of `image`, in px. Set both to reserve layout space and avoid CLS. */
  imageWidth?: number;
  imageHeight?: number;
  /** Two or three technologies shown as chips on the card, e.g. ['React', 'Node', 'Postgres']. */
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
// `image` (product screenshot), `stack`, `liveUrl`, `logo`, and `testimonial` when
// available. Every one of those fields degrades on its own: a case with no image gets
// the fallback tile, one with no `liveUrl` renders as a non-interactive card.
// Trust section (logos + testimonials) stays hidden until those are provided.
// The first entry renders as the featured card — keep the strongest case at the top.
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
    // Cropped to the assignments panel, at the card's own aspect. The supervisor
    // sidebar and the detail header are outside the frame, so the published file
    // holds no personal data — the schools and addresses are public record.
    image: '/cases/ses-sa.webp',
    imageWidth: 1230,
    imageHeight: 828,
    stack: ['React', 'NestJS', 'Supabase'],
    // The root redirects straight to /login: there is no public surface to send a
    // prospect to, so the card reports that it ships instead of linking out.
    access: 'private',
    liveUrl: 'https://www.ses-sa.app',
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
