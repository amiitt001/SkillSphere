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
                // Background
                void: '#0a0a0a',
                deep: '#121212',
                warm: '#1c1c1c',

                // Accents — Earth tones
                teal: { DEFAULT: '#ffffff', dark: '#d4d4d4' },
                terra: { DEFAULT: '#ffffff', dark: '#d4d4d4' },
                amber: { DEFAULT: '#e5e5e5', dark: '#a3a3a3' },
                sage: { DEFAULT: '#a3a3a3', dark: '#737373' },
                cyan: { DEFAULT: '#e5e5e5', dark: '#a3a3a3' },
                gold: { DEFAULT: '#e5e5e5', dark: '#a3a3a3' },
                rose: { DEFAULT: '#ef4444', dark: '#dc2626' },
                clay: { DEFAULT: '#737373', dark: '#525252' },

                // Text
                primary: '#fafafa',
                secondary: '#a3a3a3',
                dim: '#525252',

                // Card
                card: 'rgba(18, 18, 18, 0.88)',
            },

            fontFamily: {
                display: ['Space Grotesk', 'system-ui', 'sans-serif'],
                body: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },

            fontSize: {
                'hero-lg': 'clamp(3rem, 7vw, 5.5rem)',
                'hero-sm': 'clamp(2rem, 4vw, 3rem)',
            },

            borderRadius: {
                'radius': '16px',
                'card': '16px',
                'sm': '10px',
                'xs': '6px',
            },

            boxShadow: {
                'glow-teal': '0 0 40px rgba(255, 255, 255, 0.08)',
                'glow-terra': '0 0 40px rgba(255, 255, 255, 0.08)',
                'glow-teal-lg': '0 0 60px rgba(255, 255, 255, 0.15)',
                'glow-amber': '0 0 40px rgba(255, 255, 255, 0.05)',
                'glow-sage': '0 0 40px rgba(255, 255, 255, 0.05)',
                'glow-cyan': '0 0 60px rgba(255, 255, 255, 0.05)',
                'glow-gold': '0 0 40px rgba(255, 255, 255, 0.05)',
            },

            backgroundImage: {
                'gradient-brand': 'linear-gradient(135deg, #ffffff, #e5e5e5)',
                'gradient-hero': 'linear-gradient(135deg, #ffffff, #e5e5e5, #a3a3a3)',
                'gradient-card': 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                'bg-grid': `linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)`,
            },

            backgroundSize: {
                'grid': '80px 80px',
            },

            animation: {
                'fade-up': 'fade-up 0.6s ease both',
                'fade-in': 'fade-in 0.4s ease both',
                'orb-drift': 'orb-drift 25s ease-in-out infinite',
                'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
                'shimmer': 'shimmer 1.5s infinite',
                'tag-pop': 'tag-pop 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            },

            keyframes: {
                'fade-up': {
                    from: { opacity: '0', transform: 'translateY(24px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'orb-drift': {
                    '0%, 100%': { transform: 'translate(0,0) scale(1)' },
                    '33%': { transform: 'translate(30px,-40px) scale(1.05)' },
                    '66%': { transform: 'translate(-20px,30px) scale(0.97)' },
                },
                'pulse-dot': {
                    '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(255,255,255,0.4)' },
                    '50%': { opacity: '0.7', boxShadow: '0 0 0 4px rgba(255,255,255,0)' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                'tag-pop': {
                    from: { transform: 'scale(0.7)', opacity: '0' },
                    to: { transform: 'scale(1)', opacity: '1' },
                },
            },

            backdropBlur: {
                nav: '24px',
                card: '16px',
                modal: '24px',
            },
        },
    },
    plugins: [],
}
