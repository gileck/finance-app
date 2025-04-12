import { Home } from './Home';
import { NotFound } from './NotFound';
import { AIChat } from './AIChat';
import { Settings } from './Settings';
import { FileManager } from './FileManager';
import { AIMonitoring } from './AIMonitoring';
import { CardItems } from './CardItems';
import { CardItemsByMonth } from './CardItemsByMonth';
import { CardItemsByMonthDetail } from './CardItemsByMonthDetail';
import { createRoutes } from '../router';

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
  '/not-found': NotFound,
});
