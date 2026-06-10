/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hidratec: {
          primary: '#F2C12E',    // El Amarillo corporativo de tu logo
          secondary: '#D92525',  // El Rojo de la letra "A"
          dark: '#1A1A1A',       // Negro/Gris muy oscuro para textos y menús
          light: '#F8F9FA',      // Fondo gris clarito para que resalte el contenido
          border: '#E5E7EB'      // Líneas divisorias sutiles
        }
      }
    },
  },
  plugins: [],
}