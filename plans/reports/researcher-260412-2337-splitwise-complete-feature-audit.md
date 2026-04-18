# Splitwise Complete Feature Audit
**Date:** 2026-04-12 | **Status:** Research Complete

---

## 1. CORE BILL SPLITTING FEATURES

### Split Types
- **Equal Split**: Divide cost evenly among all participants
- **Percentage Split**: Assign custom percentage to each person (must total 100%)
- **Shares Split**: Divide by number of units/shares (e.g., nights stayed, meal portions)
- **Exact Amounts**: Manually enter specific dollar amount each person owes
- **Multiple Payers**: Single expense can have multiple people who paid (optional feature)

### Expense Management
- Unlimited expenses (free tier: limits to ~5/day; Pro: unlimited daily adds)
- Add expenses in seconds with minimal friction
- Attach notes/text to expenses
- Attach receipt photos to expenses
- Receipt scanning with OCR (Pro only) — automatically detects items from receipt photo
- Itemized receipt splitting (Pro only) — break scanned receipt into individual items, assign to specific people
- Add/edit/delete expenses post-creation
- View edit history for expense changes
- Restore deleted expenses via Recent Activity feed
- Offline mode (mobile): add/edit expenses without internet, sync when online
- 100+ currency support for international transactions

### Recurring Expenses
- Set expenses to recur: daily, weekly, monthly, yearly, fortnightly
- Auto-generates copies on set schedule
- Option to send email reminders before recurring expense is due
- Edit most recent copy (affects future recurrences, not past)
- Support for common recurring categories: rent, utilities, groceries, subscriptions

---

## 2. GROUP MANAGEMENT

### Group Creation & Types
- Create unlimited groups
- Group types available: Home, Trip, Couple, Other
- Group types have minimal practical difference (UI clarification requested by users)
- Add custom cover photos/group artwork
- Invite members via email/contact info

### Group Settings & Management
- Group members see all group expenses and balances
- Remove/manage group members
- Delete group (removes for ALL members; requires settlement first)
- Archive groups (Pro-ready feature): disable future edits, preserve history, move to archived tab
- Custom group-level default split settings (Pro only)
- Toggle "Simplify Debts" on/off at group level

### Visibility & Privacy
- All group members see all group expenses by default
- Can create non-group expenses for ad-hoc spending (e.g., random lunch with one friend)
- Non-group expenses visible only to involved parties, counted in personal dashboard balances
- Privacy controls: choose whether friends can see email/phone association

---

## 3. DEBT TRACKING & SETTLEMENT

### Debt Calculation
- Real-time calculation of who owes whom
- Total balance shown per person (across all groups + non-group expenses)
- Per-group balances displayed separately
- Balance breakdown: shows "you owe X" vs "X owes you"

### Simplify Debts Algorithm
- Core feature: minimizes transaction count for settlement
- Example: Anna owes Bob $20, Bob owes Charlie $20 → system suggests Anna pay Charlie $20 (1 payment vs 2)
- Uses network flow optimization with heuristics (NP-hard problem)
- Toggle on/off: "simplify debts" setting in group controls
- Reduces typical 8-payment settlement to 3 payments
- Enabled by default

### Settlement Methods
- **Cash Payment**: Record cash payment manually
- **Splitwise Pay** (US only): Direct bank transfer from linked checking account
  - No transaction fees
  - Link account via online credentials or micro-deposits (1-2 days)
  - Send money to friend's email, they claim to bank account
  - Withdraw funds to your bank account anytime
- **Venmo** (US only): Direct Venmo send/request within Splitwise app
- **PayPal** (international): Direct PayPal send/request within Splitwise app
- **Undo Settlement**: Can reverse a payment by deleting the recorded payment transaction

### Payment Notifications
- Automatic notifications when someone pays you
- Can send manual "balance reminder" to any friend
- Monthly summary email with all current balances
- Recurring expense reminders (email) days before due date

---

## 4. EXPENSE CATEGORIES

### Standard Categories
- Rent/Mortgage
- Utilities
- Food/Groceries
- Eating Out
- Transportation
- General/Other
- Subscriptions
- Entertainment
- Travel
- and more (~20+ categories)

