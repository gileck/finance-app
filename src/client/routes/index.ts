import { Home } from './Home';
import { NotFound } from './NotFound';
import { AIChat } from './AIChat';
import { Settings } from './Settings';
import { FileManager } from './FileManager';
import { AIMonitoring } from './AIMonitoring';
import { CardItems } from './CardItems';
import { CardItemsByMonth } from './CardItemsByMonth';
import { CardItemsByMonthDetail } from './CardItemsByMonthDetail';
import { CardItemsMonthTable } from './CardItemsMonthTable';
import { YearlyExpenses } from './YearlyExpenses/YearlyExpenses';
import { BankPage } from './bank';
import { createRoutes } from '../router';
import { TripsList, TripDetails } from './Trips';
import { PendingItems } from './PendingItems';
import { Search } from './Search';

// Define routes
export const routes = createRoutes({
  '/': Home,
  '/ai-chat': AIChat,
  '/settings': Settings,
  '/file-manager': FileManager,
  '/ai-monitoring': AIMonitoring,
  '/card-items': CardItems,
  '/card-items-by-month': CardItemsByMonth,
  '/card-items-by-month-detail/:year/:month': CardItemsByMonthDetail,
  '/card-items-month-table': CardItemsMonthTable,
  '/yearly-expenses': YearlyExpenses,
  '/bank-items': BankPage,
  '/trips': TripsList,
  '/trips/:id': TripDetails,
  '/pending-items': PendingItems,
  '/search': Search,
  '/not-found': NotFound,
});
