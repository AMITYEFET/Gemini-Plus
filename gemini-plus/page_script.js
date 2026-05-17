(function() {
    let lastLines = 'on';
    let lastWrap = 'on';

    function updateMonacoSettings(e) {
        if (e && e.detail) {
            lastLines = e.detail.linesEnabled === false ? 'off' : 'on';
            lastWrap = e.detail.wrapEnabled === false ? 'off' : 'on';
        }
        
        if (window.monaco && window.monaco.editor) {
            window.monaco.editor.getEditors().forEach(editor => {
                editor.updateOptions({
                    lineNumbers: lastLines,
                    wordWrap: lastWrap
                });
            });
        }
    }

    document.addEventListener('gemini-update-monaco', updateMonacoSettings);

    document.addEventListener('gemini-clear-canvas', () => {
        if (window.monaco && window.monaco.editor) {
            window.monaco.editor.getEditors().forEach(editor => {
                const model = editor.getModel();
                if (model) {
                    model.setValue('');
                }
            });
        }
    });

    document.addEventListener('gemini-download-canvas', () => {
        if (window.monaco && window.monaco.editor) {
            window.monaco.editor.getEditors().forEach(editor => {
                const model = editor.getModel();
                if (model) {
                    const code = model.getValue();
                    const lang = model.getLanguageId() || 'txt';
                    
                    const extMap = {
                        'javascript': 'js', 'typescript': 'ts', 'python': 'py',
                        'html': 'html', 'css': 'css', 'json': 'json', 'java': 'java',
                        'csharp': 'cs', 'cpp': 'cpp', 'c': 'c', 'markdown': 'md',
                        'php': 'php', 'ruby': 'rb', 'go': 'go', 'rust': 'rs', 'sql': 'sql'
                    };
                    const extension = extMap[lang] || 'txt';
                    
                    const blob = new Blob([code], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `gemini-code.${extension}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
            });
        }
    });

    document.addEventListener('gemini-go-to-line', (e) => {
        const line = parseInt(e.detail?.line, 10);
        if (!line || isNaN(line)) return;

        if (window.monaco && window.monaco.editor) {
            window.monaco.editor.getEditors().forEach(editor => {
                const model = editor.getModel();
                if (model) {
                    const maxLines = model.getLineCount();
                    const safeLine = Math.min(Math.max(1, line), maxLines);
                    
                    editor.setPosition({ lineNumber: safeLine, column: 1 });
                    editor.revealLineInCenter(safeLine);
                    editor.focus();
                }
            });
        }
    });

    setTimeout(() => {
        document.dispatchEvent(new CustomEvent('gemini-request-sync'));
    }, 2000);
})();