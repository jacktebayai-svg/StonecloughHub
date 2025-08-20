import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        // Stoneclough Brand Color System
        stoneclough: {
          blue: {
            50: 'var(--stoneclough-blue-50)',
            100: 'var(--stoneclough-blue-100)',
            200: 'var(--stoneclough-blue-200)',
            300: 'var(--stoneclough-blue-300)',
            400: 'var(--stoneclough-blue-400)',
            500: 'var(--stoneclough-blue-500)',
            600: 'var(--stoneclough-blue-600)',
            700: 'var(--stoneclough-blue-700)',
            800: 'var(--stoneclough-blue-800)',
            900: 'var(--stoneclough-blue-900)',
            DEFAULT: 'var(--stoneclough-blue-800)',
          },
          gray: {
            50: 'var(--stoneclough-gray-50)',
            100: 'var(--stoneclough-gray-100)',
            200: 'var(--stoneclough-gray-200)',
            300: 'var(--stoneclough-gray-300)',
            400: 'var(--stoneclough-gray-400)',
            500: 'var(--stoneclough-gray-500)',
            600: 'var(--stoneclough-gray-600)',
            700: 'var(--stoneclough-gray-700)',
            800: 'var(--stoneclough-gray-800)',
            900: 'var(--stoneclough-gray-900)',
            DEFAULT: 'var(--stoneclough-gray-600)',
          },
          accent: {
            orange: 'var(--stoneclough-accent-orange)',
            yellow: 'var(--stoneclough-accent-yellow)',
            green: 'var(--stoneclough-accent-green)',
            red: 'var(--stoneclough-accent-red)',
          },
        },
        // Legacy color support - deprecated, use stoneclough object instead
        'stoneclough-blue': 'var(--stoneclough-blue-800)',
        'stoneclough-light': 'var(--stoneclough-blue-50)',
        'stoneclough-brown': 'var(--stoneclough-gray-600)',
        'stoneclough-gray-blue': 'var(--stoneclough-gray-600)',
        'stoneclough-orange': 'var(--stoneclough-accent-orange)',
        'stoneclough-yellow': 'var(--stoneclough-accent-yellow)',
        
        // Community semantic colors
        'community': {
          success: 'var(--stoneclough-accent-green)',
          warning: 'var(--stoneclough-accent-orange)',
          highlight: 'var(--stoneclough-accent-yellow)',
          error: 'var(--stoneclough-accent-red)',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
            transform: "translateY(20px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-in": {
          from: {
            transform: "translateX(-100%)",
          },
          to: {
            transform: "translateX(0)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
      boxShadow: {
        "2xs": "var(--shadow-2xs)",
        "xs": "var(--shadow-xs)",
        "sm": "var(--shadow-sm)",
        "DEFAULT": "var(--shadow)",
        "md": "var(--shadow-md)",
        "lg": "var(--shadow-lg)",
        "xl": "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
