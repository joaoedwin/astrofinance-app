"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InvoicePage;
const monthly_invoice_1 = require("@/components/installments/monthly-invoice");
const how_it_works_modal_1 = require("@/components/installments/how-it-works-modal");
function InvoicePage() {
    return (<div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Faturas</h1>
        <how_it_works_modal_1.HowItWorksModal type="invoice"/>
      </div>
      <monthly_invoice_1.MonthlyInvoice />
    </div>);
}
