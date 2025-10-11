// Investment storage utility for managing investment budget settings

export type InvestmentType = 'amount' | 'percentage';

export interface InvestmentSettings {
    monthlyAmount: number;
    percentage: number;
    type: InvestmentType;
    enabled: boolean;
}

const STORAGE_KEY = 'yearlyExpenses_investmentSettings';

export const getInvestmentSettings = (): InvestmentSettings => {
    if (typeof window === 'undefined') {
        return { monthlyAmount: 0, percentage: 0, type: 'amount', enabled: false };
    }

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return { monthlyAmount: 0, percentage: 0, type: 'amount', enabled: false };
        }
        const parsed = JSON.parse(stored);
        // Migrate old settings that don't have type/percentage
        if (!parsed.type) {
            parsed.type = 'amount';
            parsed.percentage = 0;
        }
        return parsed;
    } catch (error) {
        console.error('Failed to load investment settings:', error);
        return { monthlyAmount: 0, percentage: 0, type: 'amount', enabled: false };
    }
};

export const saveInvestmentSettings = (settings: InvestmentSettings): void => {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save investment settings:', error);
    }
};

