"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DashboardLayout;
const react_1 = require("react");
const sidebar_1 = __importDefault(require("@/components/sidebar"));
const auth_context_1 = require("@/contexts/auth-context");
function DashboardLayout({ children, }) {
    const [sidebarOpen, setSidebarOpen] = (0, react_1.useState)(true);
    return (<auth_context_1.AuthProvider>
      <div className="flex h-screen overflow-hidden">
        <sidebar_1.default open={sidebarOpen} setOpen={setSidebarOpen}/>
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </auth_context_1.AuthProvider>);
}
