import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080808',
        surface: '#111111',
        surface2: '#181818',
        surface3: '#222222',
        border: '#2A2A2A',
        primary: {
          DEFAULT: '#DC2626',
          light: '#EF4444',
          dark: '#991B1B',
          bg: '#1A0505',
          border: '#3D0000',
        },
        success: {
          DEFAULT: '#22C55E',
          bg: '#071A0E',
          border: '#14532D',
        },
        warning: '#F59E0B',
        muted: '#555555',
        secondary: '#A0A0A0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
