/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'saathi-teal': '#0F5F5C',
        'saathi-teal-dark': '#0C4E4B',
        'saathi-teal-light': '#147975',
        'saathi-mint': '#E8F2F1',
        'saathi-mint-light': '#F4F9F8',
        'saathi-slate': '#1B2B2A',
        'saathi-slate-muted': '#4B6361',
        'saathi-amber': '#FFF1D6',
        'saathi-amber-dark': '#8A5D00',
        'saathi-green': '#2E7D5B',
        'saathi-green-light': '#E9F5EF',
        'saathi-border': '#D0E3E1',
      },
      borderRadius: {
        'card': '16px',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