### Category Features
- Assign category to every expense (optional)
- View spending breakdown by category
- Spending by category charts (Pro only)
- Trends and analytics by category (Pro only)
- Free tier: basic category selection
- Pro tier: detailed spending trends, pie charts, comparison over time

### Custom Categories
- User feedback indicates requests for custom categories, but current system limited to preset categories

---

## 5. ACTIVITY & HISTORY

### Activity Feed
- "Recent Activity" section shows all account changes
- Displays: expenses added/edited/deleted, comments, members added, debt simplification toggle changes
- Comment notifications appear in activity feed
- Accessible via flag icon (website) or Recent Activity tab (mobile)
- Filter by group/person (partial support)

### Expense History
- Full expense search (Pro only): locate any past expense
- Export expense history to CSV for analysis
- Edit history: view details of what changed in each expense
- See who made edits to expenses
- Non-group expenses visible when clicking on person's name
- Settlement history: undo/view payment records

### Data Export
- Export to CSV: include all expense data with categories
- JSON backup available (Pro only)
- Export from account settings page
- Downloadable from website account page

---

## 6. NOTIFICATIONS

### Push Notifications (Mobile)
- Triggered for: new expenses, expense edits, expense deletions, comments, payments received
- Tied to activity feed items — same triggers as activity notifications
- Can enable/disable push notifications in settings
- Real-time delivery when something changes in your groups

### Email Notifications
- Automated: Monthly summary email with all balances
- Expense-triggered: Email on expense add/edit/delete
- Comment-triggered: Email when someone comments on an expense (if enabled)
- Payment reminders: Email a few days before recurring expense due date
- Manual trigger: "Send reminder" button to ping a friend about their balance
- Optional: Can choose to disable optional communications in account settings

---

## 7. ACCOUNT & PROFILE

### Profile Settings
- Change name/email address in Account Settings
- Upload custom avatar/profile photo
- Set profile status/bio (if supported)
- View account change history

### Currency Management
- Set default personal currency in account info
- Automatic default based on location
- Override currency per expense
- Per-group currency settings available
- Multi-currency support in single group
- Currency conversion to settle in different currency (Pro only)
- 100+ currencies supported globally

### Default Split Settings
- Set personal default split preference
- Save custom split percentages/shares (Pro only)
- Group-level default splits (Pro only) — pre-fill split method for new expenses
- Affects new expenses created in that group

### Email & Privacy Preferences
- Choose whether to receive optional promotional emails
- Control email address visibility to other users
- Control phone number visibility to other users
- Account accessibility settings

---

## 8. SOCIAL FEATURES

### Comments
- Add comments/notes to individual expenses
- View comment threads under each expense
- System comments show edit history (what changed, by whom)
- Comments appear in Recent Activity feed
- Get notified via email/push when someone comments
- Comments visible to all group members

### Notes/Descriptions
- Add description text to expenses (for context, special instructions)
- Receipt photos can have notes attached
- Help avoid confusion about what expense was for

### Direct Messaging
- User requests for in-app messaging/group chat feature exist but not confirmed as implemented
- Comments on expenses serve as primary social interaction

---

## 9. REPORTS & ANALYTICS

### Free Tier Analytics
- View total spending per person (dashboard)
- View group totals
- See balance breakdown: who owes whom
- Basic expense list view

### Pro Tier Analytics
- Spending by category pie chart
- Spending trends over time graphs
- Monthly breakdown of spending
- Historic monthly charts
- Category comparison tools
- Identify spending patterns
- Analyze group vs personal spending
- Export data with full category information

### Charts & Visualizations
- Pie charts: spending distribution by category
- Bar graphs: total balance comparisons
- Timeline views: spending over months/years
- Trends tab shows category breakdown with time analysis

---

## 10. INTEGRATIONS

### Payment Integrations
- **Venmo** (US): One-click Venmo send/request from Splitwise settle-up screen
- **PayPal** (International): One-click PayPal send/request from Splitwise settle-up screen
- **Splitwise Pay** (US): Proprietary bank transfer system
  - Link checking account
  - Send/receive money
  - Withdraw to bank account
  - Zero fees for ACH transfers

