import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
});

export async function POST(req: Request) {
    try {
        const { text, focus = 'general' } = await req.json();

        if (!text) {
            return NextResponse.json(
                { error: 'Code or text is required' },
                { status: 400 }
            );
        }

        // Mock response if no API key
        if (!process.env.OPENAI_API_KEY) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            return NextResponse.json({
                review: `[MOCK REVIEW]\nFocus: ${focus}\n\n1. Issue found in line 10.\n2. Suggestion: Optimize loop.\n3. Security: Input validation missing.`,
                score: 85,
            });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are an expert code and content reviewer. Review the provided input.
                    Focus: ${focus}
                    Provide a detailed review with numbered points, highlighting issues, suggestions, and a quality score (0-100).`
                },
                {
                    role: "user",
                    content: text
                }
            ],
        });

        const review = response.choices[0]?.message?.content;

        if (!review) {
            throw new Error('No review received from OpenAI');
        }

        return NextResponse.json({
            review,
            score: 90, // Placeholder, ideally parsed from response
        });

    } catch (error: any) {
        console.error('AI Review Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to review content' },
            { status: 500 }
        );
    }
}
