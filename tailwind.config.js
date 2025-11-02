/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}', // Or your specific pages/components
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // Add Ant Design's dist path if necessary, but usually Next.js handles it.
    // You might need to configure PostCSS to import Ant Design CSS properly.
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // To prevent conflicts, you might need to prefix Tailwind classes
  // or use important: true with a selector, but try without first.
  // corePlugins: {
  //   preflight: false, // Disables Tailwind's base styles to avoid conflicts
  // },
}