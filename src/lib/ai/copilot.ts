import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

const HOTEL_SYSTEM = `You are an AI operations copilot for a hotel management system.
You receive structured hotel data and return concise, actionable Thai-language insights.
Always respond in JSON format as specified in each prompt. Be brief and practical.`;

export async function askCopilot(userPrompt: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: HOTEL_SYSTEM,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}
