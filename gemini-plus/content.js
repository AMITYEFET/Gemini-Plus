let currentSettings = {
    linesEnabled: true, wrapEnabled: true, wideEnabled: false,
    resizerEnabled: true, clearEnabled: true, goToLineEnabled: true, 
    downloadEnabled: true, scrollbarEnabled: true, scrollbarColor: '#888888',
    hideDisclaimer: false
};

chrome.storage.sync.get(currentSettings, (data) => updateUI(data));

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        chrome.storage.sync.get(currentSettings, (data) => updateUI(data));
    }
});

document.addEventListener('gemini-request-sync', () => {
    triggerMonacoSync(currentSettings);
});

function triggerMonacoSync(data) {
    document.dispatchEvent(new CustomEvent('gemini-update-monaco', {
        detail: {
            linesEnabled: data.linesEnabled,
            wrapEnabled: data.wrapEnabled
        }
    }));
}

function setCanvasResolution(width) {
    let styleTag = document.getElementById('gemini-dynamic-resolution');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'gemini-dynamic-resolution';
        document.head.appendChild(styleTag);
    }
    
    if (width === '100%') {
        styleTag.textContent = '';
    } else {
        styleTag.textContent = `
            iframe, 
            div:has(> .xap-monaco-container) {
                width: 100% !important;
                max-width: ${width} !important;
                margin: 0 auto !important;
                transition: max-width 0.3s ease !important;
            }
        `;
    }
}

function updateUI(data) {
    currentSettings = data;
    
    document.body.classList.toggle('gemini-lines-on', data.linesEnabled);
    document.body.classList.toggle('gemini-wrap-on', data.wrapEnabled);
    document.body.classList.toggle('gemini-wide-on', data.wideEnabled);
    document.body.classList.toggle('gemini-hide-disclaimer', data.hideDisclaimer);
    
    triggerMonacoSync(data);
    injectGeminiTools(); 

    if (data.linesEnabled) {
        updateLineNumbers();
    } else {
        document.querySelectorAll('.gemini-code-gutter').forEach(el => el.remove());
    }

    let styleTag = document.getElementById('gemini-dynamic-colors');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'gemini-dynamic-colors';
        document.head.appendChild(styleTag);
    }
    
    let cssRules = '';
    
    if (data.scrollbarEnabled) {
        cssRules += `
            ::-webkit-scrollbar, *::-webkit-scrollbar { width: 10px !important; height: 10px !important; }
            ::-webkit-scrollbar-track, *::-webkit-scrollbar-track { background: transparent !important; }
            ::-webkit-scrollbar-thumb, *::-webkit-scrollbar-thumb { 
                background-color: ${data.scrollbarColor} !important; 
                border-radius: 10px !important; 
                border: 2px solid transparent !important; 
                background-clip: padding-box !important; 
            }
            ::-webkit-scrollbar-thumb:hover, *::-webkit-scrollbar-thumb:hover { opacity: 0.8 !important; }
        `;
    }

    styleTag.textContent = cssRules;
}

