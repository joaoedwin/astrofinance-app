"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LoginPage;
const login_form_1 = require("@/components/auth/login-form");
function LoginPage() {
    return (<div className="flex min-h-screen items-center justify-center">
      <login_form_1.LoginForm />
    </div>);
}
