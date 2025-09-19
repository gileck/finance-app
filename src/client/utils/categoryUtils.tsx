import React from 'react';
import { Theme } from '@mui/material/styles';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import HomeIcon from '@mui/icons-material/Home';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import LocalAirportIcon from '@mui/icons-material/LocalAirport';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { BikeScooter, Computer, EnergySavingsLeaf, Face, Paid } from '@mui/icons-material';
import { SvgIconProps } from '@mui/material';

// Define a type for our icon components
type IconComponent = React.ComponentType<SvgIconProps>;

type CategoryIconMap = {
  [key: string]: IconComponent;
};

const categoryToIcon: CategoryIconMap = {
  'groceries': ShoppingCartIcon,
  'restaurants': RestaurantIcon,
  'shopping': ShoppingBagIcon,
  'online shopping': ShoppingBagIcon,
  'home': HomeIcon,
  'transportation': DirectionsCarIcon,
  'car': DirectionsCarIcon,
  'health': LocalHospitalIcon,
  'atm': LocalAtmIcon,
  'travel': LocalAirportIcon,
  'gifts': CardGiftcardIcon,
  'iherb': EnergySavingsLeaf,
  'default': MoreHorizIcon,
  'hair': Face,
  'bike': BikeScooter,
  'internet': Computer,
  'bills': LocalAtmIcon,
  'money transfer': Paid,
  'clothing': ShoppingBagIcon
};

/**
 * Returns the appropriate icon component for a given category
 * @param category The category name
 * @returns React component for the category icon
 */
export const getCategoryIcon = (category: string): React.ReactElement => {
  // Add null check to prevent TypeError when category is null or undefined
  if (!category) {
    return <MoreHorizIcon fontSize="small" />;
  }

  const lowerCaseCategory = category.toLowerCase();
  const Icon = categoryToIcon[lowerCaseCategory] || categoryToIcon['default'];
  return <Icon fontSize="small" />;
};

/**
 * Returns the appropriate color for a given category
 * @param category The category name
 * @param _theme Material-UI theme object (unused but kept for backward compatibility)
 * @returns Color string
 */
export const getCategoryColor = (category: string, _theme?: Theme): string => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _theme: _unused } = { _theme }; // Properly handle unused parameter

  // Rich color palette with a variety of distinct colors
  const colorMap: Record<string, string> = {
    'groceries': '#2E7D32', // Dark green
    'restaurants': '#FF6D00', // Orange
    'food': '#E65100', // Dark orange
    'shopping': '#6A1B9A', // Purple
    'online shopping': '#4A148C', // Dark purple
    'home': '#0277BD', // Blue
    'transportation': '#00695C', // Teal
    'car': '#D32F2F', // Red
    'health': '#C2185B', // Pink
    'atm': '#1565C0', // Blue
    'travel': '#283593', // Indigo
    'gifts': '#8E24AA', // Light purple
    'iherb': '#558B2F', // Light green
    'hair': '#D81B60', // Pink
    'bike': '#00838F', // Cyan
    'internet': '#1E88E5', // Light blue
    'bills': '#F9A825', // Amber
    'money transfer': '#5D4037', // Brown
    'entertainment': '#7B1FA2', // Purple
    'education': '#0097A7', // Cyan
    'fitness': '#43A047', // Green
    'clothing': '#AD1457', // Dark pink
    'electronics': '#3949AB', // Indigo
    'subscriptions': '#F4511E', // Deep orange
    'charity': '#689F38', // Light green
    'pets': '#6D4C41', // Brown
    'insurance': '#757575', // Grey
    'taxes': '#546E7A', // Blue grey
    'investments': '#00ACC1', // Cyan
    'utilities': '#FB8C00', // Orange
    'rent': '#C0CA33', // Lime
    'mortgage': '#AFB42B', // Lime
    'childcare': '#26A69A', // Teal
    'furniture': '#8D6E63', // Brown
  };

  // Add null check to prevent TypeError when category is null or undefined
  if (!category) {
    return '#9E9E9E'; // Default grey color
  }

  return colorMap[category.toLowerCase()] || '#9E9E9E'; // Default grey color
};

/**
 * Helper to format currency values
 * @param amount The amount to format
 * @param currency The currency code (e.g., 'NIS', 'USD')
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string): string => {
  // Always format and present in NIS regardless of input currency
  const rounded = Math.round(Number(amount) || 0);
  if ((currency || '').toUpperCase() === 'NIS' || (currency || '') === '₪' || (currency || '').toUpperCase() === 'ILS') {
    return `₪${rounded.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`;
  }
  return `${rounded.toLocaleString('he-IL', { maximumFractionDigits: 0 })} ${currency || 'NIS'}`;
};
