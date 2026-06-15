/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./generators/**/*.js', './assets/**/*.js'],
  theme: {
    extend: {
      colors: {
        bg: '#07111F',
        card: '#0B1A2E',
        'card-border': '#132743'
      }
    }
  },
  plugins: []
}
