/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // false or 'media' or 'class'
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      // small upto 991
      'sm-mods': { max: '991px' },
      sm1: { min: '250px', max: '479px' },
      sm2: { min: '480px', max: '767px' },
      sm3: { min: '768px', max: '991px' },

      //991 upto 1919

      'md-mods': { min: '992px', max: '1919px' },
      md1: { min: '992px', max: '1279px' },
      md2: { min: '1280px', max: '1439px' },
      md3: { min: '1440px', max: '1919px' },

      //1920
      'lg-mods': { min: '1920px' },
    },
    fontSize: {
      '6xl': ['48px', '56px'],
      '5xl': ['36px', '44px'],
      '4xl': ['30px', '36px'],
      '3xl': ['27px', '32px'],
      '2xl': ['24px', '28px'],
      xl: ['21px', '28px'],
      lg: ['18px', '28px'],
      lg24: ['18px', '24px'],
      base20: ['15px', '20px'],
      base: ['15px', '24px'],
      sm: ['12px', '20px'],
      xs: ['9px', '16px'],
    },
    extend: {
      gap: {
        16: '16px',
        24: '24px',
        32: '32px',
      },
      colors: {
        gray: {
          100: '#f7fafc',
          200: '#edf2f7',
          300: '#e2e8f0',
          400: '#cbd5e0',
          500: '#a0aec0',
          600: '#718096',
          700: '#4a5568',
          800: '#2d3748',
          900: '#1a202c',
          1000: 'rgba(46, 46, 46, 0.3)',
        },
        blue: {
          100: '#ebf8ff',
          200: '#bee3f8',
          300: '#90cdf4',
          400: '#63b3ed',
          500: '#4299e1',
          600: '#3182ce',
          700: '#2b6cb0',
          800: '#2c5282',
          900: '#2a4365',
        },
        purple: {
          100: '#1D00B2',
          200: '#150080',
        },
        black: {
          100: 'rgba(79, 76, 89, 1)',
        },
      },
    },
  },
  plugins: [],
};
