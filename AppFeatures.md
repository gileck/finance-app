# Finance App - Features Documentation

## Overview

This is a comprehensive personal finance management application built for tracking credit card and bank transactions, managing trips, analyzing expenses, and integrating AI-powered features. The application provides an intuitive mobile-first iOS-style interface optimized for financial tracking and insights.

---

## Home Dashboard

**Route:** `/`

### Product Purpose
**The Financial Command Center** - Provides an at-a-glance overview of monthly financial health. The primary goal is to answer: "How am I doing this month?" Users can quickly assess spending patterns, identify unusual expenses, track recent transactions, and spot areas needing attention. The dashboard surfaces the most actionable insights without requiring users to dig through detailed lists, making daily financial check-ins effortless.

### Layout & Navigation
- **Month Selector**: Large navigation controls with left/right arrows to browse through months
- **Current month prominently displayed** with year
- Navigation automatically disables at data boundaries (earliest month and current month)

### Dashboard Cards & Widgets

#### Current Month Spending Card
**Product Purpose:** Instant financial health check - Shows whether spending is on track compared to historical average. Helps users quickly answer "Am I overspending this month?" without needing to analyze detailed breakdowns.

- **Total spending** for the selected month displayed prominently
- **Average monthly spending** comparison (calculated from historical data)
- **Visual indicator** showing if spending is above or below average
- **Percentage difference** from average displayed

#### Recent Expenses Widget
**Product Purpose:** Stay aware of latest spending - Surfaces brand-new transactions so users can spot unauthorized charges, remember recent purchases, and maintain awareness of current spending activity.

- Shows transactions from the **last 48 hours**
- Displays up to 5 most recent items
- Each item shows:
  - Category icon with color coding
  - Transaction name
  - Amount in local currency
  - Relative time (e.g., "2 hours ago")
- Click on any item to view full details

#### Top Spendings List
**Product Purpose:** Identify major expenses - Highlights the biggest financial decisions of the month. Helps users understand what drove their spending total and identify opportunities to reduce major costs.

- Displays **top 5 highest individual transactions** for the month
- Each entry shows:
  - Category icon and color
  - Transaction name
  - Date
  - Amount
- Interactive: Click to view full transaction details

#### Top Categories List
**Product Purpose:** Understand spending patterns - Reveals where money is consistently going. Helps users identify their primary expense categories and spot areas where behavioral changes could have the biggest financial impact.

- Shows **top 5 spending categories** for the month
- Each category displays:
  - Category icon and name
  - Total amount spent
  - Number of transactions
  - Percentage of total spending
- Sorted by total amount

#### Recurring Transactions Widget
**Product Purpose:** Track subscriptions and recurring costs - Identifies fixed expenses that repeat monthly. Helps users audit subscriptions, find forgotten services to cancel, and understand their baseline monthly commitments.

- Automatically detects **recurring transactions** (subscriptions, regular payments)
- Groups transactions by name pattern
- Shows:
  - Transaction name
  - Frequency detected
  - Average amount
  - Number of occurrences
- Helps identify subscription services and regular expenses

#### Money Transfers This Month
**Product Purpose:** Monitor person-to-person transactions - Tracks money sent to friends, family, or services via transfer. Quick visibility into who you've paid and provides path to organize these transactions with proper names.

- Lists **money transfer transactions** for the selected month
- Shows up to 6 transfers
- Each transfer displays:
  - Transfer name/recipient
  - Date and time
  - Amount
- Link to dedicated money transfers naming page

#### Pending Items Widget
**Product Purpose:** Catch uncleared transactions - Alerts users to charges that haven't fully processed yet. Helps prevent overdrafts, catch duplicate charges, and maintain accurate financial picture by flagging items needing validation.

- Displays **pending/uncleared transactions**
- Visual warning indicators for pending status
- Shows count of pending items
- Click to view pending items page for validation

#### Category Pie Chart
**Product Purpose:** Visualize spending distribution - Provides at-a-glance understanding of how money is allocated across life areas. Makes spending patterns immediately obvious through visual representation, helping users spot imbalances or surprising allocations.

- **Visual breakdown** of spending by category
- Interactive pie chart with:
  - Color-coded category segments
  - Percentage labels
  - Amount labels
- Legend showing all categories
- Click segments to filter or drill down

---

## Card Items

**Route:** `/card-items`

### Product Purpose
**The Transaction Master List** - Serves as the comprehensive, searchable archive of all credit card transactions. The primary goal is to enable users to find any transaction quickly and manage it efficiently. Whether reconciling statements, tracking down a specific purchase, or bulk-reviewing expenses, this page provides the tools for power users who need granular control over their transaction data with advanced filtering and editing capabilities.

### Core Features

#### Infinite Scrolling Transaction List
- **Automatic progressive loading** as you scroll
- Initially loads 2 months of data
- Loads additional months automatically when scrolling near bottom
- Grouped by month with clear visual separators
- Loading indicators for ongoing data fetch

