"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InstallmentsPage;
const installment_overview_1 = require("@/components/installments/installment-overview");
const how_it_works_modal_1 = require("@/components/installments/how-it-works-modal");
function InstallmentsPage() {
    return (<div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Parcelamentos</h1>
        <how_it_works_modal_1.HowItWorksModal type="installments"/>
      </div>
      <installment_overview_1.InstallmentOverview />
    </div>);
}
