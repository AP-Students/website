import { type Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  content: ["./src/**/*.tsx"],
  theme: {
    screens: {
      ...defaultTheme.screens,
      '3xl': '1919px',
    },
    boxShadow: {
      DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      button: '0 3px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        lg: '17px',
      },
      colors: {
        primary: '#000',
        'primary-dark': "#FFF",
        secondary: '#000',
        'secondary-dark': "#FFF",
        tertiary: '#000',
        'tertiary-dark': "#FFF",
        link: '#000',
        'link-dark': '#FFF',
      }
    },
  },
  plugins: [],
  darkMode: 'selector',
} satisfies Config;
