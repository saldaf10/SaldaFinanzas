import { ParsedTransaction, TransactionType } from '../types';
import { detectCategory } from './categories';

function parseAmount(text: string): number | null {
  const millonesMatch = text.match(/(\d+(?:[.,]\d+)?)\s*millones?/i);
  if (millonesMatch) return parseFloat(millonesMatch[1].replace(',', '.')) * 1_000_000;

  const kMatch = text.match(/(\d+(?:[.,]\d+)?)\s*k\b/i);
  if (kMatch) return parseFloat(kMatch[1].replace(',', '.')) * 1_000;

  const periodSep = text.match(/\b(\d{1,3}(?:\.\d{3})+)\b/);
  if (periodSep) return parseInt(periodSep[1].replace(/\./g, ''));

  const large = text.match(/\b(\d{5,})\b/);
  if (large) return parseInt(large[1]);

  const small = text.match(/\b(\d{2,4})\b/);
  if (small) {
    const n = parseInt(small[1]);
    return n >= 10 ? n * 1_000 : n;
  }
  return null;
}

function detectType(text: string): TransactionType {
  const lower = text.toLowerCase();
  const incomeWords = ['recibí', 'recibi', 'gané', 'gane', 'ingresé', 'cobré', 'llegó', 'nómina', 'salario', 'ingreso'];
  if (incomeWords.some((w) => lower.includes(w))) return 'income';
  return 'expense';
}

function extractDescription(text: string): string {
  let clean = text
    .replace(/\d+(?:[.,]\d+)?\s*millones?/gi, '')
    .replace(/\d+(?:[.,]\d+)?\s*k\b/gi, '')
    .replace(/\b\d{1,3}(?:\.\d{3})+\b/g, '')
    .replace(/\b\d{5,}\b/g, '')
    .replace(/\b(gasté|gaste|pagué|pague|compré|compre|recibí|recibi|gané|gane|cobré)\b/gi, '');

  const prepMatch = clean.match(/\ben\s+(.+)/i) || clean.match(/\bde\s+(.+)/i) || clean.match(/\bpor\s+(.+)/i);
  if (prepMatch) clean = prepMatch[1];

  return clean.replace(/\s+/g, ' ').trim();
}

export function parseNaturalLanguage(input: string): ParsedTransaction | null {
  const amount = parseAmount(input);
  if (!amount || amount <= 0) return null;
  const type = detectType(input);
  const description = extractDescription(input) || input;
  const category = detectCategory(input, type);
  return { type, amount, description, category };
}
