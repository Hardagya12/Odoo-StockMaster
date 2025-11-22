/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                neo: {
                    yellow: '#FFDE00', // Vibrant yellow from example
                    pink: '#FF0080',   // Hot pink
                    green: '#00FF94',  // Bright green
                    blue: '#00BCFF',   // Cyan blue
                    black: '#121212',  // Dark background
                    white: '#FFFFFF',
                    offwhite: '#FDFBF7'
                }
            },
            boxShadow: {
                'neo': '5px 5px 0px 0px #000000',
                'neo-sm': '3px 3px 0px 0px #000000',
                'neo-lg': '8px 8px 0px 0px #000000',
                'neo-xl': '12px 12px 0px 0px #000000',
            },
            fontFamily: {
                sans: ['"Space Grotesk"', 'sans-serif'],
            },
            borderRadius: {
                'neo': '12px',
            },
            borderWidth: {
                '3': '3px',
            }
        },
    },
    plugins: [],
}