#### Transaction Display
- Each transaction shows:
  - **Date and weekday** (e.g., "Mon, Jan 15")
  - **Transaction name** (DisplayName or original Name)
  - **Category** with color-coded icon
  - **Amount** in original currency (₪, $, €, etc.)
  - **Trip assignment** if applicable (displayed under date)
  - **Comments** (if available)
  - **Pending status** indicator

#### Advanced Filtering System
- **Filter Button** opens comprehensive filter dialog
- **Active Filters Display** as removable chips
- **Clear All Filters** button when filters are active

##### Filter Options:
1. **Categories**: Multi-select category filter
2. **Date Range**: Start and end date pickers
3. **Amount Range**: Minimum and maximum amount inputs
4. **Search Term**: Text search across transaction names and comments
5. **Sort Options**:
   - Sort by: Date, Amount, Category, Name
   - Sort direction: Ascending or Descending
6. **Pending Transactions**: Filter to show only pending items
7. **Version Filters**: 
   - Has version / No version
   - Specific version number

#### Filtering UX
- Filter chips appear below filter button showing active filters
- Each chip can be removed individually
- **Filtering loading state** with progress indicator
- Results update automatically as filters change
- "No items found" message when filters return no results

#### Transaction Actions
- **Click any transaction** to open details dialog
- **Edit button** (pencil icon) - Opens edit dialog
- **Delete button** (trash icon) - Opens confirmation dialog
- **Category quick change** - Change category without full edit

#### Edit Transaction Dialog
- Edit all transaction fields:
  - Display Name
  - Category (with categorization picker)
  - Amount
  - Currency
  - Date
  - Comments (array of text entries)
  - Trip assignment
- **Validation** of required fields
- **Success/error notifications** via snackbar

#### Delete Transaction
- **Confirmation dialog** before deletion
- Shows warning that action cannot be undone
- Loading state during deletion
- Automatic list update after deletion

---

## Monthly Totals

**Route:** `/card-items-by-month`

### Product Purpose
**Spending Trends & Comparison** - Helps users understand their spending patterns over time. The primary goal is to answer: "How does my spending compare month-to-month?" By showing statistical averages and trends, users can identify whether they're improving their spending habits, spot seasonal patterns, and make data-driven decisions about budgeting. This view turns raw monthly totals into meaningful context.

### Features

#### Statistics Summary Card
- **Last 12 Months Statistics** displayed prominently:
  - **Average Monthly Spend**: Calculated from last 12 months
  - **Median Monthly Spend**: Statistical median of monthly totals
- Visual separation with dividers
- Formatted currency display

#### Category Filter
- **Dropdown selector** to filter by category
- Shows "All Categories" by default
- **Reset Filter** button to clear selection
- Updates statistics and list dynamically

#### Monthly Totals List
- **Chronological list** of all available months (newest first)
- Each month card shows:
  - **Month name and year** (e.g., "January 2024")
  - **Total spending amount**
  - **Comparison to average** (percentage and visual indicator)
  - **Bar chart visualization** comparing to average
  - Arrow indicators (↑ above average, ↓ below average)
- **Color coding**: Green for below average, red for above average

#### Navigation
- **Click any month** to navigate to detailed month view
- Preserves category filter in navigation

---

## Month Detail View

**Route:** `/card-items-by-month-detail/:year/:month`

### Product Purpose
**Deep Dive into Monthly Spending** - Provides detailed breakdown of a specific month's expenses. The primary goal is to answer: "Where exactly did my money go this month?" Users can analyze spending by category, review every transaction in that period, and understand the composition of their monthly total. Perfect for monthly reviews, budget analysis, or identifying opportunities to cut costs in specific categories.

### Layout

#### Header
- **Back button** to return to monthly totals list
- **Month and year** prominently displayed (e.g., "January 2024")

#### Tab Navigation
- **Two view modes** with tab switching:
  1. **By Category Tab** - Category-based breakdown
  2. **All Transactions Tab** - Complete transaction list

### By Category View

#### Category Cards
- **Expandable/collapsible sections** for each category
- Each category card displays:
  - **Category icon** and color
  - **Category name**
  - **Total amount** spent in category
  - **Percentage** of monthly spending
  - **Transaction count**

#### Category Transactions
- Expand category to see all transactions
- Same transaction display as main card items list
- All transaction actions available (view, edit, delete)

### All Transactions View
- **Complete list** of all month's transactions
- Same features as main card items page:
  - Full transaction details
  - Edit and delete capabilities
  - Click for details dialog
- Optimized layout for monthly context

---

## Card Items Month Table

**Route:** `/card-items-month-table`

### Product Purpose
**Quick Monthly Transaction Browser** - Offers a fast, table-based view for scanning through a month's transactions. The primary goal is speed and efficiency - users who want to quickly browse, sort, and find transactions in a specific month without the overhead of infinite scroll or complex filters. Ideal for reconciliation tasks, quick lookups, or when users know exactly which month they need to review.

