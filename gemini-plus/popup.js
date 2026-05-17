document.addEventListener('DOMContentLoaded', () => {
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
        backButtons: document.querySelectorAll('.back-btn'),
        deviceLangOpt: document.getElementById('deviceLangOpt'),
        uiLanguage: document.getElementById('uiLanguage'),
        refreshModal: document.getElementById('refreshModal'),
        modalBtnYes: document.getElementById('modalBtnYes'),
        modalBtnNo: document.getElementById('modalBtnNo')
    };

    let currentLanguage = 'device';
    let pendingLanguage = null;

    if (elements.deviceLangOpt) {
        elements.deviceLangOpt.textContent = `Device Default (${navigator.language})`;
    }

    // --- 1. מסך Welcome ---
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

    // --- 2. מעבר בין מסכים ---
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

    // --- 3. באנר עדכונים ---
    chrome.storage.local.get(['updateAvailable', 'remoteVersion'], (localData) => {
        if (localData.updateAvailable === true) {
            elements.updateBanner.style.display = 'flex';
            elements.versionNum.textContent = localData.remoteVersion;
        } else if (localData.updateAvailable === false) {
            elements.upToDateBanner.style.display = 'flex';
        }
    });

    // --- 4. מערכת אישור החלפת השפה (Modal) ---
    elements.uiLanguage.addEventListener('change', (e) => {
        pendingLanguage = e.target.value;
        if (pendingLanguage !== currentLanguage) {
            elements.refreshModal.classList.add('show');
        }
    });

    elements.modalBtnNo.addEventListener('click', () => {
        elements.refreshModal.classList.remove('show');
        elements.uiLanguage.value = currentLanguage; // מחזיר לבחירה הקודמת
        pendingLanguage = null;
    });

    elements.modalBtnYes.addEventListener('click', () => {
        elements.refreshModal.classList.remove('show');
        currentLanguage = pendingLanguage;
        chrome.storage.sync.set({ uiLanguage: currentLanguage }); // שומר את השפה
    });


    // --- 5. טעינה ושמירת הגדרות רגילות ---
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
    
    const colors = { scrollbarColor: document.getElementById('scrollbarColor') };

    const defaultState = {
        linesEnabled: true, wrapEnabled: true, wideEnabled: false,
        resizerEnabled: true, clearEnabled: true, goToLineEnabled: true, 
        downloadEnabled: true, scrollbarEnabled: true, 
        scrollbarColor: '#888888', hideDisclaimer: false,
        uiLanguage: 'device'
    };

    chrome.storage.sync.get(defaultState, (data) => {
        currentLanguage = data.uiLanguage;
        elements.uiLanguage.value = currentLanguage;

        for (const [key, element] of Object.entries(toggles)) {
            if (element) element.checked = data[key];
        }
        for (const [key, element] of Object.entries(colors)) {
            if (element) element.value = data[key];
        }
    });

    for (const [key, element] of Object.entries(toggles)) {
        if (element) element.addEventListener('change', () => chrome.storage.sync.set({ [key]: element.checked }));
    }
    for (const [key, element] of Object.entries(colors)) {
        if (element) element.addEventListener('change', () => chrome.storage.sync.set({ [key]: element.value }));
    }

    // --- 6. מערכת גיבוי ושחזור הגדרות ---
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

        elements.importBtn.addEventListener('click', () => { elements.importFile.click(); });

        elements.importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    chrome.storage.sync.set(importedData, () => {
                        chrome.storage.local.set({ hasSeenWelcome: true }, () => { window.location.reload(); });
                    });
                } catch (err) {
                    alert('Invalid settings file.');
                }
            };
            reader.readAsText(file);
        });
    }
});