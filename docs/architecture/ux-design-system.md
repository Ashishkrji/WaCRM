# WaCRM UX Design System

## 1. Design Tokens

### 1.1 Color System (Tailwind Base)
- **Primary**: `blue-600` (#2563EB) - Used for primary actions, buttons, and active states.
- **Secondary**: `slate-800` (#1E293B) - Used for secondary buttons and dark backgrounds.
- **Accent**: `emerald-500` (#10B981) - Used for success states, active connections (WhatsApp), and growth metrics.
- **Warning**: `amber-500` (#F59E0B) - Used for alerts, pending states, and warnings.
- **Danger**: `red-500` (#EF4444) - Used for destructive actions (delete, block, error).
- **Surface**: `white` (#FFFFFF) - Cards, modals, dropdowns (Light mode).
- **Surface Dark**: `slate-900` (#0F172A) - Cards, modals, dropdowns (Dark mode).
- **Background**: `slate-50` (#F8FAFC) - Main app background (Light mode).

### 1.2 Typography (Inter & Roboto Mono)
- **Font Family (Sans)**: `Inter, sans-serif` - Used for all UI text, headings, and paragraphs.
- **Font Family (Mono)**: `Roboto Mono, monospace` - Used for code snippets, API keys, and logs.
- **Base Size**: 14px (Text-sm) for dense CRM interfaces.
- **Headings**:
  - H1: 24px, Semi-bold (Page titles)
  - H2: 20px, Medium (Section headers)
  - H3: 16px, Medium (Card titles)

## 2. Core Components

### 2.1 Buttons
- **Primary**: Solid blue background, white text, subtle hover shadow.
- **Secondary**: Transparent background, gray border, gray text, light gray hover background.
- **Ghost**: No background, no border, primary color text on hover.
- **Danger**: Solid red background, white text.

### 2.2 Data Tables
- **Header**: Light gray background, uppercase, 12px, tracking-wider.
- **Rows**: Alternating subtle gray background (zebra striping) for readability.
- **Pagination**: Standard Next/Previous with page number buttons.
- **Actions**: Always positioned on the far right column, usually inside a `...` dropdown menu to save space.

### 2.3 Modals & Drawers
- **Modals**: Used for destructive confirmations (Delete User) and quick form entries. Centered, max-width `md`.
- **Drawers (Slide-overs)**: Used for complex edits (Editing a Lead, Viewing Contact History). Slides in from the right edge.

## 3. Responsive Layouts
- **Desktop (1024px+)**: Sidebar navigation (fixed left), top header, main content area.
- **Tablet (768px - 1023px)**: Collapsed sidebar (icons only).
- **Mobile (< 768px)**: Hidden sidebar, accessible via hamburger menu. Bottom navigation for core features (Inbox, Contacts).

## 4. Accessibility Guidelines (a11y)
- **Contrast**: All text must pass WCAG AA contrast ratios (4.5:1 for normal text).
- **Keyboard Navigation**: All interactive elements (buttons, inputs, dropdowns) must be focusable via `Tab`.
- **Aria Labels**: Icon-only buttons must have `aria-label` attributes.
- **Focus Rings**: Standard Tailwind `ring-2 ring-blue-500` applied to all focused inputs and buttons.
