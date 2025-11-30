import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
});

export async function POST(req: Request) {
    try {
        const { text, redaction_type = 'all' } = await req.json();

        if (!text) {
            return NextResponse.json(
                { error: 'Text is required' },
                { status: 400 }
            );
        }

        // Mock response if no API key
        if (!process.env.OPENAI_API_KEY) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            return NextResponse.json({
                redacted_text: text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED-SSN]').replace(/\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/g, '[REDACTED-EMAIL]'),
                redaction_count: 2,
            });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are a security expert. Redact sensitive information from the text.
                    Redaction Type: ${redaction_type}
                    Replace sensitive data with [REDACTED-TYPE].
                    Return only the redacted text.`
                },
                {
                    role: "user",
                    content: text
                }
            ],
        });

        const redactedText = response.choices[0]?.message?.content;

        if (!redactedText) {
            throw new Error('No redacted text received from OpenAI');
        }

        return NextResponse.json({
            redacted_text: redactedText,
        });

    } catch (error: any) {
        console.error('AI Redact Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to redact text' },
            { status: 500 }
        );
    }
}
