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
import { BikeScooter, Computer, EnergySavingsLeaf, Face } from '@mui/icons-material';
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
  'internet': Computer
};

/**
 * Returns the appropriate icon component for a given category
 * @param category The category name
 * @returns React component for the category icon
 */
export const getCategoryIcon = (category: string): React.ReactElement => {
  const lowerCaseCategory = category.toLowerCase();
  const Icon = categoryToIcon[lowerCaseCategory] || categoryToIcon['default'];
  return <Icon fontSize="small" />;
};

/**
 * Returns the appropriate color for a given category based on the theme
 * @param category The category name
 * @param theme Material-UI theme object
 * @returns Color string from the theme
 */
export const getCategoryColor = (category: string, theme: Theme): string => {
  const colorMap: Record<string, string> = {
    'groceries': theme.palette.success.main,
    'restaurants': theme.palette.warning.main,
    'food': theme.palette.warning.main,
    'shopping': theme.palette.secondary.main,
    'online shopping': theme.palette.secondary.main,
    'home': theme.palette.info.main,
    'transportation': theme.palette.secondary.main,
    'car': theme.palette.error.main,
    'health': theme.palette.primary.light,
    'atm': theme.palette.primary.main,
    'travel': theme.palette.info.dark,
    'gifts': theme.palette.secondary.light,
    'iherb': theme.palette.success.light,
    'hair': theme.palette.primary.main,
    'bike': theme.palette.primary.main,
    'internet': theme.palette.primary.main
  };
  
  return colorMap[category.toLowerCase()] || theme.palette.grey[500];
};

/**
 * Helper to format currency values
 * @param amount The amount to format
 * @param currency The currency code (e.g., 'NIS', 'USD')
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string): string => {
  // For NIS currency, use the ₪ symbol
  if (currency === 'NIS') {
    return `₪${Math.round(amount)}`;
  }
  
  // For other currencies, use the Intl formatter
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};
