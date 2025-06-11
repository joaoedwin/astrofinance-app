"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const react_1 = __importDefault(require("react"));
const google_1 = require("next/font/google");
require("./globals.css");
const theme_provider_1 = require("@/components/theme-provider");
const toaster_1 = require("@/components/ui/toaster");
const auth_context_1 = require("@/contexts/auth-context");
const inter = (0, google_1.Inter)({ subsets: ["latin"] });
exports.metadata = {
    title: "FinanceTrack - Controle Financeiro Pessoal",
    description: "Aplicativo de controle financeiro pessoal",
    generator: 'v0.dev'
};
function RootLayout({ children }) {
    return (<html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
          <auth_context_1.AuthProvider>
            <theme_provider_1.ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
              {children}
              <toaster_1.Toaster />
            </theme_provider_1.ThemeProvider>
          </auth_context_1.AuthProvider>
      </body>
    </html>);
}
