/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0f7f2',
          100: '#dbeee0',
          200: '#badbc2',
          300: '#8ec19a',
          400: '#5da26f',
          500: '#3d8450',
          600: '#2d6a3e',
          700: '#255433',
          800: '#1e4620',
          900: '#1b4332',
          950: '#0c2217',
        },
        sage: {
          50: '#f6f8f6',
          100: '#e8f0e9',
          200: '#d3e2d5',
          300: '#b1ccb5',
          400: '#89b090',
          500: '#689470',
        },
        surface: {
          DEFAULT: '#ffffff',
          warm: '#f8faf7',
          card: '#ffffff',
          subtle: '#f1f5f1'
        },
        charcoal: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#0b0f17',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 1px 2px 0 rgba(16, 37, 24, 0.05)',
        'soft': '0 4px 12px -2px rgba(16, 37, 24, 0.08), 0 2px 6px -1px rgba(16, 37, 24, 0.04)',
        'soft-lg': '0 10px 25px -3px rgba(16, 37, 24, 0.1), 0 4px 10px -2px rgba(16, 37, 24, 0.04)',
        'soft-xl': '0 20px 30px -4px rgba(16, 37, 24, 0.12), 0 8px 12px -3px rgba(16, 37, 24, 0.06)',
      }
    },
  },
  plugins: [],
}
