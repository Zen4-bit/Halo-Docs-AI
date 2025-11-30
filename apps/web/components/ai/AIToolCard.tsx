'use client';

import Link from 'next/link';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface AIToolCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
    gradient: string;
    badge?: string;
}

export function AIToolCard({ title, description, icon: Icon, href, gradient, badge }: AIToolCardProps) {
    return (
        <Link href={href} className="block h-full">
            <Card
                variant="glass"
                className="h-full p-6 transition-all duration-300 hover:-translate-y-1.5 group"
                hoverEffect={true}
            >
                <div className="relative flex-1">
                    <div className="flex justify-between items-start mb-4">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-black/20`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>

                        {/* Badge */}
                        {badge && (
                            <span className="px-2 py-1 rounded-full bg-surface-highlight border border-border text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                                {badge}
                            </span>
                        )}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                        {title}
                    </h3>

                    <p className="text-text-secondary text-sm leading-relaxed mb-4">
                        {description}
                    </p>
                </div>

                {/* Footer Action */}
                <div className="relative mt-auto pt-4 border-t border-white/10 flex items-center justify-between text-sm font-medium">
                    <span className="text-text-secondary group-hover:text-white transition-colors">Launch Tool</span>
                    <ArrowRight className="w-4 h-4 text-text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
            </Card>
        </Link>
    );
}
