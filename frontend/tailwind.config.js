/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: '#0A1F3D',
          950: '#050D1A',
          900: '#0A1F3D',
          800: '#122B52',
          700: '#1A3A6B',
        },
        teal: {
          DEFAULT: '#0FBFA6',
          400: '#3FD8C1',
          500: '#0FBFA6',
          600: '#0B9C87',
        },
        sunset: {
          DEFAULT: '#FF7A45',
          400: '#FF9566',
          500: '#FF7A45',
          600: '#E8602D',
        },
        sand: {
          50: '#FBF8F2',
          100: '#F5EFE3',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      backgroundImage: {
        'compass-grid': "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(10, 31, 61, 0.25)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
      },
    },
  },
  plugins: [],
};