### Features

#### Month Navigation
- **Previous/Next month buttons** with large touch targets
- **Current month and year** displayed prominently
- **Calendar picker icon** - Opens month/year selection dialog
- URL-synced navigation (month/year in query params)

#### Month Picker Dialog
- **Quick month selector** with dropdown
- **Year selector** with dropdown
- Shows current selection
- Easy switching between any month/year combination

#### Search & Filter Toolbar
- **Sticky toolbar** on mobile (stays at top during scroll)
- **Search by name** input field
- **Filter button** toggles filter panel
- **Collapsible filters panel** with:
  - Category dropdown (single selection)
  - Min/Max amount inputs
  - Reset filters button
  - Done button to collapse panel

#### Transactions Table
- **Compact table layout** optimized for monthly view
- **Fixed column widths** for consistent layout:
  - Date column (compact format)
  - Name column (flexible, with ellipsis)
  - Amount column (right-aligned)
- **Sortable columns**:
  - Date (default: descending)
  - Name (alphabetical)
  - Amount (numerical)
- **Alternating row colors** for readability
- **Responsive design**: Adjusts column widths on mobile

#### Table Row Display
- **Date**: Short format (e.g., "Jan 15")
- **Name**: Transaction name with category below
  - Category shown as caption text
  - Text truncation with ellipsis for long names
- **Amount**: Currency formatted, centered

#### Row Interactions
- **Click any row** to open item details dialog
- **Hover effect** for better touch feedback

#### Item Details Dialog
- Full transaction information display
- **Edit button** to modify transaction
- All transaction fields visible

#### Edit Dialog
- **Inline editing** from details dialog
- Same comprehensive edit form as other views
- Updates table immediately after save

---

## Bank Transactions

**Route:** `/bank-items`

### Product Purpose
**Income & Cash Flow Tracking** - Monitors bank account transactions including income, expenses, and transfers. The primary goal is to track the big picture of money flow - what comes in (salary, income) and what goes out (bills, withdrawals). This complements credit card tracking by providing visibility into direct debit payments, cash transactions, and income sources, giving users a complete financial picture beyond just credit card spending.

### Features

#### Monthly Averages Card
- **Summary statistics** displayed at top:
  - Average monthly income
  - Average monthly expenses
  - Net average (income - expenses)
- **Visual indicators** with color coding
- Calculated from all available bank data

#### Monthly Bank Items List
- **Grouped by month** with expandable sections
- Each month section shows:
  - **Month name and year**
  - **Total income** for the month (positive transactions)
  - **Total expenses** for the month (negative transactions)
  - **Net amount** (income - expenses)
  - **Transaction count**

#### Month Expansion
- **Click month header** to expand/collapse
- Shows all bank transactions for that month when expanded
- Each transaction displays:
  - Date
  - Description
  - Amount (colored: green for income, red for expenses)
  - Category (if assigned)

#### Bank Transaction Details
- **Click any transaction** to view details dialog
- Shows:
  - Full description
  - Transaction date and time
  - Amount and type (income/expense)
  - Category
  - Any additional metadata

#### Transaction Editing
- **Edit button** in details dialog
- Modify:
  - Description
  - Category
  - Date
  - Comments
- **Auto-refresh** monthly totals after edit

#### Categorization
- Assign categories to bank transactions
- Same category system as card items
- Helps with expense tracking and reporting

---

## Trips Management

**Route:** `/trips`

### Product Purpose
**Travel Expense Organization** - Enables users to isolate and track expenses for specific trips or events. The primary goal is to answer: "How much did that vacation/business trip cost?" By grouping transactions by trip, users can see total trip costs, manage travel budgets, handle expense reimbursements, or simply understand travel spending patterns. Perfect for frequent travelers, business expense tracking, or vacation budget planning.

### Trip List View

#### Grid Layout
- **Card-based grid** display (responsive)
- Minimum card width: 280px
- Auto-fills available space
- Modern iOS-style card design with rounded corners

#### Trip Cards
Each trip card displays:
- **Trip name** (prominent heading)
- **Total spending** (large, bold, in NIS)
- **Location** (if specified)
- **Date range** (start → end date)
- **Action buttons**:
  - **View** button (green) - Navigate to trip details
  - **Edit** button (outlined) - Modify trip details
  - **Delete** button (outlined, red text) - Remove trip

#### Header Actions
- **New Trip button** (+ icon) - Create new trip
- Opens trip creation dialog

#### Trip Creation Dialog
- **Trip name** input (required)
- **Location** input (optional)
- **Start date** picker
- **End date** picker
- **Validation**: Ensures end date is after start date
- **Cancel/Create** buttons

#### Trip Editing Dialog
- **Pre-filled** with existing trip data
- Same fields as creation
- **Cancel/Update** buttons

