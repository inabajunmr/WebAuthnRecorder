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
    function safeStringify(obj, depth = 0, visited = new WeakSet()) {
        if (depth > 10) return '[Max Depth Reached]';
        
        try {
            if (obj === null || obj === undefined) return obj;
            if (typeof obj !== 'object') return obj;
            
            // Prevent circular references
            if (visited.has(obj)) return '[Circular Reference]';
            visited.add(obj);
            
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
            
            // Handle Array objects (like allowCredentials)
            if (Array.isArray(obj)) {
                return obj.map(item => safeStringify(item, depth + 1, visited));
            }
            
            // Handle PublicKeyCredential objects specifically
            if (obj instanceof PublicKeyCredential) {
                const result = {
                    _type: 'PublicKeyCredential',
                    id: obj.id,
                    rawId: obj.rawId,
                    type: obj.type,
                    authenticatorAttachment: obj.authenticatorAttachment,
                    response: {},
                    clientExtensionResults: obj.clientExtensionResults
                };
                
                // Handle the response object (AuthenticatorAssertionResponse or AuthenticatorAttestationResponse)
                if (obj.response) {
                    result.response = {
                        clientDataJSON: obj.response.clientDataJSON,
                        authenticatorData: obj.response.authenticatorData
                    };
                    
                    // For AuthenticatorAssertionResponse (get operation)
                    if (obj.response.signature) {
                        result.response.signature = obj.response.signature;
                        result.response.userHandle = obj.response.userHandle;
                    }
                    
                    // For AuthenticatorAttestationResponse (create operation)
                    if (obj.response.attestationObject) {
                        result.response.attestationObject = obj.response.attestationObject;
                    }
                    
                    // Recursively stringify each response property
                    for (const [key, value] of Object.entries(result.response)) {
                        result.response[key] = safeStringify(value, depth + 1, visited);
                    }
                }
                
                // Recursively stringify other properties
                result.rawId = safeStringify(obj.rawId, depth + 1, visited);
                result.clientExtensionResults = safeStringify(obj.clientExtensionResults, depth + 1, visited);
                
                return result;
            }
            
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'function') {
                    result[key] = '[Function]';
                } else {
                    result[key] = safeStringify(value, depth + 1, visited);
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