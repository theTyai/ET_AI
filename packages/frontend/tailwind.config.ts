import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "outline-variant": "#45474c",
        "secondary": "#ffb95f",
        "on-surface-variant": "#c5c6cd",
        "error-container": "#93000a",
        "tertiary-container": "#20283c",
        "on-background": "#d3e4fe",
        "tertiary-fixed-dim": "#bec6e0",
        "surface-container-highest": "#26364a",
        "on-secondary-fixed-variant": "#653e00",
        "primary": "#bcc7de",
        "on-tertiary": "#283044",
        "primary-fixed": "#d8e3fb",
        "surface-container-high": "#1b2b3f",
        "surface-dim": "#031427",
        "secondary-fixed": "#ffddb8",
        "secondary-fixed-dim": "#ffb95f",
        "primary-container": "#1e293b",
        "surface-bright": "#2a3a4f",
        "background": "#031427",
        "on-tertiary-fixed-variant": "#3f465c",
        "surface-container-lowest": "#000f21",
        "on-primary-container": "#8590a6",
        "surface-container-low": "#0b1c30",
        "on-secondary": "#472a00",
        "surface-tint": "#bcc7de",
        "inverse-on-surface": "#213145",
        "on-error-container": "#ffdad6",
        "surface-variant": "#26364a",
        "error": "#ffb4ab",
        "secondary-container": "#ee9800",
        "tertiary": "#bec6e0",
        "on-tertiary-fixed": "#131b2e",
        "inverse-primary": "#545f73",
        "on-error": "#690005",
        "on-tertiary-container": "#888fa7",
        "tertiary-fixed": "#dae2fd",
        "outline": "#8f9097",
        "on-primary-fixed": "#111c2d",
        "primary-fixed-dim": "#bcc7de",
        "on-secondary-fixed": "#2a1700",
        "on-secondary-container": "#5b3800",
        "on-surface": "#d3e4fe",
        "surface-container": "#102034",
        "inverse-surface": "#d3e4fe",
        "on-primary": "#263143",
        "surface": "#031427",
        "on-primary-fixed-variant": "#3c475a",
        industrial: {
          bg: '#0F172A',
          surface: '#1E293B',
          border: '#334155',
          accent: '#0EA5E9',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          muted: '#64748B'
        }
      },
      spacing: {
        "margin-desktop": "24px",
        "sidebar-width": "260px",
        "header-height": "64px",
        "gutter": "16px",
        "unit": "4px",
        "margin-mobile": "16px"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        "display-lg": ["Inter", "sans-serif"],
        "headline-md": ["Inter", "sans-serif"],
        "body-sm": ["Inter", "sans-serif"],
        "body-md": ["Inter", "sans-serif"],
        "code-md": ["JetBrains Mono", "monospace"],
        "headline-lg": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "tag-xs": ["JetBrains Mono", "monospace"]
      },
      fontSize: {
        "display-lg": ["48px", { "lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "headline-md": ["24px", { "lineHeight": "32px", "fontWeight": "600" }],
        "body-sm": ["12px", { "lineHeight": "16px", "fontWeight": "400" }],
        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
        "code-md": ["14px", { "lineHeight": "20px", "fontWeight": "500" }],
        "headline-lg": ["32px", { "lineHeight": "40px", "fontWeight": "600" }],
        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "tag-xs": ["10px", { "lineHeight": "12px", "fontWeight": "700" }]
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [typography],
};

export default config;
