"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMobile = void 0;
const react_1 = require("react");
const useMobile = () => {
    const [isMobile, setIsMobile] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768); // Define mobile breakpoint (md:768px in tailwind.config.ts)
        };
        handleResize(); // Initial check
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);
    return isMobile;
};
exports.useMobile = useMobile;