#### Trip Deletion
- **Confirmation prompt** before deletion
- Warning about permanent action
- Note: Unassigns transactions but doesn't delete them

---

## Trip Details

**Route:** `/trips/:id`

### Product Purpose
**Individual Trip Analysis** - Provides detailed breakdown of all expenses for a specific trip. The primary goal is to understand the complete financial picture of one trip - total costs, spending by category, individual transactions, and multi-currency handling. Users can assign transactions, review spending, and export trip data for reimbursement or record-keeping. Essential for post-trip analysis and expense reporting.

### Header Section
- **Trip name** as main heading
- **Location chip** (if specified)
- **Date range** displayed (start → end)
- **Assign Transactions button** (desktop view)

### Totals Summary Card
- **Total in NIS** (prominently displayed)
- **Breakdown by currency** as chips:
  - Original currency amounts
  - Multiple currencies supported

### Transactions Table
- **Sortable columns**:
  - Date (default: descending)
  - Name (alphabetical)
  - Amount (numerical)
- **Compact layout** optimized for trip view

#### Table Features
- **Date column**: Short format (e.g., "Jan 15")
- **Name column**: 
  - Transaction name
  - Comments shown below name (if available)
- **Amount column**: Currency formatted
- **Actions column**:
  - **View icon** - Opens details dialog
  - **Delete icon** - Removes from trip (not permanent deletion)

#### Empty State
- **"No transactions assigned"** message when trip is empty
- Prompts user to assign transactions

### Assign Transactions Dialog
- **Date range pre-filled** based on trip dates
- **List of available transactions** in trip period
- **Multi-select checkboxes** for bulk assignment
- **Search/filter** to find specific transactions
- **Already assigned items** excluded from list
- **Assign button** to add selected transactions

