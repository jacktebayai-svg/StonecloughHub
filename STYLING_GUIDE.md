# StonecloughHub Styling Guide

This guide outlines the updated design system and styling patterns for the StonecloughHub project. All new components should follow these patterns.

## 🎨 Design System Overview

The project now uses a comprehensive design system built on CSS custom properties with semantic color naming and proper Tailwind CSS integration.

## 📋 Color System

### Semantic Colors (Use These Primarily)
```css
/* Primary brand colors */
--primary: var(--stoneclough-blue-800)        /* Main brand color */
--primary-foreground: var(--stoneclough-blue-50)  /* Text on primary */

--secondary: var(--stoneclough-gray-600)      /* Secondary brand color */
--secondary-foreground: var(--stoneclough-blue-50)  /* Text on secondary */

--accent: var(--stoneclough-blue-600)         /* Accent/interactive color */
--accent-foreground: var(--stoneclough-blue-50)     /* Text on accent */

/* Layout colors */
--background: var(--stoneclough-blue-50)      /* Main background */
--foreground: var(--stoneclough-gray-900)     /* Main text color */
--muted: var(--stoneclough-gray-100)          /* Muted backgrounds */
--muted-foreground: var(--stoneclough-gray-600)     /* Muted text */

/* Component colors */
--card: hsl(0, 0%, 100%)                      /* Card backgrounds */
--card-foreground: var(--stoneclough-gray-800)      /* Card text */
--border: var(--stoneclough-gray-200)         /* Borders */
--input: var(--stoneclough-gray-100)          /* Input backgrounds */

/* Status colors */
--destructive: var(--stoneclough-accent-red)  /* Errors/dangerous actions */
```

### Community-Specific Colors
```css
--community-success: var(--stoneclough-accent-green)  /* Success states */
--community-warning: var(--stoneclough-accent-orange) /* Warnings/highlights */
--community-highlight: var(--stoneclough-accent-yellow) /* Special highlights */
--community-error: var(--stoneclough-accent-red)      /* Errors */
```

### Stoneclough Brand Palette
```css
/* Blue Scale (Primary Brand) */
--stoneclough-blue-50: #f7fafc
--stoneclough-blue-100: #ebf8ff
--stoneclough-blue-200: #bee3f8
--stoneclough-blue-300: #90cdf4
--stoneclough-blue-400: #63b3ed
--stoneclough-blue-500: #4299e1
--stoneclough-blue-600: #3182ce
--stoneclough-blue-700: #2d5aa0
--stoneclough-blue-800: #254974  /* Primary brand blue */
--stoneclough-blue-900: #1a365d

/* Gray Scale */
--stoneclough-gray-50: #fafbfc
--stoneclough-gray-100: #f7fafc
--stoneclough-gray-200: #e2e8f0
--stoneclough-gray-300: #cbd5e0
--stoneclough-gray-400: #a0aec0
--stoneclough-gray-500: #718096
--stoneclough-gray-600: #587492  /* Brand gray-blue */
--stoneclough-gray-700: #4a5568
--stoneclough-gray-800: #2d3748
--stoneclough-gray-900: #1a202c

/* Accent Colors */
--stoneclough-accent-green: #38a169   /* Success/positive */
--stoneclough-accent-orange: #dd6b20  /* Community accent */
--stoneclough-accent-yellow: #ecc94b  /* Warning/highlight */
--stoneclough-accent-red: #e53e3e     /* Error/negative */
```

## 🔧 Tailwind Classes

### Use These Instead of Hardcoded Colors

#### ❌ DON'T USE:
```tsx
// Hardcoded Tailwind colors
className="text-blue-600 bg-slate-50 border-gray-200"
className="hover:bg-blue-700 text-white"
className="bg-gradient-to-r from-blue-500 to-purple-600"
```

#### ✅ DO USE:
```tsx
// Semantic design system colors
className="text-accent bg-background border-border"
className="hover:bg-brand text-brand-light"
className="gradient-brand"

// Or specific Stoneclough colors when needed
className="text-stoneclough-blue-600 bg-stoneclough-blue-50"
className="text-community-success bg-community-success/10"
```

### Utility Classes Available

#### Brand Colors
```css
.text-brand          /* Primary brand color text */
.bg-brand            /* Primary brand background */
.text-brand-light    /* Text for use on brand background */
.bg-brand-light      /* Light brand background */

.text-secondary-brand /* Secondary brand text */
.bg-secondary-brand   /* Secondary brand background */

.text-accent-brand    /* Accent brand text */
.bg-accent-brand      /* Accent brand background */
```

#### Community Colors
```css
.text-community-success    /* Success state text */
.bg-community-success      /* Success state background */
.text-community-warning    /* Warning state text */
.bg-community-warning      /* Warning state background */
.text-community-highlight  /* Highlight text */
.bg-community-highlight    /* Highlight background */
```

#### Special Effects
```css
.glass                     /* Glass morphism effect */
.glass-dark               /* Dark glass effect */

.gradient-brand           /* Primary brand gradient */
.gradient-brand-soft      /* Soft brand gradient */
.gradient-community       /* Community-specific gradient */
```

