import { Banknote, Bus, Car, Clock, Coffee, Gift, GraduationCap, Home, Laptop, Shirt, ShoppingBag, Smartphone, Star, Utensils, Zap } from 'lucide-react-native';

export const CATEGORY_ICONS = {
  'Ushqim': { icon: Utensils, color: '#F97316' }, // Orange
  'Transport': { icon: Bus, color: '#3B82F6' }, // Blue
  'Veturë': { icon: Car, color: '#3B82F6' }, // Blue
  'Qira': { icon: Home, color: '#8B5CF6' }, // Purple
  'Argëtim': { icon: Zap, color: '#F59E0B' }, // Amber
  'Paga': { icon: Banknote, color: '#10B981' }, // Emerald
  'Te Ardhura': { icon: Banknote, color: '#10B981' }, // Emerald
  'Dhurata': { icon: Gift, color: '#EC4899' }, // Pink
  'Cash': { icon: Banknote, color: '#65A30D' }, // Lime
  'Shopping': { icon: ShoppingBag, color: '#EF4444' }, // Red
  'Fatura': { icon: Smartphone, color: '#64748B' }, // Slate
  'Kafe': { icon: Coffee, color: '#78350F' }, // Brown
  'Edukim': { icon: GraduationCap, color: '#4F46E5' }, // Indigo
  'Telefon': { icon: Smartphone, color: '#0EA5E9' }, // Sky Blue
  'Rroba': { icon: Shirt, color: '#DB2777' }, // Pink
  'Teknologji': { icon: Laptop, color: '#6366F1' }, // Indigo
  'Bonus': { icon: Star, color: '#EAB308' }, // Yellow
  'Part-time': { icon: Clock, color: '#F59E0B' }, // Amber
  'Tjetër': { icon: ShoppingBag, color: '#9CA3AF' }, // Gray
};

export const DEFAULT_EXPENSE_CATEGORIES = ['Ushqim', 'Transport', 'Qira', 'Argëtim', 'Fatura', 'Shopping', 'Edukim', 'Telefon', 'Rroba', 'Teknologji', 'Cash', 'Tjetër'];
export const DEFAULT_INCOME_CATEGORIES = ['Paga', 'Te Ardhura', 'Bonus', 'Part-time', 'Dhurata', 'Tjetër'];
