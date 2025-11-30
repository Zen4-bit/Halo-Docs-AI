import React from 'react';

interface LogoProps {
    className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = 'w-10 h-10' }) => {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="halo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFC107" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Outer Ring */}
            <circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#halo-gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                className="opacity-90"
            />

            {/* Inner Ring / Arc */}
            <path
                d="M 50 25 A 25 25 0 0 1 75 50"
                stroke="white"
                strokeWidth="6"
                strokeLinecap="round"
                className="opacity-80"
            />

            {/* Central Dot/Spark */}
            <circle cx="50" cy="50" r="6" fill="white" filter="url(#glow)" />
        </svg>
    );
};

export default Logo;
