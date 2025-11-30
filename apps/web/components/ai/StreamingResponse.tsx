'use client';

import { useState, useEffect } from 'react';

interface StreamingResponseProps {
    content: string;
    isStreaming?: boolean;
    speed?: number;
}

export function StreamingResponse({ content, isStreaming = false, speed = 10 }: StreamingResponseProps) {
    const [displayedContent, setDisplayedContent] = useState('');

    useEffect(() => {
        if (!isStreaming) {
            setDisplayedContent(content);
            return;
        }

        let i = 0;
        const interval = setInterval(() => {
            if (i < content.length) {
                setDisplayedContent((prev) => prev + content.charAt(i));
                i++;
            } else {
                clearInterval(interval);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [content, isStreaming, speed]);

    return (
        <div className="whitespace-pre-wrap leading-relaxed animate-in fade-in duration-300">
            {displayedContent}
            {isStreaming && displayedContent.length < content.length && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
            )}
        </div>
    );
}
