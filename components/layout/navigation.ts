export const PRIMARY_NAV = [
  { href: '/collections', label: 'Collections' },
  { href: '/gemstones', label: 'Gemstones' },
  { href: '/zodiac', label: 'The Zodiac' },
  { href: '/craftsmanship', label: 'Craftsmanship' },
  { href: '/our-story', label: 'Our Story' },
];

export const FOOTER_NAV = [
  {
    title: 'The House',
    links: [
      { href: '/collections', label: 'Collections' },
      { href: '/gemstones', label: 'Gemstones' },
      { href: '/find-your-stone', label: 'Find Your Stone' },
      { href: '/configure', label: 'Create Your Ring' },
      { href: '/craftsmanship', label: 'Craftsmanship' },
      { href: '/our-story', label: 'Our Story' },
      { href: '/journal', label: 'Journal' },
    ],
  },
  {
    title: 'Client Care',
    links: [
      { href: '/contact', label: 'Contact' },
      { href: '/consultation', label: 'Book a Consultation' },
      { href: '/shipping', label: 'Shipping' },
      { href: '/returns', label: 'Returns' },
      { href: '/care', label: 'Care' },
      { href: '/track-order', label: 'Track an Order' },
    ],
  },
];

/** Placeholder: set NEXT_PUBLIC_WHATSAPP to the house number (country code, digits only). */
export const WHATSAPP_URL = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP ?? '910000000000'}?text=${encodeURIComponent('Hello VYOMA, I would like to know more about a piece.')}`;
