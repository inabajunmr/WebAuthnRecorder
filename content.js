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
    
    // Listen for messages from injected script to save to storage
    window.addEventListener('message', function(event) {
        // Only accept messages from same origin and with correct type
        if (event.source !== window || event.data.type !== 'WEBAUTHN_LOG') {
            return;
        }
        
        const logData = event.data.data;
        console.log('[WebAuthn Logger] Saving to storage:', logData);
        
        // Get existing logs from storage
        chrome.storage.local.get(['webauthn_logs'], function(result) {
            const existingLogs = result.webauthn_logs || [];
            
            // Check if this is an update to an existing entry
            const existingIndex = existingLogs.findIndex(log => log.id === logData.id);
            
            if (existingIndex !== -1) {
                // Update existing entry
                existingLogs[existingIndex] = logData;
                console.log('[WebAuthn Logger] Updated existing log entry:', logData.id);
            } else {
                // Add new log entry
                existingLogs.push(logData);
                console.log('[WebAuthn Logger] Added new log entry:', logData.id);
            }
            
            // Keep only last 1000 entries to prevent storage bloat
            if (existingLogs.length > 1000) {
                existingLogs.splice(0, existingLogs.length - 1000);
            }
            
            // Save back to storage
            chrome.storage.local.set({
                webauthn_logs: existingLogs
            }, function() {
                if (chrome.runtime.lastError) {
                    console.error('[WebAuthn Logger] Storage error:', chrome.runtime.lastError);
                } else {
                    console.log('[WebAuthn Logger] Saved log entry, total entries:', existingLogs.length);
                }
            });
        });
    });
    
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