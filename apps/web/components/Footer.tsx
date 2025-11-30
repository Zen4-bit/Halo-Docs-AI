'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Phone, MapPin, Github, Twitter, Linkedin, ArrowRight } from 'lucide-react';
import Logo from './Logo';

const footerLinks = {
  product: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'API Docs', href: '/docs' },
    { label: 'Integrations', href: '/integrations' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
  ],
  support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Community', href: '/community' },
    { label: 'Status', href: '/status' },
    { label: 'Terms of Service', href: '/terms' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'GDPR', href: '/gdpr' },
    { label: 'Security', href: '/security' },
  ],
};

const socialLinks = [
  { icon: <Twitter className="w-5 h-5" />, href: 'https://x.com/PankajYadavPYC', label: 'Twitter' },
  { icon: <Github className="w-5 h-5" />, href: 'https://github.com/Zen4-bit', label: 'GitHub' },
  { icon: <Linkedin className="w-5 h-5" />, href: 'https://www.linkedin.com/in/pankaj-yadav-83292138b/', label: 'LinkedIn' },
];

const Footer = memo(function Footer() {
  return (
    <footer className="relative bg-background border-t border-border overflow-hidden pt-20 pb-10">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02] dark:opacity-5 [mask-image:linear-gradient(to_top,black,transparent)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-12 mb-16">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-8">
            <Link href="/" className="inline-flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                <div className="relative group-hover:scale-105 transition-transform duration-500">
                  <Logo className="w-12 h-12" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text tracking-tight">HALO</div>
                <div className="text-xs text-primary font-medium tracking-wider">AI PLATFORM</div>
              </div>
            </Link>

            <p className="text-text-secondary leading-relaxed max-w-sm text-lg">
              Next-generation document intelligence platform that transforms how teams work with information through AI-powered automation.
            </p>

            {/* Newsletter */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-text uppercase tracking-wider">Stay Updated</h4>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-surface-highlight border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <button className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
                  Subscribe
                </button>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 bg-surface-highlight backdrop-blur-sm border border-border rounded-xl flex items-center justify-center text-text-muted hover:text-text hover:bg-surface hover:border-primary/30 transition-all duration-300 group"
                >
                  <div className="group-hover:text-primary transition-colors">
                    {social.icon}
                  </div>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
              <div key={category} className="space-y-6">
                <h3 className="text-sm font-bold text-text uppercase tracking-wider">
                  {category}
                </h3>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-text-secondary hover:text-primary transition-colors duration-200 flex items-center group"
                      >
                        <span className="group-hover:translate-x-1 transition-transform duration-200">{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: Mail, label: 'Email Us', value: 'py786656@gmail.com', href: 'mailto:py786656@gmail.com' },
            { icon: Phone, label: 'Call Us', value: '+91-9807644112', href: 'tel:+919807644112' },
            { icon: MapPin, label: 'Visit Us', value: 'India', href: '#' },
          ].map((item, index) => (
            <motion.a
              key={item.label}
              href={item.href}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-4 p-6 rounded-2xl bg-surface-highlight border border-border hover:bg-surface hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 text-primary">
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">{item.label}</div>
                <div className="text-text font-medium group-hover:text-primary transition-colors">{item.value}</div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-text-muted text-sm">
            &copy; {new Date().getFullYear()} HALO AI. All rights reserved.
          </div>

          <div className="flex items-center space-x-8 text-sm font-medium">
            <Link href="/privacy" className="text-text-muted hover:text-text transition-colors">Privacy</Link>
            <Link href="/terms" className="text-text-muted hover:text-text transition-colors">Terms</Link>
            <Link href="/cookies" className="text-text-muted hover:text-text transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
