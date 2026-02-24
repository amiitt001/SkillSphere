/** @type {import('tailwindcss').Config} */
// Drop this into: frontend/tailwind.config.ts

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
                void: '#03040a',
                deep: '#070b14',

                // Accents
                teal: { DEFAULT: '#00e5c3', dark: '#00b89e' },
                cyan: { DEFAULT: '#0af0ff', dark: '#07c8d4' },
                gold: { DEFAULT: '#f5c842', dark: '#d4a92a' },
                rose: { DEFAULT: '#ff5fa0', dark: '#cc3f7e' },

                // Text
                primary: '#e8f0ff',
                secondary: '#7a90b8',
                dim: '#3d4f6e',

                // Card
                card: 'rgba(11, 18, 35, 0.85)',
            },

            fontFamily: {
                display: ['Playfair Display', 'Georgia', 'serif'],
                body: ['DM Sans', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },

            fontSize: {
                'hero-lg': 'clamp(3rem, 7vw, 6.5rem)',
                'hero-sm': 'clamp(2rem, 4vw, 3rem)',
            },

            borderRadius: {
                'radius': '16px',
                'card': '16px',
                'sm': '10px',
                'xs': '6px',
            },

            boxShadow: {
                'glow-teal': '0 0 40px rgba(0, 229, 195, 0.20)',
                'glow-teal-lg': '0 0 60px rgba(0, 229, 195, 0.30)',
                'glow-cyan': '0 0 60px rgba(10, 240, 255, 0.15)',
                'glow-gold': '0 0 40px rgba(245, 200, 66, 0.20)',
            },

            backgroundImage: {
                'gradient-brand': 'linear-gradient(135deg, #00e5c3, #0af0ff)',
                'gradient-hero': 'linear-gradient(90deg, #00e5c3 0%, #0af0ff 50%, #f5c842 100%)',
                'gradient-card': 'linear-gradient(135deg, rgba(0,229,195,0.07), rgba(10,240,255,0.03))',
                'bg-grid': `linear-gradient(rgba(0,229,195,0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,229,195,0.03) 1px, transparent 1px)`,
            },

            backgroundSize: {
                'grid': '60px 60px',
            },

            animation: {
                'fade-up': 'fade-up 0.6s ease both',
                'fade-in': 'fade-in 0.4s ease both',
                'orb-drift': 'orb-drift 20s ease-in-out infinite',
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
                    '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(0,229,195,0.6)' },
                    '50%': { opacity: '0.7', boxShadow: '0 0 0 4px rgba(0,229,195,0)' },
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
