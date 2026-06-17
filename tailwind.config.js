export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                ink: '#0A102A',
                mist: '#BBDEF1',
                lemon: '#FFEE5E',
                aqua: '#01A5A6',
                snow: '#FAFAFA',
                success: '#10B981',
                warning: '#F59E0B',
                error: '#EF4444'
            },
            fontFamily: {
                display: ['"Tektur"', 'sans-serif'],
                body: ['"Roboto"', 'sans-serif']
            },
            boxShadow: {
                glass: '0 24px 80px rgba(3, 9, 31, 0.38)'
            },
            backgroundImage: {
                'hero-grid': 'linear-gradient(rgba(187,222,241,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(187,222,241,0.08) 1px, transparent 1px)'
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px) rotate(3deg)' },
                    '50%': { transform: 'translateY(-10px) rotate(3deg)' }
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' }
                }
            },
            animation: {
                float: 'float 6s ease-in-out infinite',
                shimmer: 'shimmer 2s linear infinite'
            }
        }
    },
    plugins: []
};