---
name: ck:shadcn-ui-design
description: "shadcn/ui design system — 70+ components (Radix UI + Tailwind CSS), CSS variable theming, dark mode, composition patterns, form patterns, accessibility. Use when building UI with shadcn/ui, adding components, styling, theming, customizing design tokens, or asking about shadcn best practices. Covers: Button, Dialog, Sheet, Card, Table, Form, Chart, Sidebar, Tabs, Select, Input, Badge, Avatar, Alert, Toast, Skeleton, etc."
argument-hint: "[component-name|pattern|theme]"
---

# shadcn/ui Design System

Full source code reference for shadcn/ui — the component framework built on Radix UI + Tailwind CSS.

## When to Activate

- Building UI with shadcn/ui components
- Adding new shadcn components to a project
- Styling, theming, or customizing shadcn components
- Questions about component composition patterns
- Form layout and validation patterns
- Dark mode / CSS variable theming
- Comparing shadcn approach vs custom components

## Source Structure

```
skills/shadcn/
├── SKILL.md           # Full design rules & patterns
├── cli.md             # CLI commands (add, search, init, docs)
├── customization.md   # Theme tokens, CSS variables, dark mode
├── mcp.md             # MCP integration
├── rules/
│   ├── styling.md     # Tailwind + className rules
│   ├── forms.md       # Form layout, validation, FieldGroup
│   ├── composition.md # Component composition patterns
│   ├── icons.md       # Icon sizing, data-icon attribute
│   └── base-vs-radix.md  # asChild vs render prop
└── agents/            # AI agent configs
```

## Quick Reference

### Read the full design rules
```bash
cat ~/.claude/skills/shadcn-ui-design/skills/shadcn/SKILL.md
```

### Read specific rule files
```bash
# Styling rules (className, semantic colors, gap vs space)
cat ~/.claude/skills/shadcn-ui-design/skills/shadcn/rules/styling.md

# Form patterns (FieldGroup, Field, validation)
cat ~/.claude/skills/shadcn-ui-design/skills/shadcn/rules/forms.md

# Component composition (Card, Dialog, Sheet, Tabs)
cat ~/.claude/skills/shadcn-ui-design/skills/shadcn/rules/composition.md

# Icon usage (data-icon, no sizing classes)
cat ~/.claude/skills/shadcn-ui-design/skills/shadcn/rules/icons.md

# Theming & customization (CSS variables, dark mode)
cat ~/.claude/skills/shadcn-ui-design/skills/shadcn/customization.md

# CLI commands
cat ~/.claude/skills/shadcn-ui-design/skills/shadcn/cli.md
```

### Search component source code
```bash
# Find a specific component implementation
find ~/.claude/skills/shadcn-ui-design/packages/shadcn -name "*.tsx" | grep -i "button\|dialog\|card"
```

## Core Principles

1. **Use existing components first** — search registries before writing custom UI
2. **Compose, don't reinvent** — combine existing components
3. **Use built-in variants** — `variant="outline"`, `size="sm"`, etc.
4. **Use semantic colors** — `bg-primary`, `text-muted-foreground` — never raw `bg-blue-500`
5. **`className` for layout, not styling** — never override component colors/typography
6. **`gap-*` not `space-x/y-*`** — always use flex + gap
7. **Forms use FieldGroup + Field** — never raw div with space-y

## CSS Variable Theming

12 semantic token pairs control the entire UI:
- `--background` / `--foreground`
- `--primary` / `--primary-foreground`
- `--secondary` / `--secondary-foreground`
- `--muted` / `--muted-foreground`
- `--accent` / `--accent-foreground`
- `--destructive` / `--destructive-foreground`
- `--card` / `--card-foreground`
- `--popover` / `--popover-foreground`
- `--border`, `--input`, `--ring`
- `--radius`

Dark mode via `.dark` class toggle on `<html>`.

## Integration with Other Skills

- Use with `ck:ui-ux-pro-max` for design intelligence and product recommendations
- Use with `ck:design-themes` for theme selection and configuration
- Use with `ck:frontend-design` for building complete interfaces
- Use with `ck:web-design-guidelines` for accessibility compliance
