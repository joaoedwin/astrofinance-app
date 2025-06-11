"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeProvider = ThemeProvider;
const next_themes_1 = require("next-themes");
function ThemeProvider({ children, ...props }) {
    return <next_themes_1.ThemeProvider {...props}>{children}</next_themes_1.ThemeProvider>;
}
