
// Logic extracted from ReportsScreen.js for testing
// Note: incomeCategories is now passed as an argument to decouple from constants/categories.js for easier unit testing
export const calculateTotals = (transactions, incomeCategories = []) => {
    const totalIncome = transactions
        .filter(t => incomeCategories.includes(t.category))
        .reduce((acc, t) => acc + Number(t.amount), 0);

    const totalExpense = transactions
        .filter(t => !incomeCategories.includes(t.category))
        .reduce((acc, t) => acc + Number(t.amount), 0);

    return {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense
    };
};

export const getWeeklyData = (transactions, incomeCategories = []) => {
    const days = ['Di', 'Hë', 'Ma', 'Më', 'En', 'Pr', 'Sh'];
    const expenses = transactions.filter(t => !incomeCategories.includes(t.category));
    
    const grouped = new Array(7).fill(0);
    
    expenses.forEach(t => {
        const d = new Date(t.date);
        const dayIndex = d.getDay(); 
        grouped[dayIndex] += Number(t.amount);
    });

    return days.map((label, i) => ({
        label,
        value: Number(grouped[i].toFixed(2)) // Ensure 2 decimal places logic is tested
    }));
};

export const formatCurrency = (amount) => {
    return Number(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

export const evaluateExpression = (expression) => {
    try {
        // Remove any non-math characters for safety
        const sanitized = expression.replace(/[^0-9+\-*/.()]/g, '');
        if (!sanitized) return '';
        // eslint-disable-next-line no-new-func
        return String(new Function('return ' + sanitized)());
    } catch (e) {
        return expression;
    }
};
