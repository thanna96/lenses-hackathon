let tailwindcss
let autoprefixer

try {
    tailwindcss = require('tailwindcss')
} catch (error) {
    tailwindcss = null
}

try {
    autoprefixer = require('autoprefixer')
} catch (error) {
    autoprefixer = null
}

module.exports = {
    plugins: [tailwindcss, autoprefixer].filter(Boolean),
}