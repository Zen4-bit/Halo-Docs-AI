export interface NavItem {
  href: string;
  label: string;
  badge?: string;
  match?: string;
}

// Clean, organized primary navigation
export const primaryNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tools', label: 'Tools', match: '/tools' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/help', label: 'Help', match: '/help' },
  { href: '/contact', label: 'Contact' },
];

