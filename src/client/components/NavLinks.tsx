import { NavItem } from './layout/types';
import HomeIcon from '@mui/icons-material/Home';
import ChatIcon from '@mui/icons-material/Chat';
import FolderIcon from '@mui/icons-material/Folder';
import SettingsIcon from '@mui/icons-material/Settings';
import InsightsIcon from '@mui/icons-material/Insights';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

export const navItems: NavItem[] = [ 
  { path: '/', label: 'Home', icon: <HomeIcon /> },
  { path: '/card-items', label: 'Card', icon: <CreditCardIcon /> },
  { path: '/card-items-by-month', label: 'Card Totals', icon: <CalendarMonthIcon /> },
  { path: '/bank-items', label: 'Bank', icon: <AccountBalanceIcon /> },
];
  
  export const menuItems: NavItem[] = [ 
    { path: '/', label: 'Home', icon: <HomeIcon /> },
    { path: '/ai-chat', label: 'AI Chat', icon: <ChatIcon /> },
    { path: '/file-manager', label: 'Files', icon: <FolderIcon /> },
    { path: '/card-items', label: 'Card Items', icon: <CreditCardIcon /> },
    { path: '/card-items-by-month', label: 'Monthly Totals', icon: <CalendarMonthIcon /> },
    { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
    { path: '/ai-monitoring', label: 'AI Monitoring', icon: <InsightsIcon /> },
  ];