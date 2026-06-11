import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY, GEMINI_MODEL } from '../constants/config';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

export interface GeneratedListing {
  title: string;
  description: string;
  suggestedPrice: number;
  suggestedCategory: string;
  tags: string[];
}

export async function generateListingFromImage(
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<GeneratedListing> {
  const prompt = `You are helping a student list an item for sale on a campus marketplace at IIT Bhilai.
Analyze this image and generate:
1. A clear, concise title (max 60 chars)
2. A helpful description (2-3 sentences, mention condition if visible)
3. A reasonable price in Indian Rupees for a student marketplace (used items)
4. The best category from: electronics, books, cycles, sports, furniture, clothing, stationery, lab, other
5. 3-5 relevant search tags

Respond ONLY with valid JSON in this exact format:
{
  "title": "...",
  "description": "...",
  "suggestedPrice": 0,
  "suggestedCategory": "...",
  "tags": ["...", "..."]
}`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { data: base64Image, mimeType } },
  ]);

  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse AI response');
  return JSON.parse(jsonMatch[0]) as GeneratedListing;
}

export async function generateListingDescription(
  title: string,
  category: string,
  condition: string
): Promise<string> {
  const prompt = `Write a concise, appealing product description (2-3 sentences) for a student selling:
Title: "${title}"
Category: ${category}
Condition: ${condition}
This is for a campus marketplace at IIT Bhilai. Be specific and helpful. Do not include price.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

export async function getSuggestedPrice(
  title: string,
  condition: string,
  category: string
): Promise<number> {
  const prompt = `Suggest a fair selling price in Indian Rupees for a student selling this item on a college campus:
Item: "${title}"
Condition: ${condition}
Category: ${category}
Consider it's a used item sold by a student. Respond with ONLY a number, no currency symbol, no text.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim().replace(/[^0-9]/g, '');
  return parseInt(text, 10) || 0;
}

export async function askCampusBot(question: string): Promise<string> {
  const prompt = `You are a helpful assistant for Campus Marketplace, a buy-and-sell platform for IIT Bhilai students.
Answer this question concisely and helpfully: "${question}"
If the question is about selling/buying on the platform, give practical advice. Keep your answer under 150 words.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
