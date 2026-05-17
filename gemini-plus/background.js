// הקישור הישיר ל-manifest ב-GitHub
const GITHUB_MANIFEST_URL = 'https://raw.githubusercontent.com/AMITYEFET/Gemini-Plus/main/gemini-plus/manifest.json';

async function checkForUpdates() {
    try {
        const response = await fetch(GITHUB_MANIFEST_URL + '?t=' + Date.now()); // מניעת קאש
        if (!response.ok) return;
        
        const remoteManifest = await response.json();
        const localManifest = chrome.runtime.getManifest();

        // השוואת גרסאות
        if (remoteManifest.version !== localManifest.version) {
            // יש עדכון - שימוש באמוג'י כטקסט באג'
            chrome.action.setBadgeText({ text: '🗘' });
            chrome.action.setBadgeBackgroundColor({ color: '#D93025' });
            chrome.storage.local.set({ 
                updateAvailable: true, 
                remoteVersion: remoteManifest.version 
            });
        } else {
            // הגרסה מעודכנת
            chrome.action.setBadgeText({ text: '' });
            chrome.storage.local.set({ 
                updateAvailable: false,
                remoteVersion: localManifest.version 
            });
        }
    } catch (e) {
        console.error('Gemini+ Update Check Failed:', e);
    }
}

// בדיקה בעת הפעלת הדפדפן / התקנה
chrome.runtime.onInstalled.addListener(checkForUpdates);
chrome.runtime.onStartup.addListener(checkForUpdates);

// יצירת משימה מתוזמנת לבדיקה פעם ב-60 דקות
chrome.alarms.create('updateCheck', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'updateCheck') checkForUpdates();
});