/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#A855F7", // Purple-500
                secondary: "#EAB308", // Yellow-500
                surface: "#1F2937", // Gray-800
                background: "#111827", // Gray-900
                text: "#F9FAFB", // Gray-50
            }
        },
    },
    plugins: [],
}
