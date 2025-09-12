// Centralized currency conversion utilities

export const CURRENCY_TO_NIS_RATE: Record<string, number> = {
    // Base
    NIS: 1,
    ILS: 1,
    '₪': 1,
    // Common foreign currencies (static rates; update as needed)
    // Rates represent how many NIS for 1 unit of the currency
    USD: 3.32,
    EUR: 3.6,
    GBP: 4.2,
    IDR: 0.00020
};

/**
 * Normalize various currency inputs (symbols, case, spacing) to ISO-like codes.
 */
function normalizeCurrencyCode(currency: string): string {
    const raw = (currency || '').trim();
    if (!raw) return 'NIS';
    const upper = raw.toUpperCase();
    const symbolMap: Record<string, string> = {
        '₪': 'NIS',
        '$': 'USD',
        '€': 'EUR',
        '£': 'GBP',
        '¥': 'JPY',
        'RP': 'IDR',
        'RUPIAH': 'IDR'
    };
    if (symbolMap[upper]) return symbolMap[upper];
    // Special case common lowercase symbol
    if (raw === 'Rp' || raw === 'rp') return 'IDR';
    return upper;
}

/**
 * Convert an amount from a given currency to NIS using static rates.
 */
export function convertToNis(amount: number, currency: string): number {
    if (!currency) return amount;
    const code = normalizeCurrencyCode(currency);
    const rate = CURRENCY_TO_NIS_RATE[code] ?? 1;
    return amount * rate;
}

/**
 * Convert an amount between any two currencies using NIS as the base.
 */
export function convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
    const fromCode = normalizeCurrencyCode(fromCurrency);
    const toCode = normalizeCurrencyCode(toCurrency);
    if (!fromCode || !toCode || fromCode === toCode) {
        return amount;
    }
    const fromRate = CURRENCY_TO_NIS_RATE[fromCode] ?? 1;
    const toRate = CURRENCY_TO_NIS_RATE[toCode] ?? 1;
    const amountInNis = amount * fromRate;
    return amountInNis / toRate;
}

/**
 * Format a numeric amount that is already in NIS with the ₪ symbol.
 */
export function formatNis(amountInNis: number): string {
    const rounded = Math.round(amountInNis);
    return `₪${rounded.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`;
}

/**
 * Allow runtime updates of conversion rates (e.g., from a settings screen or scheduled job).
 */
export function setCurrencyRates(updatedRates: Partial<Record<string, number>>): void {
    Object.assign(CURRENCY_TO_NIS_RATE, updatedRates);
}


