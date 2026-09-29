/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F4EFE3', // Fondo papel crema
          surface: '#FBF8F1', // Superficies y tarjetas
          dark: '#141210',    // Fondo oscuro sobrio
          'dark-surface': '#1F1C18', // Superficie oscura
          border: '#E2D9CA', // Línea fina 1px
          line: '#DDD4C4',   // Línea separadora
          dim: '#EBE5D8',
        },
        ink: {
          DEFAULT: '#1F1D1A', // Texto tinta negra cálida
          muted: '#666159',   // Texto secundario
          faint: '#948D81',   // Metadatos y bordes secundarios
          light: '#EDE6DA',   // Texto tinta en fondo oscuro
          'light-muted': '#9E9689',
        },
        forest: {
          DEFAULT: '#2E4A36', // Verde bosque acento principal
          light: '#EDF3EE',   // Fondo acento suave
          hover: '#243B2B',
          dark: '#86A98F',
        },
        earth: {
          DEFAULT: '#8A4B2A', // Tierra (porcicultura)
          light: '#F8EFEA',
          hover: '#6E3A20',
          dark: '#D99675',
        },
        slate: {
          blue: '#3B5568',    // Azul pizarra (piscicultura)
          'blue-light': '#EDF2F5',
          'blue-hover': '#2C404E',
          'blue-dark': '#8EA8BA',
        },
        status: {
          green: '#2A6B3D',   // Semáforo óptimo
          amber: '#9C631B',   // Semáforo advertencia
          red: '#A32A26',     // Semáforo crítico
        }
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Libre Baskerville', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '5px',
        sm: '4px',
        md: '6px',
        lg: '8px',
      },
      borderWidth: {
        DEFAULT: '1px',
      }
    },
  },
  plugins: [],
}