### Remove from Trip
- **Confirmation dialog** when removing transaction
- Clarifies that it only unassigns (doesn't delete original)
- **Cancel/Remove** buttons

### Mobile Bottom Action Bar
- **Sticky bottom bar** on mobile devices
- **Back button** - Return to trips list
- **Assign button** - Quick access to assignment dialog
- iOS-style rounded buttons
- Proper spacing and touch targets (44px minimum)

---

## Pending Items

**Route:** `/pending-items`

### Product Purpose
**Transaction Reconciliation & Validation** - Helps users manage pending (uncleared) transactions and validate them against cleared ones. The primary goal is to answer: "Did my pending charges clear correctly?" This prevents duplicate entries, catches pricing discrepancies, and ensures financial records are accurate. The validation system automatically matches pending items with cleared transactions, making reconciliation effortless and catching potential issues early.

### Features

#### Page Header
- **Warning icon** with "Pending Items" heading
- **Count badge** showing number of pending transactions
- **Validation status indicator**: Shows when validation data is loading

### Pending Items List
- **Most recent 10 pending transactions** displayed
- **Newest first** ordering
- Each item shows:
  - **Category icon** with color coding
  - **Transaction name**
  - **Date** (formatted as "Wednesday, Jan 15")
  - **Category name**
  - **Amount** in original currency
  - **Pending badge** (yellow chip)
  - **Validation icon** (check/error)

#### Validation System
- **Automatic validation** against cleared transactions
- **Validation rules**:
  - Same date (calendar day)
  - Same name (normalized)
  - Same amount (or amount is zero)
  - Same currency
- **Visual indicators**:
  - **Green check icon**: Valid match found
  - **Red error icon**: No match found

#### Validation Actions
- **Click validation icon** to see all transactions on that date
- **Matches dialog** displays:
  - All transactions from the same date
  - Both pending and cleared items
  - Clear labeling with status chips
  - Side-by-side comparison capability

#### Delete Pending Items
- **Delete button** appears for validated items (green check)
- Indicates pending can be safely removed (match exists)
- **Confirmation** not required (safe operation)
- **Instant removal** from pending list

#### Item Details
- **Click any pending item** to view full details
- Details dialog shows all transaction information
- **Edit button** available from details
- Can modify any transaction field

#### Loading States
- **Main loading**: Shows spinner while fetching pending items
- **Validation loading**: Shows "Preparing validation..." with spinner
- **Progress indicator** during data fetch
- Non-blocking - shows data as it becomes available

---

## Search

**Route:** `/search`

### Product Purpose
**Find Any Transaction Fast** - Universal search tool for locating specific transactions across all time periods. The primary goal is to answer: "Where was that purchase I made?" Whether users remember a merchant name, a date range, or just a partial detail, this search helps them find it. Essential for finding old transactions, looking up specific purchases, or gathering transactions for a particular purpose (like tax preparation or warranty claims).

### Search Interface

#### Search Bar
- **Large search input** with search icon
- **Placeholder**: "Type a name or comment"
- **Real-time search** (triggers on form submit)
- **URL synchronization** - Search terms saved in URL

#### Advanced Search Toggle
- **Advanced Search button** with filter icon
- **Collapsible panel** for date filters
- **Color change** when advanced filters active (secondary color)

#### Advanced Filters Panel
- **Start Date picker** with calendar icon
- **End Date picker** with calendar icon
- **Date range selection** for targeted searches
- **Collapse/expand** animation

#### Search Button
- **Primary action button** with search icon
- **Disabled state** when no search criteria entered
- **Loading state**: Shows "Searching..." with spinner
- Requires at least one of: search term, start date, or end date

### Search Results

#### Results Count
- **Number of results** displayed below page title
- Format: "X results" with thousands separator

#### Results Table
- **Sortable columns**:
  - Date (default: descending)
  - Name (alphabetical)
  - Amount (numerical)
- **Compact layout** similar to month table
- **Alternating row colors** for readability

#### Result Row Display
- **Date**: DD/MM/YY format
- **Name**: 
  - Transaction name
  - Comments shown below (if available)
  - **Pending indicator** icon if applicable
- **Amount**: Right-aligned, currency formatted

#### Row Interactions
- **Click row** to view full item details
- **Hover effect** for touch feedback
- **Details dialog** with all transaction information

#### Item Actions from Search
- **View details** - Full transaction information
- **Edit** - Modify transaction from search results
- **Updates in place** - Results refresh after edit

#### Empty States
- **"No results"** message when search returns nothing
- Initial page state: Prompts to start search

#### Pagination Note
- **First page indicator**: "Showing first page of results" when more exist
- Encourages refining search criteria

---

## Yearly Expenses

**Route:** `/yearly-expenses`

### Product Purpose
**Annual Budget Planning & Analysis** - Provides big-picture view of spending across an entire year or rolling 12-month period. The primary goal is to answer: "Am I living within my means?" Users can see total annual spending, compare to income, track investment goals, and understand spending distribution across categories. Perfect for annual budget reviews, financial planning, identifying major expense categories, and making long-term financial decisions.

### Year/Period Selection

#### Period Selector Button
- **Large, prominent button** with gradient background
- **Calendar icon** with month/year display
- Shows either:
  - Specific year (e.g., "2024")
  - "Last 12 Months - Rolling" for rolling period
- **Hover animation** (lifts up) for better feedback
- **Click to open** period selection dialog

#### Period Selection Dialog
- **Last 12 Months option** (rolling 12-month window)
  - Highlighted differently (secondary color)
  - Shows "Rolling 12-month period" description
- **List of years**:
  - Current year and previous 4 years
  - Visual highlight for selected period
  - Year-only display for clarity
- **Smooth selection**: Closes dialog on selection

### View Mode Toggle

#### Segmented Control
- **Two viewing modes**:
  - 💰 **Total**: All expenses for the period
  - 📊 **Per Month**: Average monthly expenses
- **Pill-style design** with rounded corners
- **Active state**: Filled with primary color, white text
- **Inactive state**: Transparent with secondary text
- **Smooth transitions** between modes

### Budget Utilization Bar

#### Visual Budget Display
- **Large progress bar** showing budget usage
- **Three-section breakdown**:
  - **Expenses bar**: Shows actual spending
  - **Investment bar**: Shows planned investments (if enabled)
  - **Remaining bar**: Shows budget remainder
- **Color coding**:
  - Expenses: Primary theme color
  - Investment: Success green
  - Remaining: Light gray
  - Over budget: Error red

#### Budget Metrics
- **Income amount** (left side)
- **Total expenses** including investment
- **Remaining budget** (if positive)
- **Over budget indicator** (if negative)
- **Percentage used** of total budget

#### Investment Settings
- **Settings icon button** to configure investments
- **Opens investment dialog**
- Quick access to modify investment tracking

### Investment Settings Dialog
- **Enable/disable** investment tracking
- **Two modes**:
  1. **Fixed Amount**: Set monthly investment amount
     - Input field for NIS amount
  2. **Percentage**: Set percentage of income
     - Slider or input for percentage
- **Preview calculation** shown
- **Save/Cancel** buttons
- **Persists settings** to local storage

### Categories Breakdown Section

#### View Toggle
- **Two-option pill toggle**:
  - **Expenses**: Shows only spending categories
  - **+ Balance**: Includes remaining budget as slice
- Modern design consistent with view mode toggle

#### Category Pie Chart
- **Interactive pie chart** with:
  - **Color-coded slices** per category
  - **Percentage labels** on slices
  - **Amount labels** showing spending
  - **Category icons** in legend
- **Legend** showing:
  - All categories with colors
  - Category names
  - Amounts and percentages
- **Investment category** shown if enabled
- **Responsive sizing**: Larger on desktop

### Monthly Breakdown Table

#### Table Header
- **"Monthly Breakdown"** heading
- **Divider** for visual separation

#### Table Structure
- **Columns**:
  - Category (with icon)
  - 12 month columns (Jan-Dec)
  - Total column
  - Percentage column
- **Responsive scrolling** for narrow screens

#### Category Rows
- **Category icon** with color
- **Category name**
- **Monthly amounts**:
  - Shows amount if expenses exist
  - Shows "—" for zero months
  - Color dims for zero values
- **Row total**: Bold, shows sum or average based on view mode
- **Percentage**: Of total income/budget

#### Table Styling
- **Alternating row colors** for readability
- **Hover effect** highlights rows
- **Rounded corners** on container
- **Border** for clean appearance

### Loading & Error States
- **Large spinner** centered during data load
- **Error alert** with rounded corners
- **Preserves selected period** during errors

---

## Money Transfers Naming

**Route:** `/money-transfers-naming`

### Product Purpose
**Data Cleanup & Organization Workflow** - Streamlines the process of naming and categorizing money transfer transactions. The primary goal is data hygiene - transforming generic "Money Transfer" entries into meaningful, searchable transactions. By showing only unnamed transfers and providing quick-naming tools, this page helps users maintain clean, organized financial records. Once transfers are named, they become useful in reports, searches, and analysis.

### Features

#### Page Header
- **"Money Transfers Naming"** title
- **Refresh icon button** to reload list
- **Description text**: Explains workflow (click comment to set as name)

#### Transaction List
- Shows **unnamed money transfers** only (no DisplayName)
- **Sorted by date** (newest first)
- **Auto-pagination**: Load more as needed

#### Transaction Cards
Each card displays:
- **Category indicator**: Small colored dot
- **Transaction name** (original Name field)
- **Amount**: Bold, prominent currency format
- **Date and weekday**: "Mon • 15/01/2024 14:30"
- **Comment chips**: If available, shown as clickable chips
- **Add button** (+ icon): Opens naming dialog

#### Quick Naming from Comments
- **Click any comment chip** to set it as display name
- **Instant action**: No confirmation needed
- **Auto-removes** from list once named
- Efficient workflow for common patterns

#### Naming Dialog (+ Button)
- **Display Name input**: Text field for new name
- **Category selector button**: Opens category picker
- **Shows selected category** after selection
- **Save button**: Requires name to be entered
- **Loading state** during save

#### Category Selection Dialog
- **Full category list** displayed
- **Category icons** and colors shown
- **Click to select** any category
- **Returns to naming dialog** after selection

#### Load More
- **Load More button** appears when more items available
- Loads additional unnamed transfers
- **Loading state**: Shows "Loading..."
- **Disabled during load** to prevent double-loading

#### Empty State
- **"No items to rename"** message
- Appears when all transfers are named
- Encourages user completion

#### Item Details Access
- **Click transaction** (not on chips or + button) to view details
- **Details dialog** shows full transaction info
- **Edit button** available for full editing
- **Full edit dialog** for comprehensive changes

#### Auto-Cleanup
- **Items disappear** once DisplayName is set
- List dynamically updates
- Shows only unnamed items
- Encourages workflow completion

---

## Settings

**Route:** `/settings`

### Product Purpose
**Application Configuration & Maintenance** - Central hub for managing app-wide settings and performing maintenance tasks. The primary goal is to give users control over AI model selection and cache management. Users can optimize AI costs by choosing appropriate models, clear cached data for fresh results, and configure system preferences. This ensures the app behaves according to user preferences and performs optimally.

### Features

#### Cache Management Section
- **"Cache Management"** heading
- **Description**: Explains cache clearing purpose
- **Clear Cache button**:
  - Primary action button
  - **Loading state**: Shows spinner and "Clearing..."
  - **Disabled during clearing**
- **Success/error notifications** via snackbar
- Clears all cached AI responses and data

#### AI Model Selection
- **"AI Model"** section heading
- **Description**: Explains model selection purpose
- **Model dropdown**:
  - Lists all available AI models
  - Shows model name and provider
  - Format: "Model Name (Provider)"
  - Examples: "GPT-4 (OpenAI)", "Claude-3 (Anthropic)"
- **Immediate save**: Updates on selection
- **Persists to local storage**

#### Layout
- **Card-based design** with elevation
- **Divider** between sections
- **Consistent padding** and spacing
- **Responsive container** (max-width: md)

#### Notifications
- **Snackbar alerts** for actions:
  - Cache clear success
  - Cache clear errors
  - Position: Bottom center
  - **Auto-hide**: 6 seconds
  - **Manual close**: X button
  - **Color-coded**: Success (green), Error (red)

---

## File Manager

**Route:** `/file-manager`

### Product Purpose
**Data File Management & Access** - Provides file system access for managing application data files, exports, backups, and configuration files. The primary goal is to give power users direct access to underlying data files for backup, export, or manual editing purposes. Users can browse folders, view/edit files, and manage data outside the standard transaction interfaces. Essential for data migration, troubleshooting, or advanced data management.

### Features

#### Toolbar Actions
- **New File button**: Create new file in current directory
- **New Folder button**: Create new subfolder
- **Refresh button**: Reload file list

#### Breadcrumb Navigation
- **Path breadcrumbs** showing current location
- **Clickable segments** for quick navigation up
- **Home icon** for root directory
- **Separator** between segments

#### File/Folder List
- **Grid or list view** of files and folders
- **Folder icons** (distinctive from files)
- **File icons** based on type
- Each item shows:
  - Name
  - Type (file/folder)
  - Size (for files)
  - Modified date

#### File Actions
- **Click folder** to navigate into it
- **Click file** to view contents
- **Edit button** (pencil icon) - Opens file editor
- **Delete button** (trash icon) - Deletes file/folder

#### New File Dialog
- **File name input** with validation
- **File content editor** (multi-line textarea)
- **Syntax highlighting** for supported file types
- **Save/Cancel** buttons

#### New Folder Dialog
- **Folder name input** with validation
- **Path preview** showing where folder will be created
- **Create/Cancel** buttons

#### Edit File Dialog
- **File name** displayed (read-only)
- **Content editor** with full file contents
- **Syntax highlighting** for code files
- **Save/Cancel** buttons
- **Loading state** while fetching file

#### View File Dialog
- **Read-only display** of file contents
- **Two viewing modes** for JSON files:
  - **Raw**: Plain text view
  - **Formatted**: Pretty-printed JSON with syntax highlighting
- **Tab toggle** for JSON files
- **Syntax highlighting** for all file types
- **Close button**

#### Delete Confirmation
- **Warning dialog** before deletion
- **Shows item name** being deleted
- **Different messages** for files vs folders
- **Warning for folders**: Notes that contents will be deleted
- **Cancel/Delete** buttons

#### Error Handling
- **Error alerts** for failed operations
- **Specific error messages** for different failures
- **Network error** handling
- **Permission error** handling

---

## AI Monitoring

**Route:** `/ai-monitoring`

### Product Purpose
**AI Cost Tracking & Optimization** - Monitors and analyzes AI feature usage and associated costs. The primary goal is transparency and cost control - users can see exactly how much AI features cost, which models are most/least expensive, and identify opportunities to optimize AI spending. Essential for budget-conscious users or those wanting to understand the value they're getting from AI features. Enables informed decisions about AI model selection.

### Features

#### Summary Cards
- **Total Cost card**:
  - Shows cumulative AI costs
  - Currency formatted (USD)
  - Prominent display
- **Total Requests card**:
  - Shows number of AI requests made
  - Number formatted with separators
- **Average Cost per Request card**:
  - Calculated average
  - Helps track cost efficiency

#### Tab Navigation
- **Two main tabs**:
  1. **Overview**: Charts and visualizations
  2. **Detailed Usage**: Table of individual requests

### Overview Tab

#### Daily Usage Chart
- **Line/bar chart** showing usage over time
- **X-axis**: Dates
- **Y-axis**: Cost or request count
- **Interactive tooltips** on hover
- **Date range selector** for filtering
- **Visual trends** easily identifiable

#### Model Distribution Chart
- **Pie or bar chart** showing usage by model
- **Color-coded** per AI model
- **Percentage breakdown** of usage
- **Cost comparison** between models
- **Legend** with model names

### Detailed Usage Tab

#### Usage Table
- **Sortable columns**:
  - Date/Time
  - Model used
  - Request type
  - Tokens used (input + output)
  - Cost
- **Pagination** for large datasets
- **Rows per page** selector

#### Table Row Details
- **Timestamp**: Full date and time
- **Model name**: Which AI model was used
- **Request category**: Type of operation
- **Token counts**: Input and output tokens separately
- **Cost**: Precise cost in USD
- **Cache status**: If response was cached

#### Filtering & Search
- **Date range filter**: Start and end date pickers
- **Model filter**: Multi-select dropdown
- **Search**: Free text search in requests
- **Apply filters** button
- **Clear filters** button

#### Export Functionality
- **Export to CSV** button
- Downloads usage data
- Includes all filtered results
- Useful for external analysis

---

## AI Chat

**Route:** `/ai-chat`

### Product Purpose
**AI-Powered Financial Assistant** - Provides conversational interface for getting financial insights, asking questions about spending, or getting advice. The primary goal is to make financial data accessible through natural language - instead of clicking through reports, users can simply ask "How much did I spend on restaurants last month?" The AI can analyze data, provide insights, and answer complex questions, making financial intelligence more accessible.

### Features

#### Chat Interface
- **Full-screen chat layout**
- **Message history** with scrolling
- **Auto-scroll** to latest message
- **Smooth scrolling** animation

#### Model Selection
- **Dropdown selector** at top of page
- Shows current AI model
- Lists all available models with providers
- **Immediate switching** without losing chat history

#### Message Input
- **Text input field** at bottom
- **Placeholder**: "Type your message..."
- **Send button** with paper plane icon
- **Keyboard shortcuts**: Enter to send
- **Disabled during processing**

#### Chat Messages
- **User messages**:
  - Right-aligned
  - Light blue background
  - User's text content
  - Timestamp (subtle)
- **AI messages**:
  - Left-aligned
  - White/paper background
  - AI-generated response
  - **Cost display** below message
  - **Cache indicator** if response was cached

#### Message Metadata
Each AI response shows:
- **Cost in USD** (e.g., "$0.02")
- **Cache status**:
  - "From cache (s3)" - Retrieved from S3 cache
  - "From cache (fs)" - Retrieved from file system cache
  - No badge - Fresh API call
- **Color-coded chips**:
  - Primary blue for S3 cache
  - Default gray for fs cache

#### Loading States
- **Typing indicator** while AI is generating
- **Send button** shows spinner
- **Input disabled** during processing
- **Smooth transitions** between states

#### Error Handling
- **Error messages** displayed as AI messages
- **Red text** for visibility
- **Error details** included
- **Retry capability** (send new message)

#### Chat History
- **Persistent within session**
- **Scrollable** for long conversations
- **Message grouping** by time
- **Clean, readable** layout

---

## General UI/UX Features

### Mobile-First Design
- **iOS-style interface** throughout
- **Touch-optimized** button sizes (minimum 44x44px)
- **Responsive layouts** adapt to screen size
- **Bottom navigation bars** on mobile
- **Sticky headers** where appropriate

### Color & Theming
- **Category color coding** consistent across app
- **Primary/secondary** color scheme
- **Success/error/warning** states clearly distinguished
- **Dark mode ready** (theme support built in)

### Navigation
- **Persistent navigation** menu/drawer
- **Breadcrumbs** where applicable
- **Back buttons** follow iOS conventions
- **URL-based routing** allows bookmarking
- **Browser back/forward** support

### Loading States
- **Skeleton screens** for content loading
- **Spinners** for actions
- **Progress indicators** for multi-step operations
- **Smooth transitions** between states

### Error Handling
- **User-friendly error messages**
- **Retry mechanisms** where appropriate
- **Validation feedback** on forms
- **Network error** handling
- **Fallback UI** for failed data loads

### Notifications
- **Snackbar/toast** notifications for actions
- **Success confirmations**
- **Error alerts**
- **Auto-dismiss** with manual close option
- **Non-intrusive** positioning

### Accessibility
- **ARIA labels** on interactive elements
- **Keyboard navigation** support
- **Focus indicators** visible
- **Color contrast** meets standards
- **Screen reader** friendly

### Performance
- **Lazy loading** of routes and images
- **Infinite scroll** with progressive loading
- **Caching** for API responses
- **Optimistic UI** updates
- **Debounced search** inputs

---

## Data Management

### Transactions
- **Credit card transactions** tracking
- **Bank account transactions** tracking
- **Multi-currency** support
- **Category assignment** and management
- **Comment/notes** system
- **Trip assignment** for travel tracking
- **Pending/cleared** status tracking

### Categories
- **Predefined category** system
- **Custom categories** support
- **Category icons** and colors
- **Hierarchical categorization** (if needed)
- **Quick category** assignment

### Trips
- **Trip creation** and management
- **Date range** association
- **Location** tracking
- **Transaction assignment** to trips
- **Multi-currency** trip totals
- **Automatic NIS** conversion for totals

### Filters & Search
- **Advanced filtering** on all list views
- **Multi-criteria** search
- **Saved filters** (if implemented)
- **URL-persisted** search state
- **Quick filters** for common queries

---

## AI Integration

### AI Models
- **Multiple AI providers** supported (OpenAI, Anthropic, etc.)
- **Model selection** per feature
- **Cost tracking** per request
- **Token usage** monitoring
- **Response caching** for cost savings

### Caching Strategy
- **Multi-tier caching**:
  - File system cache (local)
  - S3 cache (cloud)
- **Cache hit** indicators
- **Cache management** tools
- **Manual cache** clearing

### Usage Monitoring
- **Cost tracking** dashboard
- **Request logging**
- **Performance metrics**
- **Model comparison** analytics
- **Export** capabilities for analysis

---

## Technical Capabilities

### Data Persistence
- **Local storage** for settings and preferences
- **Database** for transactions and financial data
- **Cloud storage** for caching
- **Automatic sync** mechanisms

### Import/Export
- **File manager** for data files
- **CSV export** of usage data
- **Backup and restore** capabilities
- **Data migration** tools

### Security
- **User authentication** (if implemented)
- **Secure API** communication
- **Data encryption** at rest and in transit
- **Permission-based** access control

---

## Conclusion

This finance application provides a comprehensive suite of tools for personal financial management, combining intuitive UI/UX with powerful features like AI integration, trip tracking, and advanced analytics. The mobile-first design ensures excellent usability across all devices, while the feature-rich interface provides professionals with the tools they need for detailed financial tracking and insights.