### Transaction Import (Pro only, US)
- Connect credit/debit cards
- Auto-detect transactions
- Quickly split imported transactions
- Currently US market only

### Third-Party Integrations
- Open Exchange Rates: For currency conversion (Pro)
- No direct integrations with Slack, Discord, calendar apps currently confirmed

---

## 11. PRO/PREMIUM FEATURES (Splitwise Pro)

### Pricing
- $2.99/month (monthly subscription)
- $29.99/year (annual subscription)
- ~$3/month effective if paid annually

### Unlimited Usage
- Unlimited expenses per day (free: ~5/day limit)
- No daily add interruptions
- Add as many as needed

### Receipt & Itemization
- Receipt photo scanning with OCR
- Automatic item detection from receipt
- Itemize receipt into individual items
- Assign items to specific friends
- Perfect for restaurant bills and grocery receipts

### Advanced Analytics
- Spending by category charts (pie charts)
- Spending trends over time
- Historic monthly comparison
- Category analytics and insights
- Budget tracking features

### Data & Export
- Full expense history search (locate any past expense)
- JSON backup/export of all data
- CSV export with all categories
- Download backups from website

### Currency Features
- Live currency conversion
- Use Open Exchange Rates API for rates
- Convert bills to any currency for settlement
- Real-time exchange rates

### Settings
- Save unequal split templates per group
- Default split settings (percentages/shares)
- Group-level custom split presets

### User Experience
- Ad-free experience (free version shows banner ads)
- Early access to beta features
- First to test new feature releases
- Support for new design iterations

---

## 12. MOBILE-SPECIFIC FEATURES

### Offline Support
- Add/edit expenses without internet
- Remove expenses offline
- Changes sync when connection restored
- Works on both iOS and Android

### Mobile UI/UX
- Touch-optimized interface
- Quick expense add via bottom sheet
- Swipe interactions (some requested but unclear if all implemented)
- Status bar notifications

### Requested But Unconfirmed Features
- Home screen widgets for quick add
- Swipe-to-settle-up gesture
- Swipe-right to send reminder
- Quick-action shortcuts
- These are feature requests in user feedback; implementation status unclear

### Platforms
- Native iOS app (App Store)
- Native Android app (Google Play)
- Web app (browser: splitwise.com)
- Cross-platform sync

---

## 13. SPECIAL FEATURES & EDGE CASES

### Account Recovery & Restoration
- Deleted expenses: Can restore via Recent Activity "un-delete" button
- Deleted groups: Contact support@splitwise.com for recovery
- Payment undo: Delete payment record to reverse settlement

### Multi-Group Balances
- Single person may have multiple balances across groups
- Dashboard shows total balance (all groups + non-group expenses)
- Group view shows only that group's balance
- Non-group expenses not included in group totals

### Non-Group/Ad-Hoc Expenses
- Create expenses outside any group for casual spending
- Choose visibility: private or visible to other person
- Included in personal dashboard balance
- Tracked per-person even without group structure

### Recurring Bill Management
- Auto-generate on schedule
- Edit most recent (affects future only)
- Can't change past bills in recurrence
- Reminder emails trigger before due date

### Group Archival (Emerging)
- Archive completed groups
- Preserve all historical data
- Disable future edits
- Still visible to all members
- Move to Archived section in UI

---

## 14. LIMITATIONS & GAPS

### Features NOT Found / Unclear Status
1. **Likes/Reactions**: No evidence of "like" button on expenses or comments
2. **In-App Messaging**: Primary social interaction is comments, not full chat
3. **Widgets**: Requested by users but status unclear
4. **Swipe Gestures**: Some UX concepts proposed; unclear what's implemented
5. **Custom Categories**: System uses preset categories only
6. **Email Reminders Control**: Limited granularity; monthly default, feature requests for weekly
7. **Group Type Differentiation**: Couple/Trip/Home/Other types exist but minimal functional difference
8. **Multiple Payment Methods per Transaction**: Can't split a single expense across multiple payers yet (some feedback requesting this)
9. **Duplicate Detection**: No auto-detection if same expense added twice
10. **Collaborative Receipt Splitting**: Receipt scanning doesn't seem to support real-time group collaboration

