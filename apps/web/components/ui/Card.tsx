import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLMotionProps<'div'> {
    variant?: 'default' | 'glass' | 'outline' | 'gradient';
    hoverEffect?: boolean;
    children?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', hoverEffect = true, children, ...props }, ref) => {

        const variants = {
            default: 'bg-surface border border-border shadow-sm',
            glass: 'glass-card bg-gradient-card border border-border/50 dark:border-white/10',
            outline: 'bg-transparent border border-border',
            gradient: 'bg-gradient-surface border border-white/20 shadow-xl',
        };

        const animationProps = hoverEffect ? {
            initial: { y: 0 },
            whileHover: { y: -5, transition: { duration: 0.2 } }
        } : {};

        return (
            <motion.div
                ref={ref}
                {...animationProps}
                className={cn(
                    'rounded-2xl p-6 relative',
                    variants[variant],
                    className
                )}
                {...props}
            >
                {children}
                {variant === 'glass' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                )}
            </motion.div>
        );
    }
);

Card.displayName = 'Card';
