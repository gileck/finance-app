// Yearly Expenses storage utility for managing user preferences

export type PeriodMode = 'year' | 'last12';
export type ViewMode = 'total' | 'average';

export interface YearlyExpensesPreferences {
    year: number;
    period: PeriodMode;
    view: ViewMode;
    showRemaining: boolean;
}

const STORAGE_KEY = 'yearlyExpenses_preferences';

export const getYearlyExpensesPreferences = (currentYear: number): YearlyExpensesPreferences => {
    if (typeof window === 'undefined') {
        return {
            year: currentYear,
            period: 'year',
            view: 'total',
            showRemaining: true
        };
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return {
                year: currentYear,
                period: 'year',
                view: 'total',
                showRemaining: true
            };
        }
        const parsed = JSON.parse(stored);
        // Ensure year is valid (not in the future, not too old)
        if (parsed.year > currentYear) {
            parsed.year = currentYear;
        }
        return parsed;
    } catch (error) {
        console.error('Failed to load yearly expenses preferences:', error);
        return {
            year: currentYear,
            period: 'year',
            view: 'total',
            showRemaining: true
        };
    }
};

export const saveYearlyExpensesPreferences = (preferences: YearlyExpensesPreferences): void => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
        console.error('Failed to save yearly expenses preferences:', error);
    }
};

