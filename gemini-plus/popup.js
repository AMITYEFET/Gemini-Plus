document.addEventListener('DOMContentLoaded', () => {
    // אופטימיזציה: מטמון (Caching) של רכיבי DOM מרכזיים לביצועים מהירים יותר
    const elements = {
        welcomeScreen: document.getElementById('screen-welcome'),
        mainScreen: document.getElementById('main-screen'),
        updateBanner: document.getElementById('updateBanner'),
        upToDateBanner: document.getElementById('upToDateBanner'),
        versionNum: document.getElementById('newVersionNum'),
        welcomeSkipBtn: document.getElementById('welcomeSkipBtn'),
        welcomeImportBtn: document.getElementById('welcomeImportBtn'),
        exportBtn: document.getElementById('exportBtn'),
        importBtn: document.getElementById('importBtn'),
        importFile: document.getElementById('importFile'),
        categoryCards: document.querySelectorAll('.category-card'),
        backButtons: document.querySelectorAll('.back-btn')
    };

    // --- 1. מסך Welcome ובדיקת צפייה ---
    chrome.storage.local.get(['hasSeenWelcome'], (data) => {
        if (data.hasSeenWelcome) {
            elements.welcomeScreen.classList.remove('active');
            elements.welcomeScreen.classList.add('hidden-left');
            elements.mainScreen.classList.remove('hidden-right');
            elements.mainScreen.classList.add('active');
        } else {
            elements.mainScreen.classList.remove('active');
            elements.mainScreen.classList.add('hidden-right');
        }
    });

    elements.welcomeSkipBtn.addEventListener('click', () => {
        chrome.storage.local.set({ hasSeenWelcome: true }, () => {
            elements.welcomeScreen.classList.remove('active');
            elements.welcomeScreen.classList.add('hidden-left');
            elements.mainScreen.classList.remove('hidden-right');
            elements.mainScreen.classList.add('active');
        });
    });

    elements.welcomeImportBtn.addEventListener('click', () => {
        elements.importFile.click();
    });

    // --- 2. מעבר בין מסכי הגדרות פנימיים ---
    elements.categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const targetId = card.getAttribute('data-target');
            const targetScreen = document.getElementById(targetId);
            
            if (targetScreen) {
                elements.mainScreen.classList.remove('active');
                elements.mainScreen.classList.add('hidden-left');
                targetScreen.classList.remove('hidden-right');
                targetScreen.classList.add('active');
            }
        });
    });

    elements.backButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentScreen = btn.closest('.screen');
            currentScreen.classList.remove('active');
            currentScreen.classList.add('hidden-right');
            elements.mainScreen.classList.remove('hidden-left');
            elements.mainScreen.classList.add('active');
        });
    });

    // --- 3. הצגת באנר עדכונים ---
    chrome.storage.local.get(['updateAvailable', 'remoteVersion'], (localData) => {
        if (localData.updateAvailable === true) {
            elements.updateBanner.style.display = 'flex';
            elements.versionNum.textContent = localData.remoteVersion;
        } else if (localData.updateAvailable === false) {
            elements.upToDateBanner.style.display = 'flex';
        }
    });

    // --- 4. טעינה ושמירת הגדרות רגילות ---
    const toggles = {
        linesEnabled: document.getElementById('linesToggle'),
        wrapEnabled: document.getElementById('wrapToggle'),
        wideEnabled: document.getElementById('wideToggle'),
        resizerEnabled: document.getElementById('resizerToggle'),
        goToLineEnabled: document.getElementById('goToLineToggle'),
        clearEnabled: document.getElementById('clearToggle'),
        downloadEnabled: document.getElementById('downloadToggle'),
        scrollbarEnabled: document.getElementById('scrollbarToggle'),
        hideDisclaimer: document.getElementById('hideDisclaimerToggle')
    };
    
    const colors = {
        scrollbarColor: document.getElementById('scrollbarColor')
    };

    const defaultState = {
        linesEnabled: true, wrapEnabled: true, wideEnabled: false,
        resizerEnabled: true, clearEnabled: true, goToLineEnabled: true, 
        downloadEnabled: true, scrollbarEnabled: true, 
        scrollbarColor: '#888888',
        hideDisclaimer: false
    };

    chrome.storage.sync.get(defaultState, (data) => {
        for (const [key, element] of Object.entries(toggles)) {
            if (element) element.checked = data[key];
        }
        for (const [key, element] of Object.entries(colors)) {
            if (element) element.value = data[key];
        }
    });

    for (const [key, element] of Object.entries(toggles)) {
        if (element) {
            element.addEventListener('change', () => chrome.storage.sync.set({ [key]: element.checked }));
        }
    }

    for (const [key, element] of Object.entries(colors)) {
        if (element) {
            element.addEventListener('change', () => chrome.storage.sync.set({ [key]: element.value }));
        }
    }

    // --- 5. מערכת גיבוי ושחזור הגדרות (Export / Import) ---
    if (elements.exportBtn && elements.importBtn && elements.importFile) {
        
        elements.exportBtn.addEventListener('click', () => {
            chrome.storage.sync.get(null, (data) => {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'gemini_plus_settings.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        });

        elements.importBtn.addEventListener('click', () => {
            elements.importFile.click();
        });

        elements.importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    chrome.storage.sync.set(importedData, () => {
                        chrome.storage.local.set({ hasSeenWelcome: true }, () => {
                            window.location.reload();
                        });
                    });
                } catch (err) {
                    alert('Invalid settings file.');
                }
            };
            reader.readAsText(file);
        });
    }
});