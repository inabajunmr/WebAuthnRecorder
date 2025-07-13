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
    
    // Helper function to safely stringify objects
    function safeStringify(obj, depth = 0) {
        if (depth > 3) return '[Max Depth Reached]';
        
        try {
            if (obj === null || obj === undefined) return String(obj);
            if (typeof obj !== 'object') return String(obj);
            
            if (obj instanceof ArrayBuffer) {
                return `ArrayBuffer(${obj.byteLength} bytes)`;
            }
            
            if (obj instanceof Uint8Array) {
                return `Uint8Array(${obj.length} bytes): [${Array.from(obj.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ')}${obj.length > 16 ? '...' : ''}]`;
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
    
    // Override navigator.credentials.get
    navigator.credentials.get = function(options) {
        console.group('[WebAuthn Logger] navigator.credentials.get() called');
        console.log('📥 Parameters:', safeStringify(options));
        console.log('🕐 Timestamp:', new Date().toISOString());
        console.log('🌐 URL:', window.location.href);
        
        // Log publicKey specific details if available
        if (options && options.publicKey) {
            console.group('🔑 PublicKey Details:');
            console.log('Challenge:', safeStringify(options.publicKey.challenge));
            console.log('RP ID:', options.publicKey.rpId);
            console.log('Allow Credentials:', safeStringify(options.publicKey.allowCredentials));
            console.log('User Verification:', options.publicKey.userVerification);
            console.log('Timeout:', options.publicKey.timeout);
            console.groupEnd();
        }
        
        console.groupEnd();
        
        // Call original method and log result
        const promise = originalGet.call(this, options);
        promise.then(
            (result) => {
                console.group('[WebAuthn Logger] navigator.credentials.get() success');
                console.log('✅ Result:', safeStringify(result));
                console.groupEnd();
            },
            (error) => {
                console.group('[WebAuthn Logger] navigator.credentials.get() error');
                console.log('❌ Error:', error);
                console.groupEnd();
            }
        );
        
        return promise;
    };
    
    // Override navigator.credentials.create
    navigator.credentials.create = function(options) {
        console.group('[WebAuthn Logger] navigator.credentials.create() called');
        console.log('📤 Parameters:', safeStringify(options));
        console.log('🕐 Timestamp:', new Date().toISOString());
        console.log('🌐 URL:', window.location.href);
        
        // Log publicKey specific details if available
        if (options && options.publicKey) {
            console.group('🔑 PublicKey Details:');
            console.log('Challenge:', safeStringify(options.publicKey.challenge));
            console.log('RP:', safeStringify(options.publicKey.rp));
            console.log('User:', safeStringify(options.publicKey.user));
            console.log('Pub Key Cred Params:', safeStringify(options.publicKey.pubKeyCredParams));
            console.log('Authenticator Selection:', safeStringify(options.publicKey.authenticatorSelection));
            console.log('Attestation:', options.publicKey.attestation);
            console.log('Timeout:', options.publicKey.timeout);
            console.log('Exclude Credentials:', safeStringify(options.publicKey.excludeCredentials));
            console.groupEnd();
        }
        
        console.groupEnd();
        
        // Call original method and log result
        const promise = originalCreate.call(this, options);
        promise.then(
            (result) => {
                console.group('[WebAuthn Logger] navigator.credentials.create() success');
                console.log('✅ Result:', safeStringify(result));
                console.groupEnd();
            },
            (error) => {
                console.group('[WebAuthn Logger] navigator.credentials.create() error');
                console.log('❌ Error:', error);
                console.groupEnd();
            }
        );
        
        return promise;
    };
    
    console.log('[WebAuthn Logger] WebAuthn API methods have been wrapped');
})();