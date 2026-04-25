/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  important: true,
  theme: {
    gridTemplateColumns: {
      '1': 'repeat(1, 1fr)',
      '2': 'repeat(2, 1fr)',
      '4': 'repeat(4, 1fr)', // 4 columns for smaller screens
      '6': 'repeat(6, 1fr)', // 6 columns for sm breakpoint
      '8': 'repeat(8, 1fr)', // 8 columns for md breakpoint
      '12': 'repeat(12, 1fr)', // 12 columns for lg breakpoint and up
      '16': 'repeat(16, 1fr)', // 12 columns for lg breakpoint and up
      '30': 'repeat(30, 1fr)',
      // '30': 'repeat(30, minmax(0, 1fr))',
    },
    gridTemplateRows: {
      // '10': 'repeat(10, minmax(0, 1fr))',
      '10': 'repeat(10, 1fr)',
      '16': 'repeat(16, 1fr)',
    },
    screens: {
      'mob-p': '250px',
      'mob-l': '480px',
      'tab-s': '768px',
      'tab-l': '992px',
      'scr-s': '1280px',
      'scr-m': '1440px',
      'scr-l': '1920px',
    },
    container: {
      center: true,
      screens: {
        'mob-p': '100%',
        'mob-l': '100%',
        'tab-s': '680px',
        'tab-l': '936px',
        'scr-s': '1128px',
        'scr-m': '1224px',
        'scr-l': '1600px',
      },
      padding: {
        DEFAULT: '24px',
        'tab-s': '0',
      },
    },
    fontFamily: {
      sans: ['Poppins', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'sans-serif'],
      poppins: ['Poppins', 'sans-serif'],
      headings: ['Grandstander', 'sans-serif'],
      titles: ['Grandstander', 'sans-serif'],
      body: ['Shantell Sans', 'sans-serif'],
    },
    fontSize: {
      '7xl': ['54px', '64px'],
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
      f1: '9px',
      f2: '10.5px',
      f3: '12px',
      f4: '15px',
      f5: '18px',
      f6: '21px',
      f7: '24px',
      f8: '30px',
      f9: '36px',
      f10: '42px',
      f11: '48px',
      f12: '57px',
      f13: '69px',
      f14: '81px',
      f15: '96px',
      'fd15': ['96px', '112px'],  // 1.2x leading for Display
      'fd14': ['81px', '88px'],
      'fd13': ['69px', '76px'],
      'fd12': ['57px', '64px'],
      'fd11': ['48px', '52px'],
      'fd10': ['42px', '48px'],
      'fd9': ['36px', '40px'],
      'fd8': ['30px', '36px'],
      'fd7': ['24px', '28px'],
      'fd6': ['21px', '24px'],
      'fd5': ['18px', '20px'],
      'ft15': ['96px', '128px'],  // 1.33x leading for Titles
      'ft14': ['81px', '108px'],
      'ft13': ['69px', '92px'],
      'ft12': ['57px', '76px'],
      'ft11': ['48px', '64px'],
      'ft10': ['42px', '56px'],
      'ft9': ['36px', '48px'],
      'ft8': ['30px', '40px'],
      'ft7': ['24px', '32px'],
      'ft6': ['21px', '28px'],
      'ft5': ['18px', '24px'],
      'ft4': ['15px', '20px'],
      'ft3': ['12px', '16px'],
      'ft2': ['10.5px', '16px'],
      'ft1': ['9px', '12px'],
      'fb7': ['24px', '36px'],  // 1.5x leading for Body
      'fb6': ['21px', '32px'],
      'fb5': ['18px', '28px'],
      'fb4': ['15px', '24px'],
      'fb3': ['12px', '20px'],
      'fb2': ['10.5px', '16px'],
      'fb1': ['9px', '12px'],
    },
    extend: {
      fontWeight: {
        'weight-400': 400,
        'weight-800': 800,
      },
      lineHeight: {
        'l1': '12px',
        'l1b': '16px',
        'l2': '16px',
        'l2b': '16px',
        'l3': '16px',

        'l3b': '20px',
        'l4': '20px',
        'l4b': '24px',

        'l5': '24px',
        'l5b': '28px',

        'l6': '28px',
        'l6d': '24px',
        'l6b': '32px',

        'l7': '32px',
        'l7d': '28px',
        'l7b': '36px',

        'l8': '40px',
        'l8d': '36px',

        'l9': '48px',
        'l9d': '44px',

        'l10': '56px',
        'l10d': '52px',

        'l11': '64px',
        'l11d': '56px',

        'l12': '76px',
        'l12d': '64px',

        'l13': '92px',
        'l13d': '80px',

        'l14': '108px',
        'l14d': '96px',

        'l15': '128px',
        'l15d': '112px',

      },
      gap: {
        4: '4px',
        8: '8px',
        16: '16px',
        20: '20px',
        24: '24px',
        28: '28px',
        32: '32px',
        48: '48px',
        64: '64px',
        80: '80px',
        120: '120px',
        160: '160px',
        200: '200px',
      },
      spacing: {
        8: '8px',
        16: '16px',
        20: '20px',
        24: '24px',
        32: '32px',
        40: '40px',
        44: '44px',
        48: '48px',
        56: '56px',
        64: '64px',
        76: '76px',
        80: '80px',
        108: '108px',
        120: '120px',
        128: '128px',
        160: '160px',
        200: '200px',
        'g0': '0px',
        'g0h': '4px',
        'g1': '8px',
        'g1h': '12px',
        'g2': '16px',
        'g2h': '20px',
        'g3': '24px',
        'g3h': '28px',
        'g4': '32px',
        'g4h': '36px',
        'g5': '30px',
        'g6': '48px',
        'g10': '80px',

      },
      borderRadius: {
        6: '6px',
        8: '8px',
        12: '12px',
        16: '16px',
        20: '20px',
        24: '24px',
        'rnd-l': '32px'
      },
      boxShadow: {
        level1: [
          '0px 4px 10px 0px rgba(15, 18, 2, 0.09)',
          '0px 1px 20px 0px rgba(15, 18, 2, 0.06)',
          '0px 2px 8px 0px rgba(15, 18, 2, 0.12)',
        ],
        level2: [
          '0px 4px 10px 0px rgba(20, 10, 51, 0.05)',
          '0px 1px 20px 0px rgba(20, 10, 51, 0.03)',
          '0px 2px 8px 0px rgba(20, 10, 51, 0.07)',
        ],
        level3: [
          '0px 6px 20px 0px rgba(20, 10, 51, 0.05)',
          '0px 1px 36px 0px rgba(20, 10, 51, 0.03)',
          '0px 3px 10px 0px rgba(20, 10, 51, 0.07)',
        ],
        level4: [
          '0px 8px 20px 0px rgba(20, 10, 51, 0.05)',
          '0px 3px 28px 0px rgba(20, 10, 51, 0.03)',
          '0px 5px 10px 0px rgba(20, 10, 51, 0.07)',
        ],
        level5: [
          '0px 16px 48px 0px rgba(20, 10, 51, 0.05)',
          '0px 6px 60px 0px rgba(20, 10, 51, 0.03)',
          '0px 8px 20px 0px rgba(20, 10, 51, 0.07)',
        ],
        level6: [
          '0px 24px 76px 0px rgba(20, 10, 51, 0.05)',
          '0px 9px 92px 0px rgba(20, 10, 51, 0.03)',
          '0px 11px 30px 0px rgba(20, 10, 51, 0.07)',
        ],
      },
      colors: {
        'brand-lighter': 'rgb(var(--brand-lighter) / var(--opacity-100))',
        'brand-main': 'rgb(var(--brand-main) / var(--opacity-100))',
        'brand-accent-1': 'rgb(var(--brand-accent-1) / var(--opacity-100))',
        'brand-accent-2': 'rgb(var(--brand-accent-2) / var(--opacity-100))',
        'light': 'rgb(var(--border-light) / var(--opacity-15))',
        'def': 'rgb(var(--border-light) / var(--opacity-25))',
        'srf-base': 'rgb(var(--surfaces-base) / var(--opacity-100))',
        lvl0: 'rgb(var(--surfaces-base) / var(--opacity-100))',
        lvl1: 'rgb(var(--surfaces-l1) / var(--opacity-85))',
        lvl2: 'rgb(var(--surfaces-l2) / var(--opacity-85))',
        lvl2a: 'rgb(var(--surfaces-l2a) / var(--opacity-85))',
        lvl3: 'rgb(var(--surfaces-l3) / var(--opacity-85))',
        lvl4: 'rgb(var(--surfaces-l4) / var(--opacity-85))',
        lvl5: 'rgb(var(--surfaces-l5) / var(--opacity-85))',
        lvlinvert: 'rgb(var(--surfaces-invert) / var(--opacity-85))',
        level1: 'rgb(var(--surfaces-l1))',
        "action-neutral": 'rgb(var(--action-neutral))',
        action: {
          primary: {
            default: 'rgb(var(--action-primary-default))',
            hover: 'rgb(var(--action-primary-hover))',
            focus: 'rgb(var(--action-primary-focus) / var(--text-alpha-pure))',
            disabled: 'rgb(var(--action-primary-disabled) / var(--text-alpha-pure))',
          },
          secondary: {
            hover: 'rgb(var(--action-secondary-hover) / var(--act-alpha-secondary-hover))',
            focus: 'rgb(var(--action-secondary-focus) / var(--act-alpha-secondary-focus))',
          },
          neutral: {
            default: 'rgb(var(--action-neutral-inactive) / var(--act-alpha-neutral-inactive))',
            disabled: 'rgb(var(--action-neutral-disabled) / var(--act-alpha-neutral-disabled))',
            filled: 'rgb(var(--action-neutral-disabled) / var(--act-alpha-neutral-disabled))',
          },
        },
      },
      textColor: {
        accent: 'rgb(var(--text-accent) / var(--text-alpha-accent))',
        max: 'rgb(var(--text-pure) / var(--text-alpha-pure))',
        high: 'rgb(var(--text-high) / var(--text-alpha-high))',
        medium: 'rgb(var(--text-medium) / var(--text-alpha-medium))',
        low: 'rgb(var(--text-low) / var(--text-alpha-low))',
        hi: 'rgb(var(--text-hi) / var(--opacity-90))',
        "action-default": 'rgb(var(--action-primary-default))',
        "action-neutral": 'rgb(var(--action-neutral))',
        "med": 'rgb(var(--surfaces-accent1base)/ var(--opacity-72))',
        invert: {
          accent: 'rgb(var(--text-invert-accent) / var(--text-alpha-invert-accent))',
          high: 'rgb(var(--text-invert-high) / var(--text-alpha-invert-high))',
          medium: 'rgb(var(--text-invert-medium) / var(--text-alpha-invert-medium))',
          hi: 'rgb(var(--text-hi) / var(--opacity-87))'
        },

      },
    },
  },
  plugins: [
    function ({ addComponents }) {
      addComponents({
        '.btn': {
          '@apply w-fit flex flex-row place-items-center': '',
          transition: 'background-color 0.3s ease-in',
          transition: 'text-color 0.3s ease-in',
          transition: 'padding 0.3s ease-in',
          '&:hover': {
            transition: 'background-color 0.15s ease-in',
          },
          '&:focus': {
            transition: 'background-color 0.15s ease-in',
          },
        },

        '.btn > .icon': {
          transition: 'background-color 0.3s ease-in',
          '&:hover': {
            transition: 'background-color 0.15s ease-in',
          },
        },

        '.btn-40': {
          '@apply h-40 px-32 gap-4 label-default rounded-16': '',
        },

        '.btn-48': {
          '@apply h-48 px-32 gap-8 label-big rounded-20': '',
        },

        '.btn-tight': {
          '@apply px-0': '',
          '&:hover': {
            '@apply px-32': '',
          },
          '&:focus': {
            '@apply px-32': '',
          },
        },

        '.btn-primary': {
          '@apply shadow-level2 bg-action-primary-default text-invert-high': '',
          '&:hover': {
            '@apply bg-action-primary-hover shadow-level4': '',
          },
          '&:focus': {
            '@apply bg-action-primary-focus shadow-level4': '',
          },
          '&:disabled': {
            '@apply bg-action-primary-disabled text-invert-medium': '',
          },
        },

        '.btn-secondary': {
          '@apply text-accent border-2 border-action-primary-default': '',
          '&:hover': {
            '@apply bg-action-secondary-hover': '',
          },
          '&:focus': {
            '@apply bg-action-secondary-hover shadow-level4': '',
          },
        },

        '.btn-tertiary': {
          '@apply text-accent': '',
          '&:hover': {
            '@apply bg-action-secondary-hover text-high': '',
          },
          '&:focus': {
            '@apply bg-action-secondary-focus text-medium': '',
          },
        },

        '.btn-primary-dark': {
          '@apply py-2 px-8 rounded-1616 shadow-level2 bg-invert-action-primary-default text-high': '',
          '&:hover': {
            '@apply bg-invert-action-primary-hover shadow-level4': '',
          },
        },

        '.btn-tertiary.btn-tight': {
          '@apply text-accent': '',
        },

        '.act': {
          '@apply flex items-center justify-center': '',
        },
        '.act-24': {
          '@apply h-24 w-24': '',
        },
        '.act-32': {
          '@apply h-32 w-32 rounded-6': '',
        },
        '.act-40': {
          '@apply h-40 w-40 rounded-8': '',
        },
        '.act-48': {
          '@apply h-48 w-48 rounded-12': '',
        },
        '.act-round': {
          '@apply rounded-full': '',
        },
        '.act-tertiary': {
          '@apply bg-none hover:bg-action-secondary-hover': '',
        },

        '.container-fluid': {
          '@apply w-full px-16 tab-s:px-24 scr-s:px-32': '',
        },

        '.display-1': {
          '@apply text-3xl font-bold': '',
          '@media (min-width: 992px) and (max-width: 1919px)': {
            '@apply text-5xl font-bold': '',
          },
          '@media (min-width: 1920px)': {
            '@apply text-6xl font-bold': '',
            letterSpacing: '-0.5px',
          },
        },

        '.display-2': {
          '@apply text-4xl font-bold': '',
          '@media (min-width: 992px) and (max-width: 1919px)': {
            '@apply text-6xl font-bold': '',
          },
          '@media (min-width: 1920px)': {
            '@apply text-7xl font-bold': '',
            letterSpacing: '-0.5px',
          },
        },
        '.body-dg': {
          '@apply text-fb4 tab-s:text-fb5 tab-l:text-fb5 scr-s:text-fb5 scr-m:text-fb7 scr-l:text-ft8 font-weight-400': '',
        },
        '.body-dg': {
          '@apply text-fb4 tab-s:text-fb5 tab-l:text-fb5 scr-s:text-fb5 scr-m:text-fb7 scr-l:text-ft8 font-weight-400': '',
        },
        '.body-l': {
          '@apply text-f5 leading-l5b scr-l:text-f10 scr-l:leading-l10 font-weight-400': '',
        },
        '.body-m': {
          '@apply text-f4 leading-l4b font-weight-400': '',
        },
        '.body-s': {
          '@apply text-f3 leading-l3b font-weight-400': '',
        },
        '.body-t': {
          '@apply text-f1 leading-l1b font-weight-400': '',
        },
        '.title-s': {
          '@apply text-f4 mob-l:text-f5 scr-l:text-f6': '',
        },
        '.gap-default': {
          '@apply gap-16 tab-s:gap-24 scr-l:gap-32': '',
        },
        '.h1': {
          '@apply text-f8 mob-p:text-f6 mob-l:text-f8 tab-s:text-f9 scr-s:text-f10 scr-l:text-f11': '',
        },
        '.h2': {
          '@apply text-f7 mob-p:text-f5 mob-l:text-f7 tab-s:text-f8 scr-s:text-f9 scr-l:text-f10': '',
        },
        '.h3': {
          '@apply text-f6 mob-p:text-f5 mob-l:text-f6 tab-s:text-f7 scr-s:text-f8 scr-l:text-f9': '',
        },
        '.px-l': {
          '@apply px-g4': '',
        },
        '.py-l': {
          '@apply py-g5': '',
        },
        // 'h1': {
        //   '@apply text-3xl font-bold': '',
        //   '@media (min-width: 992px) and (max-width: 1919px)': {
        //     '@apply text-5xl font-bold': '',
        //   },
        //   '@media (min-width: 1920px)': {
        //     '@apply text-6xl font-bold': '',
        //     letterSpacing: '-0.25px',
        //   },
        // },
        // 'mob-p': '250px',
        // 'mob-l': '480px',
        // 'tab-s': '768px',
        // 'tab-l': '992px',
        // 'scr-s': '1280px',
        // 'scr-m': '1440px',
        // 'scr-l': '1920px',
        // 'h2': {
        //   '@apply text-2xl font-bold': '',
        //   '@media (min-width: 992px) and (max-width: 1919px)': {
        //     '@apply text-4xl font-bold': '',
        //   },
        //   '@media (min-width: 1920px)': {
        //     '@apply text-5xl font-bold': '',
        //   },
        // },

        'h3': {
          '@apply text-xl font-semibold': '',
          letterSpacing: '0.1px',
          '@media (min-width: 992px) and (max-width: 1919px)': {
            '@apply text-2xl font-semibold': '',
          },
          '@media (min-width: 1920px)': {
            '@apply text-3xl font-semibold': '',
            letterSpacing: '0.1px',
          },
        },

        'h4': {
          '@apply text-lg font-semibold': '',
          lineHeight: '24px',
          letterSpacing: '0.1px',
          '@media (min-width: 1920px)': {
            '@apply text-xl font-semibold': '',
          },
        },

        'h5': {
          '@apply text-base20 font-semibold': '',
          letterSpacing: '0.2px',
        },

        '.plarge': {
          '@apply text-lg font-medium': '',
          letterSpacing: '0.1px',
        },

        '.plarge-b': {
          '@apply text-lg font-semibold': '',
          letterSpacing: '0.2px',
        },

        '.pregular': {
          '@apply text-base font-medium': '',
          letterSpacing: '0.25px',
        },

        '.pregular-b': {
          '@apply text-base font-bold': '',
          letterSpacing: '0.25px',
        },

        '.psmall': {
          '@apply text-sm font-medium': '',
          letterSpacing: '0.25px',
        },

        '.psmall-b': {
          '@apply text-sm font-bold': '',
          letterSpacing: '0.25px',
        },

        '.psmaller': {
          '@apply text-xs font-medium': '',
          letterSpacing: '0.25px',
        },

        '.psmaller-b': {
          '@apply text-xs font-bold': '',
          letterSpacing: '0.25px',
        },

        '.poverdefault': {
          '@apply text-xs font-semibold': '',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        },

        '.poverlarge': {
          '@apply text-base font-semibold': '',
          lineHeight: '20px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        },

        '.label-default': {
          '@apply text-sm font-semibold': '',
          lineHeight: '24px',
          letterSpacing: '.25px',
        },

        '.label-big': {
          '@apply text-lg24 font-semibold': '',
          lineHeight: '32px',
          letterSpacing: '.25px',
        },

        '.text_label_small_underline': {
          '@apply text-sm leading-6 underline font-semibold': '',
          letterSpacing: '0.25px',
        },

        '.text_label_big_underline': {
          '@apply text-lg24 leading-8 underline font-semibold': '',
          letterSpacing: '0.15px',
        },
      });
    },
  ],
};