### Known User Pain Points
- Free tier feels restrictive (5 expenses/day limit)
- Aggressive monetization criticism in user reviews
- Limited mobile gesture support vs. competitors
- No widget support for quick adds
- Reminder customization limited to monthly + recurring bill reminders
- Group type selection has minimal UI explanation

---

## 15. COMPETITIVE POSITION vs. ALTERNATIVES

### Strengths vs. Competitors
- Simplify debts algorithm is industry-leading
- Comprehensive receipt scanning + itemization (Pro)
- Strong analytics and spending insights
- Multi-platform consistency (web + mobile)
- 100+ currency support
- Venmo/PayPal integration (US-centric advantage)

### Competitor Features Not Fully Matched
- **SplitMyExpenses**: Better item-level splitting UX, one-person capture workflow
- **Tricount**: Simpler interface, more free features
- **splitty**: Better feature explanations, cleaner UX
- **MemoGo**: Trip planning integration + expense tracking combined
- **Splitser**: Simpler UI, better currency mixing on single list

### Monetization Criticism
- Aggressive paywall for features once free
- 5-expense/day limit on free tier frustrates users
- Pro tier pricing $2.99/mo considered reasonable but feature bundling debated

---

## SUMMARY: FEATURE COMPLETENESS

### Fully Mature
✓ Bill splitting (equal/percentage/shares/exact)
✓ Group management
✓ Debt calculation & simplification
✓ Expense categorization
✓ Activity feed & history
✓ Settlement via Venmo/PayPal/Splitwise Pay
✓ Recurring expenses
✓ Multi-currency support
✓ Offline mode (mobile)
✓ Comments on expenses
✓ Receipt photos
✓ Archive groups

### Strong (Pro-Tier)
✓ Receipt scanning & OCR
✓ Itemized splitting from receipts
✓ Analytics & spending trends
✓ Currency conversion
✓ Full expense search
✓ Data export (JSON/CSV)
✓ Ad-free experience

### Emerging/Limited
⚠ Reminder customization (monthly + recurring only)
⚠ Widget support (requested, unclear status)
⚠ Group type differentiation (minimal functional difference)
⚠ Social features (comments only, no reactions/likes)

### Not Confirmed/Missing
✗ Likes/reactions on expenses
✗ In-app messaging/group chat
✗ Home screen quick-add widget
✗ Custom expense categories
✗ Detailed swipe gesture support
✗ Duplicate expense detection

---

## RESEARCH NOTES

**Authoritative Sources Used:**
- Official Splitwise website & blog
- In-app store listings (Apple App Store, Google Play)
- Splitwise Help Center (feedback.splitwise.com)
- User reviews and feature requests
- Third-party comparisons and reviews

**Data Freshness:**
- Search results from 2025-2026
- Some features may have updates not yet reflected in public documentation
- Feature requests in feedback forum indicate desired but unimplemented features

**Key Uncertainties:**
1. Exact state of widget support (requested but implementation unclear)
2. Swipe gesture implementation status (UI concepts exist; shipping status unclear)
3. In-app messaging feature status (comments implemented; full chat unconfirmed)
4. Group type practical differences (minimal documentation available)
5. Custom category support (feedback requests indicate not yet available)

---

## RECOMMENDATIONS FOR YOUR APP COMPARISON

**Gaps to Consider vs. Your App:**
1. If your app has **likes/reactions** → Splitwise competitive gap
2. If your app has **custom categories** → Splitwise gap
3. If your app has **in-app chat/messaging** → Splitwise gap (comments only)
4. If your app has **quick-add widgets** → Splitwise gap (requested but unclear)
5. If your app has **item-level splitting UX** → Better than Splitwise free tier
6. If your app has **simpler onboarding** → Potential advantage vs. Splitwise
7. If your app has **weekly reminder granularity** → Splitwise gap
8. If your app has **collaborative receipt mode** → Splitwise gap

**Strengths You Need to Match/Beat:**
- Simplify debts algorithm (non-trivial, core value)
- Receipt scanning + OCR (Pro feature, very valuable)
- Itemized receipt splitting (major convenience)
- Multi-currency with conversion (critical for travelers)
- Venmo/PayPal integration (US convenience)
- Strong analytics suite (Pro, trending feature)

