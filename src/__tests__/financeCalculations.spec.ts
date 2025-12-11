import { describe, expect, it } from 'vitest';
import { calculateTotals, evaluateExpression, formatCurrency, getWeeklyData } from '../utils/financeCalculations';

describe('Finance Calculations', () => {
  
  describe('evaluateExpression', () => {
    it('should calculate simple addition', () => {
      expect(evaluateExpression('10+5')).toBe('15');
    });

    it('should calculate subtraction', () => {
      expect(evaluateExpression('10-5')).toBe('5');
    });

    it('should calculate multiplication', () => {
      expect(evaluateExpression('10*5')).toBe('50');
    });

    it('should calculate division', () => {
      expect(evaluateExpression('10/2')).toBe('5');
    });

    it('should handle complex expressions with order of operations', () => {
      expect(evaluateExpression('10+5*2')).toBe('20'); // 10 + 10 = 20
      expect(evaluateExpression('(10+5)*2')).toBe('30'); // 15 * 2 = 30
    });

    it('should handle decimals', () => {
      expect(evaluateExpression('10.5+0.5')).toBe('11');
    });

    it('should sanitize invalid characters', () => {
      expect(evaluateExpression('10+abc5')).toBe('15'); // 'abc' removed -> 10+5
    });

    it('should return original expression on error', () => {
      // e.g. incomplete expression
      expect(evaluateExpression('10+')).toBe('10+'); 
    });

    it('should handle division by zero', () => {
      expect(evaluateExpression('10/0')).toBe('Infinity');
    });
  });

  describe('formatCurrency', () => {
    it('should format integer numbers with 2 decimals', () => {
      expect(formatCurrency(1000)).toBe('1,000.00');
    });

    it('should format decimal numbers correctly', () => {
      expect(formatCurrency(10.5)).toBe('10.50');
    });

    it('should handle string inputs', () => {
      expect(formatCurrency('1000')).toBe('1,000.00');
    });
  });

  describe('calculateTotals', () => {
    const mockTransactions = [
      { id: 1, amount: 100, category: 'Rroga', type: 'income' },
      { id: 2, amount: 50, category: 'Ushqim', type: 'expense' },
      { id: 3, amount: 20, category: 'Transport', type: 'expense' },
    ];
    const incomeCategories = ['Rroga'];

    it('should calculate total income correctly', () => {
      const result = calculateTotals(mockTransactions, incomeCategories);
      expect(result.totalIncome).toBe(100);
    });

    it('should calculate total expense correctly', () => {
      const result = calculateTotals(mockTransactions, incomeCategories);
      expect(result.totalExpense).toBe(70); // 50 + 20
    });

    it('should calculate net balance correctly', () => {
      const result = calculateTotals(mockTransactions, incomeCategories);
      expect(result.netBalance).toBe(30); // 100 - 70
    });

    it('should handle empty transactions', () => {
      const result = calculateTotals([], incomeCategories);
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(0);
      expect(result.netBalance).toBe(0);
    });
  });

  describe('getWeeklyData', () => {
    const incomeCategories = ['Rroga'];
    
    it('should group expenses by day of week', () => {
      // Create dates for specific days
      // Sunday: 2023-10-01
      // Monday: 2023-10-02
      const transactions = [
        { date: '2023-10-01T10:00:00Z', amount: 10, category: 'Ushqim' }, // Sunday (Di)
        { date: '2023-10-02T10:00:00Z', amount: 20, category: 'Transport' }, // Monday (Hë)
        { date: '2023-10-02T12:00:00Z', amount: 5, category: 'Kafe' }, // Monday (Hë)
        { date: '2023-10-01T10:00:00Z', amount: 100, category: 'Rroga' }, // Income (Should be ignored)
      ];

      const result = getWeeklyData(transactions, incomeCategories);

      // Sunday (Index 0)
      expect(result[0].label).toBe('Di');
      expect(result[0].value).toBe(10);

      // Monday (Index 1)
      expect(result[1].label).toBe('Hë');
      expect(result[1].value).toBe(25); // 20 + 5

      // Other days should be 0
      expect(result[2].value).toBe(0);
    });

    it('should handle empty transactions', () => {
      const result = getWeeklyData([], incomeCategories);
      expect(result).toHaveLength(7);
      expect(result.every(d => d.value === 0)).toBe(true);
    });
  });

});
