// overrides.js - Main World Execution Context
console.log("SRI Auto: Main World Script Loaded");

// Override native confirm to always return true (click OK)
window.confirm = function () {
    console.log("SRI Auto: Auto-confirming dialog.");
    return true;
};

// Override native alert to just log it
window.alert = function (msg) {
    console.log("SRI Auto: Auto-dismissing alert:", msg);
    return true;
};

// Listen for commands from the Isolated World (content.js)
window.addEventListener("message", (event) => {
    // Security check: only accept messages from same window
    if (event.source !== window) return;

    if (event.data.type && event.data.type === "SRI_CLICK") {
        const xpath = event.data.xpath;
        console.log("[SRI Main] Received click request for:", xpath);

        try {
            const el = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (el) {
                const href = el.getAttribute('href');
                const onclick = el.getAttribute('onclick');
                
                if (href && href.startsWith('javascript:')) {
                    const jsCode = href.replace('javascript:', '');
                    console.log("[SRI Main] Executing href JS:", jsCode);
                    new Function(jsCode)();
                } else if (onclick) {
                    const jsCode = onclick.replace(/^javascript:/i, '');
                    console.log("[SRI Main] Executing onclick JS:", jsCode);
                    try {
                        const clickFn = new Function(jsCode);
                        clickFn.call(el); 
                        el.click(); // Also perform normal click for selection
                    } catch(e) { el.click(); }
                } else {
                    console.log("[SRI Main] Standard Click...");
                    el.click();
                }
            } else {
                console.warn("[SRI Main] Element not found for click");
            }
        } catch (e) {
            console.error("[SRI Main] Click Error:", e);
        }
    }
});
