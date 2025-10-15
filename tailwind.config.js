/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#6366f1',
                },
                accent: {
                    DEFAULT: '#22d3ee',
                },
                'risk-high': '#f87171',
                'risk-medium': '#facc15',
                'risk-low': '#34d399',
            },
            fontFamily: {
                sans: ['Inter', 'Roboto', 'ui-sans-serif', 'system-ui'],
            },
        },
    },
    plugins: [],
}