function injectGeminiTools() {
    const actionButtons = document.querySelector('.action-buttons');
    if (!actionButtons) return; 

    const isShareLink = window.location.pathname.startsWith('/share/');
    if (isShareLink) {
        document.body.classList.add('gemini-share-page');
    } else {
        document.body.classList.remove('gemini-share-page');
    }
    
    const showResizer = currentSettings.resizerEnabled;
    const showClear = currentSettings.clearEnabled && !isShareLink;
    const showGoToLine = currentSettings.goToLineEnabled && !isShareLink;
    const showDownload = currentSettings.downloadEnabled; // כפתור ההורדה החדש והקבוע

    let wrapper = document.getElementById('gemini-tools-wrapper');

    if (!showResizer && !showClear && !showGoToLine && !showDownload) {
        if (wrapper) wrapper.remove();
        return;
    }

    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'gemini-tools-wrapper';
        wrapper.className = 'gemini-tools-wrapper';
        actionButtons.insertBefore(wrapper, actionButtons.firstChild);
    } else {
        if (wrapper.dataset.rendered === "true") return; 
    }

    const checkIcon = `<svg class="check-icon" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
    let html = '';

    if (showResizer) {
        html += `
            <button class="gemini-resizer-btn" title="Change Resolution" id="geminiResizerToggleBtn">
                <svg viewBox="0 0 24 24"><path d="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z"/></svg>
            </button>
            <div class="gemini-resizer-dropdown" id="geminiResizerDropdown">
                <button data-width="100%" class="active"><svg viewBox="0 0 24 24"><path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z"/></svg> <span>Default</span>${checkIcon}</button>
                <button data-width="1024px"><svg viewBox="0 0 24 24"><path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z"/></svg> <span>Desktop</span>${checkIcon}</button>
                <button data-width="768px"><svg viewBox="0 0 24 24"><path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-7 14c-.83 0-1.5-.67-1.5-1.5S11.17 15 12 15s1.5.67 1.5 1.5S12.83 18 12 18zm7-4H5V6h14v8z"/></svg> <span>Tablet</span>${checkIcon}</button>
                <button data-width="375px"><svg viewBox="0 0 24 24"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg> <span>Phone</span>${checkIcon}</button>
                <button id="customResizerBtn"><svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.05-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.73 8.87c-.11.2-.06.47.12.61l2.03 1.58c-.04.3-.06.62-.06.94 0 .32.02.64.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .43-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg> <span>Custom Width</span>${checkIcon}</button>
            </div>
        `;
    }

    if (showGoToLine) {
        if (showResizer) html += `<div class="gemini-toolbar-divider"></div>`;
        html += `
            <div class="gemini-goto-wrapper" title="Go to line">
                <svg viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
                <input type="number" id="geminiGotoInput" class="gemini-goto-input" placeholder="Line" min="1">
            </div>
        `;
    }

    // הזרקת כפתור ההורדה היציב ישירות לסרגל שלנו!
    if (showDownload) {
        if (showResizer || showGoToLine) html += `<div class="gemini-toolbar-divider"></div>`;
        html += `
            <button class="gemini-resizer-btn" title="Download Code File" id="geminiDownloadCanvasBtn">
                <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            </button>
        `;
    }

    if (showClear) {
        if (showResizer || showGoToLine || showDownload) html += `<div class="gemini-toolbar-divider"></div>`;
        html += `
            <button class="gemini-resizer-btn gemini-clear-btn" title="Clear Canvas Code" id="geminiClearCanvasBtn">
                <svg viewBox="0 0 24 24"><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/></svg>
            </button>
        `;
    }

    wrapper.innerHTML = html;
    wrapper.dataset.rendered = "true";

    // --- חיבורי אירועים לכפתורים ---
    
    if (showResizer) {
        const toggleBtn = wrapper.querySelector('#geminiResizerToggleBtn');
        const dropdown = wrapper.querySelector('#geminiResizerDropdown');
        
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        dropdown.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            dropdown.classList.remove('show');
            
            let width = btn.getAttribute('data-width');
            if (btn.id === 'customResizerBtn') {
                const userInput = prompt("Enter width (e.g., 500px or 60%):", "500px");
                if (userInput) width = userInput;
                else return;
            }

            dropdown.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            setCanvasResolution(width);
        });
    }

    if (showGoToLine) {
        const gotoInput = wrapper.querySelector('#geminiGotoInput');
        const handleGoto = () => {
            const val = gotoInput.value;
            if (val) {
                document.dispatchEvent(new CustomEvent('gemini-go-to-line', { detail: { line: val } }));
            }
        };

        gotoInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleGoto();
        });
    }

    if (showDownload) {
        const downloadBtn = wrapper.querySelector('#geminiDownloadCanvasBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                document.dispatchEvent(new CustomEvent('gemini-download-canvas'));
            });
        }
    }

    if (showClear) {
        const clearBtn = wrapper.querySelector('#geminiClearCanvasBtn');
        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all code in the canvas?')) {
                document.dispatchEvent(new CustomEvent('gemini-clear-canvas'));
            }
        });
    }
}

document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('gemini-tools-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
        const dropdown = wrapper.querySelector('#geminiResizerDropdown');
        if (dropdown) dropdown.classList.remove('show');
    }
});

function updateLineNumbers() {
    const codeBlocks = document.querySelectorAll('pre');
    codeBlocks.forEach(pre => {
        const code = pre.querySelector('code');
        if (!code || pre.closest('.monaco-editor') || pre.closest('.xap-monaco-container')) return; 

        const rawText = code.textContent;
        const lineCount = rawText.endsWith('\n') ? rawText.split('\n').length - 1 : rawText.split('\n').length;

        let gutter = pre.querySelector('.gemini-code-gutter');
        if (!gutter) {
            gutter = document.createElement('div');
            gutter.className = 'gemini-code-gutter';
            pre.insertBefore(gutter, pre.firstChild);
            pre.classList.add('has-line-numbers');
        }

        if (gutter.dataset.count != lineCount) {
            let html = '';
            for (let i = 1; i <= Math.max(1, lineCount); i++) {
                html += `<span>${i}</span>`;
            }
            gutter.innerHTML = html;
            gutter.dataset.count = lineCount;
        }
    });
}

let debounceTimer;
const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    for (let m of mutations) {
        if (m.addedNodes.length > 0) {
            shouldUpdate = true; break;
        }
    }
    
    if (shouldUpdate) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (document.body.classList.contains('gemini-lines-on')) updateLineNumbers();
            injectGeminiTools();
            triggerMonacoSync(currentSettings);
        }, 600); 
    }
});

observer.observe(document.body, { childList: true, subtree: true });