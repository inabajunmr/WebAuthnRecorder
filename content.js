// Content script that injects the WebAuthn logger
(function() {
    'use strict';
    
    console.log('[WebAuthn Logger] Content script loaded');
    
    // Function to inject the script into the page context
    function injectScript() {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('inject.js');
        script.onload = function() {
            console.log('[WebAuthn Logger] Inject script loaded');
            this.remove();
        };
        script.onerror = function() {
            console.error('[WebAuthn Logger] Failed to load inject script');
            this.remove();
        };
        
        // Inject as early as possible
        (document.head || document.documentElement).appendChild(script);
    }
    
    // Inject immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectScript);
    } else {
        injectScript();
    }
    
    // Backup: also listen for page navigation events
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('[WebAuthn Logger] URL changed, re-injecting script');
            setTimeout(injectScript, 100); // Small delay to ensure page is ready
        }
    }).observe(document, { subtree: true, childList: true });
    
})();