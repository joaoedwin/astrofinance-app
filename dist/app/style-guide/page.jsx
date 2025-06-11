"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StyleGuidePage;
const style_guide_1 = require("@/components/style-guide");
function StyleGuidePage() {
    return (<div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight">Style Guide</h1>
      <style_guide_1.StyleGuide />
    </div>);
}
