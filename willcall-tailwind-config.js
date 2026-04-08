// willcall Tailwind config extension
// Source of truth: Figma file jZtDnaWiMojrTzcHC1ikCv
// Drop this into your tailwind.config.js or tailwind.config.ts

const willcallConfig = {
  theme: {
    extend: {
      colors: {
        wc: {
          // Base palette (from Figma variables)
          black: '#1F1E1D',
          'near-black': '#2C2928',
          white: '#FFFFFF',
          cream: '#F5F3EE',
          gray: {
            100: '#F0EDE7',
            200: '#E5E2DB',
            300: '#D1CEC7',
            400: '#A8A49C',
            500: '#706B65',
            600: '#5C5955',
          },

          // Profile colors (user-selectable)
          profile: {
            cream: '#F5F3EE',
            yellow: '#EEE9B1',
            pink: '#FC98BC',
            lavender: '#D5D6EB',
            orange: '#FC6C2E',
            blue: '#7ABFE8',
            gray: '#A5A49F',
            green: '#A8C9AA',
          },

          // Functional
          error: '#FC6C2E',
          success: '#4CAF50',
        },
      },

      // Semantic background colors with opacity
      backgroundColor: {
        'wc-card': 'rgba(255, 255, 255, 0.8)',
        'wc-input': 'rgba(255, 255, 255, 0.6)',
        'wc-add': 'rgba(26, 26, 26, 0.08)',
        'wc-add-hover': 'rgba(26, 26, 26, 0.14)',
      },

      // Semantic border colors with opacity
      borderColor: {
        'wc-default': 'rgba(0, 0, 0, 0.08)',
        'wc-card': 'rgba(0, 0, 0, 0.06)',
      },

      fontFamily: {
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        'wc-xs': ['0.6875rem', { lineHeight: '1.3' }],   // 11px — labels
        'wc-caption': ['0.75rem', { lineHeight: '1.4' }], // 12px — dates, meta
        'wc-sm': ['0.875rem', { lineHeight: '1.4' }],     // 14px — buttons, body small
        'wc-base': ['1rem', { lineHeight: '1.5' }],       // 16px — body default
        'wc-lg': ['1.125rem', { lineHeight: '1.4' }],     // 18px — body large
        'wc-xl': ['1.25rem', { lineHeight: '1.3' }],      // 20px — section headers
        'wc-2xl': ['1.5rem', { lineHeight: '1.1' }],      // 24px — stat values
        'wc-3xl': ['1.875rem', { lineHeight: '1.2' }],    // 30px — page titles
      },

      borderRadius: {
        DEFAULT: '4px',   // THE one radius — use `rounded` class
        'none': '0px',    // For inputs (invisible field has no radius)
      },

      spacing: {
        'wc-1': '0.25rem',  // 4px
        'wc-2': '0.5rem',   // 8px
        'wc-3': '0.75rem',  // 12px
        'wc-4': '1rem',     // 16px
        'wc-5': '1.25rem',  // 20px
        'wc-6': '1.5rem',   // 24px
        'wc-8': '2rem',     // 32px
        'wc-10': '2.5rem',  // 40px
        'wc-12': '3rem',    // 48px
        'wc-16': '4rem',    // 64px
      },

      boxShadow: {
        'wc-fab': '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
        'wc-tab': '0 1px 3px rgba(0, 0, 0, 0.08)',
      },
    },
  },
};

module.exports = willcallConfig;
