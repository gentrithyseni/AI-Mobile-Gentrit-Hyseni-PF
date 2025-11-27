
import { calculateTotals, getWeeklyData } from '../utils/financeCalculations.js';

// Mock Data
const mockTransactions = [
    { id: 1, amount: 100, category: 'Paga', date: '2023-10-23T10:00:00.000Z' }, // Monday
    { id: 2, amount: 50, category: 'Ushqim', date: '2023-10-23T12:00:00.000Z' }, // Monday
    { id: 3, amount: 20, category: 'Part-time', date: '2023-10-24T10:00:00.000Z' }, // Tuesday (Income)
    { id: 4, amount: 10, category: 'Kafe', date: '2023-10-24T11:00:00.000Z' }, // Tuesday
];

// Mock Categories
const MOCK_INCOME_CATEGORIES = ['Paga', 'Part-time', 'Te Ardhura'];

console.log("--- UNIT TEST RUN: Finance Calculations ---");

// Test 1: Calculate Totals
try {
    const totals = calculateTotals(mockTransactions, MOCK_INCOME_CATEGORIES);
    const expectedIncome = 100 + 20; // Paga + Part-time
    const expectedExpense = 50 + 10; // Ushqim + Kafe
    
    if (totals.totalIncome === expectedIncome && totals.totalExpense === expectedExpense) {
        console.log("✅ Test 1 Passed: Totals Calculation Correct");
    } else {
        console.error(`❌ Test 1 Failed: Expected Income ${expectedIncome}, got ${totals.totalIncome}`);
        console.error(`❌ Test 1 Failed: Expected Expense ${expectedExpense}, got ${totals.totalExpense}`);
    }
} catch (e) {
    console.error("❌ Test 1 Error:", e.message);
}

// Test 2: Weekly Data Grouping
try {
    const weekly = getWeeklyData(mockTransactions, MOCK_INCOME_CATEGORIES);
    // Oct 23 2023 was a Monday. Oct 24 was Tuesday.
    // Monday (Hë) index 1 should have 50 (Ushqim).
    // Tuesday (Ma) index 2 should have 10 (Kafe).
    
    const mondayData = weekly.find(d => d.label === 'Hë');
    const tuesdayData = weekly.find(d => d.label === 'Ma');
    
    if (mondayData.value === 50 && tuesdayData.value === 10) {
        console.log("✅ Test 2 Passed: Weekly Grouping Correct");
    } else {
        console.error("❌ Test 2 Failed: Weekly Data mismatch", weekly);
    }
} catch (e) {
    console.error("❌ Test 2 Error:", e.message);
}

console.log("--- END TEST RUN ---");