#### Shadows (Using Design System)
```css
.shadow-2xs               /* Minimal shadow */
.shadow-xs                /* Extra small shadow */
.shadow-sm                /* Small shadow */
.shadow                   /* Default shadow */
.shadow-md                /* Medium shadow */
.shadow-lg                /* Large shadow */
.shadow-xl                /* Extra large shadow */
.shadow-2xl               /* Largest shadow */
```

## 🏗️ Component Patterns

### Cards
```tsx
// Standard card
<Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
  <CardHeader>
    <CardTitle className="text-foreground">Title</CardTitle>
    <CardDescription className="text-muted-foreground">Description</CardDescription>
  </CardHeader>
  <CardContent className="text-card-foreground">
    Content here
  </CardContent>
</Card>

// Gradient card with brand colors
<Card className="bg-gradient-to-br from-accent to-brand text-white shadow-xl">
  <CardContent className="p-8">
    Gradient card content
  </CardContent>
</Card>
```

### Buttons
```tsx
// Primary button
<Button className="bg-brand hover:bg-brand/90 text-brand-light">
  Primary Action
</Button>

// Secondary button
<Button variant="outline" className="border-border text-foreground hover:bg-muted">
  Secondary Action
</Button>

// Success action
<Button className="bg-community-success hover:bg-community-success/90 text-white">
  Success Action
</Button>

// Warning action
<Button className="bg-community-warning hover:bg-community-warning/90 text-white">
  Warning Action
</Button>
```

### Badges
```tsx
// Status badges
<Badge className="bg-community-success/10 text-community-success">Success</Badge>
<Badge className="bg-community-warning/10 text-community-warning">Warning</Badge>
<Badge className="bg-accent/10 text-accent">Info</Badge>

// Brand badges
<Badge className="bg-brand/10 text-brand">Featured</Badge>
<Badge className="bg-muted text-muted-foreground">Default</Badge>
```

### Backgrounds and Sections
```tsx
// Main background
<div className="bg-background text-foreground">

// Card background
<div className="bg-card text-card-foreground">

// Muted background
<div className="bg-muted text-muted-foreground">

// Glass effect
<div className="glass text-foreground">

// Gradient backgrounds
<div className="gradient-brand text-brand-light">
<div className="gradient-community text-white">
```

## 🎭 Animation and Motion

### Framer Motion Patterns
```tsx
// Fade in animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
  className="animate-fade-in"
>

// Hover effects
<motion.div
  whileHover={{ y: -5, scale: 1.02 }}
  className="transition-all duration-300"
>

// Gradient rotation on hover
<motion.div
  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
  transition={{ duration: 0.5 }}
>
```

## 📐 Layout Patterns

### Grid Layouts
```tsx
// Responsive card grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Stats grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

// Content grid
<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
```

### Container Patterns
```tsx
// Standard page container
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

// Content container
<div className="max-w-4xl mx-auto px-4">

// Full-width with padding
<div className="px-4 sm:px-6 lg:px-8">
```

## 🎯 Best Practices

### 1. Always Use Semantic Colors First
- Use `text-foreground` instead of `text-gray-900`
- Use `bg-background` instead of `bg-white`
- Use `text-muted-foreground` instead of `text-gray-500`

### 2. Use Design System Gradients
- Use `gradient-brand` instead of `from-blue-500 to-purple-600`
- Use `gradient-community` for community-specific elements

### 3. Consistent Spacing
- Use Tailwind's spacing scale: `p-4`, `p-6`, `p-8`
- Use consistent gaps: `gap-4`, `gap-6`, `gap-8`

### 4. Responsive Design
- Always include responsive classes: `text-sm lg:text-base`
- Use mobile-first approach: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### 5. Accessibility
- Ensure proper contrast ratios
- Use semantic HTML elements
- Include proper ARIA labels

### 6. Dark Mode Support
- All colors are automatically dark-mode compatible
- Use semantic colors that adapt to theme

## 🚫 What to Avoid

1. **Hardcoded Tailwind colors**: `text-blue-600`, `bg-slate-100`
2. **Inline styles**: `style={{ color: '#3182ce' }}`
3. **Magic numbers**: `opacity-[0.73]`, `mt-[17px]`
4. **Non-semantic naming**: `bg-hub-blue`, `text-custom-gray`
5. **Inconsistent shadows**: Use design system shadows only
6. **Mixed color systems**: Don't mix hardcoded with semantic colors

## 📚 Migration Guide

When updating existing components:

1. Replace hardcoded colors with semantic equivalents
2. Update gradients to use utility classes
3. Use design system shadows
4. Ensure consistent spacing
5. Test in both light and dark modes

### Quick Migration Examples:
```tsx
// Before
className="text-blue-600 bg-gray-50 border-gray-200 shadow-md hover:bg-gray-100"

// After  
className="text-accent bg-muted border-border shadow-md hover:bg-muted/80"
```

This guide ensures consistency across the entire application and makes it easy to maintain and extend the design system.
