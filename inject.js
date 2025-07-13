// Injected script that runs in the page context
(function() {
    'use strict';
    
    console.log('[WebAuthn Logger] Injected script loaded');
    
    // Check if navigator.credentials exists
    if (!navigator.credentials) {
        console.log('[WebAuthn Logger] navigator.credentials not available');
        return;
    }
    
    // Store original methods
    const originalGet = navigator.credentials.get;
    const originalCreate = navigator.credentials.create;
    
    // Helper function to safely stringify objects for JSON storage
    function safeStringify(obj, depth = 0) {
        if (depth > 3) return '[Max Depth Reached]';
        
        try {
            if (obj === null || obj === undefined) return obj;
            if (typeof obj !== 'object') return obj;
            
            if (obj instanceof ArrayBuffer) {
                return {
                    _type: 'ArrayBuffer',
                    byteLength: obj.byteLength,
                    data: Array.from(new Uint8Array(obj))
                };
            }
            
            if (obj instanceof Uint8Array) {
                return {
                    _type: 'Uint8Array',
                    length: obj.length,
                    data: Array.from(obj)
                };
            }
            
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'function') {
                    result[key] = '[Function]';
                } else if (value instanceof ArrayBuffer || value instanceof Uint8Array) {
                    result[key] = safeStringify(value, depth + 1);
                } else if (typeof value === 'object') {
                    result[key] = safeStringify(value, depth + 1);
                } else {
                    result[key] = value;
                }
            }
            return result;
        } catch (e) {
            return `[Error stringifying: ${e.message}]`;
        }
    }
    
    // Helper function to save data to chrome.storage.local via content script
    function saveToStorage(logData) {
        window.postMessage({
            type: 'WEBAUTHN_LOG',
            data: logData
        }, '*');
    }
    
    // Override navigator.credentials.get
    navigator.credentials.get = function(options) {
        const timestamp = new Date().toISOString();
        const url = window.location.href;
        
        // Create log entry
        const logEntry = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            type: 'get',
            timestamp: timestamp,
            url: url,
            options: safeStringify(options),
            success: null,
            result: null,
            error: null
        };
        
        console.group('[WebAuthn Logger] navigator.credentials.get() called');
        console.log('📥 Parameters:', logEntry.options);
        console.log('🕐 Timestamp:', timestamp);
        console.log('🌐 URL:', url);
        
        // Save initial log entry
        saveToStorage(logEntry);
        
        // Call original method and log result
        const promise = originalGet.call(this, options);
        promise.then(
            (result) => {
                const resultEntry = {
                    ...logEntry,
                    success: true,
                    result: safeStringify(result)
                };
                saveToStorage(resultEntry);
                
                console.group('[WebAuthn Logger] navigator.credentials.get() success');
                console.log('✅ Result:', result);
                console.groupEnd();
            },
            (error) => {
                const errorEntry = {
                    ...logEntry,
                    success: false,
                    error: error.toString()
                };
                saveToStorage(errorEntry);
                
                console.group('[WebAuthn Logger] navigator.credentials.get() error');
                console.log('❌ Error:', error);
                console.groupEnd();
            }
        );
        
        console.groupEnd();
        
        return promise;
    };
    
    // Override navigator.credentials.create
    navigator.credentials.create = function(options) {
        const timestamp = new Date().toISOString();
        const url = window.location.href;
        
        // Create log entry
        const logEntry = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            type: 'create',
            timestamp: timestamp,
            url: url,
            options: safeStringify(options),
            success: null,
            result: null,
            error: null
        };
        
        console.group('[WebAuthn Logger] navigator.credentials.create() called');
        console.log('📤 Parameters:', logEntry.options);
        console.log('🕐 Timestamp:', timestamp);
        console.log('🌐 URL:', url);
        
        // Save initial log entry
        saveToStorage(logEntry);
        
        // Call original method and log result
        const promise = originalCreate.call(this, options);
        promise.then(
            (result) => {
                const resultEntry = {
                    ...logEntry,
                    success: true,
                    result: safeStringify(result)
                };
                saveToStorage(resultEntry);
                
                console.group('[WebAuthn Logger] navigator.credentials.create() success');
                console.log('✅ Result:', result);
                console.groupEnd();
            },
            (error) => {
                const errorEntry = {
                    ...logEntry,
                    success: false,
                    error: error.toString()
                };
                saveToStorage(errorEntry);
                
                console.group('[WebAuthn Logger] navigator.credentials.create() error');
                console.log('❌ Error:', error);
                console.groupEnd();
            }
        );
        
        console.groupEnd();
        
        return promise;
    };
    
    console.log('[WebAuthn Logger] WebAuthn API methods have been wrapped');
})();