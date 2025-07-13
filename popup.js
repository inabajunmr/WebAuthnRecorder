// Popup script for WebAuthn Logger Extension
document.addEventListener('DOMContentLoaded', function() {
    const logsContainer = document.getElementById('logs');
    const exportBtn = document.getElementById('exportBtn');
    const clearBtn = document.getElementById('clearBtn');
    const statusDiv = document.getElementById('status');
    
    let currentLogs = [];
    let openStates = new Map(); // Track which details are open
    let savedScrollPosition = 0; // Track scroll position

    // Save the open state of all details elements and scroll position
    function saveOpenStates() {
        openStates.clear();
        savedScrollPosition = logsContainer.scrollTop; // Save scroll position
        const detailsElements = logsContainer.querySelectorAll('details');
        detailsElements.forEach((details, index) => {
            const logId = details.closest('.log-entry').dataset.logId;
            const summaryText = details.querySelector('summary').textContent;
            const key = `${logId}-${summaryText}`;
            openStates.set(key, details.open);
        });
    }

    // Restore the open state of all details elements and scroll position
    function restoreOpenStates() {
        const detailsElements = logsContainer.querySelectorAll('details');
        detailsElements.forEach((details, index) => {
            const logId = details.closest('.log-entry').dataset.logId;
            const summaryText = details.querySelector('summary').textContent;
            const key = `${logId}-${summaryText}`;
            if (openStates.has(key)) {
                details.open = openStates.get(key);
            }
        });
        
        // Restore scroll position after DOM has been updated
        setTimeout(() => {
            logsContainer.scrollTop = savedScrollPosition;
        }, 0);
    }

    // Load and display logs
    function loadLogs(forceRefresh = false) {
        chrome.storage.local.get(['webauthn_logs'], function(result) {
            const logs = result.webauthn_logs || [];
            
            statusDiv.textContent = `Total logs: ${logs.length}`;
            
            // Check if logs have actually changed
            if (!forceRefresh && JSON.stringify(logs) === JSON.stringify(currentLogs)) {
                return; // No changes, don't refresh
            }
            
            // Save open states before rebuilding
            saveOpenStates();
            
            currentLogs = logs;
            
            if (logs.length === 0) {
                logsContainer.innerHTML = '<div class="no-logs">No WebAuthn logs captured yet</div>';
                return;
            }

            // Sort logs by timestamp (newest first)
            logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            logsContainer.innerHTML = '';
            
            logs.forEach(log => {
                const logElement = document.createElement('div');
                logElement.className = 'log-entry';
                logElement.dataset.logId = log.id; // Add log ID for tracking
                
                const typeClass = log.type === 'get' ? 'type-get' : 'type-create';
                const statusClass = log.success === true ? 'status-success' : 
                                   log.success === false ? 'status-error' : 'status-pending';
                
                logElement.innerHTML = `
                    <div class="log-header">
                        <span class="log-type ${typeClass}">${log.type.toUpperCase()}</span>
                        <span class="log-status ${statusClass}">
                            ${log.success === true ? '✓' : log.success === false ? '✗' : '⏳'}
                        </span>
                        <span class="log-timestamp">${new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div class="log-url">${log.url}</div>
                    <div class="log-details">
                        <details>
                            <summary>Options</summary>
                            <pre class="json-content">${JSON.stringify(log.options, null, 2)}</pre>
                        </details>
                        ${log.result ? `
                            <details>
                                <summary>Result</summary>
                                <pre class="json-content">${JSON.stringify(log.result, null, 2)}</pre>
                            </details>
                        ` : ''}
                        ${log.error ? `
                            <details>
                                <summary>Error</summary>
                                <pre class="error-content">${log.error}</pre>
                            </details>
                        ` : ''}
                    </div>
                `;
                
                logsContainer.appendChild(logElement);
            });
            
            // Restore open states after rebuilding
            restoreOpenStates();
        });
    }

    // Export logs as JSON
    function exportLogs() {
        chrome.storage.local.get(['webauthn_logs'], function(result) {
            const logs = result.webauthn_logs || [];
            
            if (logs.length === 0) {
                alert('No logs to export');
                return;
            }
            
            const dataStr = JSON.stringify(logs, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `webauthn-logs-${timestamp}.json`;
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            
            URL.revokeObjectURL(url);
        });
    }

    // Clear all logs
    function clearLogs() {
        if (confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
            chrome.storage.local.set({ webauthn_logs: [] }, function() {
                loadLogs(true); // Force refresh
                alert('All logs cleared');
            });
        }
    }

    // Event listeners
    exportBtn.addEventListener('click', exportLogs);
    clearBtn.addEventListener('click', clearLogs);

    // Initial load
    loadLogs(true);

    // Manual refresh only - remove automatic refresh to prevent DOM rebuilding
    // Users can refresh by reopening the popup if needed
});