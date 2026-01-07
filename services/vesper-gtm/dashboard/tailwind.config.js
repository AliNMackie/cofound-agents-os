/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#000000',
          secondary: '#FFFFFF',
          background: '#F5F5F5',
          surface: '#FFFFFF',
          text: {
            primary: '#1a1a1a',
            secondary: '#6B7280',
          },
          border: '#E5E5E5',
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', 'sans-serif'],
      },
      borderRadius: {
        'lg': '8px',
        'xl': '12px',
      },
    },
  },
  plugins: [],
}
