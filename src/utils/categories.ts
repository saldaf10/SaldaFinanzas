import { CategoryDef, CustomCategory } from '../types';

export const CATEGORIES: CategoryDef[] = [
  { id: 'food', name: 'Comida', icon: '🍔', color: '#FF6B6B', type: 'expense' },
  { id: 'food_delivery', name: 'Domicilios', icon: '🛵', color: '#FF8E53', type: 'expense' },
  { id: 'transport', name: 'Transporte', icon: '🚗', color: '#4ECDC4', type: 'expense' },
  { id: 'fuel', name: 'Gasolina', icon: '⛽', color: '#FBBF24', type: 'expense' },
  { id: 'shopping', name: 'Compras', icon: '🛍️', color: '#A78BFA', type: 'expense' },
  { id: 'home', name: 'Hogar', icon: '🏠', color: '#FBB040', type: 'expense' },
  { id: 'health', name: 'Salud', icon: '💊', color: '#34D399', type: 'expense' },
  { id: 'entertainment', name: 'Entretenimiento', icon: '🎬', color: '#F472B6', type: 'expense' },
  { id: 'education', name: 'Educación', icon: '📚', color: '#60A5FA', type: 'expense' },
  { id: 'subscriptions', name: 'Suscripciones', icon: '📱', color: '#818CF8', type: 'expense' },
  { id: 'beauty', name: 'Belleza', icon: '💅', color: '#FB7185', type: 'expense' },
  { id: 'gym', name: 'Deporte', icon: '🏋️', color: '#2DD4BF', type: 'expense' },
  { id: 'travel', name: 'Viajes', icon: '✈️', color: '#38BDF8', type: 'expense' },
  { id: 'debts', name: 'Deudas', icon: '💳', color: '#F87171', type: 'expense' },
  { id: 'gifts', name: 'Regalos', icon: '🎁', color: '#E879F9', type: 'expense' },
  { id: 'other_expense', name: 'Otros', icon: '📦', color: '#9CA3AF', type: 'expense' },
  { id: 'salary', name: 'Nómina', icon: '💰', color: '#4ADE80', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: '💻', color: '#34D399', type: 'income' },
  { id: 'investment', name: 'Inversiones', icon: '📈', color: '#A3E635', type: 'income' },
  { id: 'business', name: 'Negocio', icon: '🏢', color: '#22D3EE', type: 'income' },
  { id: 'gift_income', name: 'Regalo', icon: '🎀', color: '#F0ABFC', type: 'income' },
  { id: 'refund', name: 'Reembolso', icon: '↩️', color: '#86EFAC', type: 'income' },
  { id: 'other_income', name: 'Otros ingresos', icon: '💵', color: '#6EE7B7', type: 'income' },
];

export const getCategoryById = (id: string) => CATEGORIES.find((c) => c.id === id);
export const getExpenseCategories = () => CATEGORIES.filter((c) => c.type === 'expense');
export const getIncomeCategories = () => CATEGORIES.filter((c) => c.type === 'income');

export function resolveCategory(id: string, custom: CustomCategory[]): { name: string; icon: string; color: string } {
  const predefined = getCategoryById(id);
  if (predefined) return { name: predefined.name, icon: predefined.icon, color: predefined.color };
  const c = custom.find((x) => x.id === id);
  if (c) return { name: c.name, icon: c.emoji, color: c.color };
  return { name: id, icon: '📦', color: '#808080' };
}

const KEYWORDS: Record<string, string[]> = {
  food_delivery: ['rappi', 'domicilio', 'ifood', 'ubereats', 'uber eats', 'didi food'],
  food: ['restaurante', 'almuerzo', 'cena', 'desayuno', 'mcdonald', 'burger', 'pizza',
    'subway', 'kfc', 'pollo', 'sushi', 'comida', 'panadería', 'cafetería', 'café'],
  transport: ['uber', 'taxi', 'indriver', 'cabify', 'bus', 'transmilenio', 'parqueadero', 'sitp'],
  fuel: ['terpel', 'biomax', 'texaco', 'esso', 'gasolina', 'bp', 'primax'],
  shopping: ['h&m', 'zara', 'éxito', 'exito', 'carulla', 'jumbo', 'falabella', 'alkosto',
    'mercado', 'supermercado', 'ropa', 'd1', 'ara'],
  subscriptions: ['netflix', 'spotify', 'apple', 'amazon', 'disney', 'hbo', 'youtube', 'icloud'],
  health: ['farmacia', 'droguería', 'clínica', 'hospital', 'médico', 'medicina', 'medicamento'],
  gym: ['gym', 'gimnasio', 'bodytech', 'smartfit', 'yoga', 'crossfit'],
  education: ['universidad', 'colegio', 'curso', 'udemy', 'coursera', 'platzi', 'inglés'],
  entertainment: ['cine', 'teatro', 'concierto', 'bar', 'discoteca', 'fiesta', 'bowling'],
  home: ['arriendo', 'renta', 'agua', 'luz', 'gas', 'internet', 'administración'],
  beauty: ['peluquería', 'barbería', 'spa', 'manicure', 'facial', 'depilación'],
  travel: ['hotel', 'airbnb', 'vuelo', 'avianca', 'latam', 'wingo', 'booking'],
  debts: ['cuota', 'crédito', 'deuda', 'préstamo', 'banco'],
  salary: ['nómina', 'nomina', 'salario', 'sueldo', 'quincena'],
  freelance: ['freelance', 'honorarios', 'consultoría', 'factura'],
  investment: ['dividendos', 'rendimiento', 'intereses', 'inversión'],
  refund: ['reembolso', 'devolución', 'reintegro'],
};

export function detectCategory(text: string, type: 'income' | 'expense'): string {
  const lower = text.toLowerCase();
  for (const [catId, kws] of Object.entries(KEYWORDS)) {
    if (kws.some((kw) => lower.includes(kw))) {
      const cat = getCategoryById(catId);
      if (cat && (cat.type === type || cat.type === 'both')) return catId;
    }
  }
  return type === 'income' ? 'other_income' : 'other_expense';
}
