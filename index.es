/**
 * poi-kc-web-export
 * Export fleet data to kc-web (制空権シミュレータ)
 */

import React from 'react';
import { ipcRenderer } from 'electron';
import { store } from 'views/create-store';

// POI 插件標準導出結構 — 必須有 reactClass 才能正常運作
export const reactClass = () => (
    <div style={{ padding: '10px' }}>
        <button onClick={() => handleExport()}>導出到 kc-web</button>
    </div>
);

function notify(msg, type) {
    if (type === 'error') console.error(`[poi-kc-web-export] ${msg}`);
    else console.log(`[poi-kc-web-export] ${msg}`);
}

// kc-web deck builder 格式轉換
function convertToFleetFormat(fleetData, fleetIndex) {
    const result = {
        version: 4,
        hqlv: fleetData.admiralLevel || 120,
    };

    for (let i = 0; i < 8; i++) {
        if (!fleetData.fleets?.[i]) continue;

        const ships = fleetData.fleets[i].ships || [];
        const fleetKey = `f${i + 1}`;
        result[fleetKey] = {};

        for (let j = 0; j < Math.min(6, ships.length); j++) {
            const ship = ships[j];
            if (!ship) continue;

            const shipKey = `s${j + 1}`;
            const entry = {
                i: ship.id || 0,
                lv: ship.level || 1,
                is: (ship.equipment || []).map(e => e ? (typeof e === 'object' ? (e.id ?? e.masterId) : e) : 0),
            };

            if (ship.hp != null) entry.hp = typeof ship.hp === 'number' ? ship.hp : (ship.hp.current ?? ship.hp.max);
            if (ship.lu != null) entry.lu = ship.lu;
            if (ship.as != null) entry.as = ship.as;
            if (ship.aa != null) entry.aa = ship.aa;

            // 補強増設
            const extra = ship.extraEquipment ?? ship.ex;
            if (extra) {
                entry.ex = { i: typeof extra === 'object' ? (extra.id ?? extra.masterId) : extra };
            }

            result[fleetKey][shipKey] = entry;
        }
    }

    return JSON.stringify(result);
}

// 打開 kc-web webview 並注入數據
function openKcWeb(deckData) {
    const url = 'https://noro6.github.io/kc-web/#/';

    // 使用 poi 的 window-create IPC 打開新窗口
    let win;
    try {
        win = ipcRenderer.sendSync('poi:window-create', {
            title: 'kc-web Export',
            width: 1200,
            height: 800,
            url,
        });
    } catch (e) {
        // fallback: open in default browser
        require('electron').shell.openExternal(url);
        notify(`已開啟瀏覽器，請手動導入數據`, 'info');
        return;
    }

    if (!win?.webContents) return;

    // 等待頁面加載後注入 deck builder 數據
    const injectData = () => {
        try {
            win.webContents.executeJavaScript(`
                (function() {
                    const DECK_KEY = 'deck-builder-data';
                    
                    // 方法1: 尋找 deck builder 輸入框
                    let input = document.querySelector('textarea, [data-deck-data], input[type="text"]');
                    
                    if (!input) {
                        // 方法2: 通過 localStorage / sessionStorage 直接設置
                        try {
                            const saved = localStorage.getItem(DECK_KEY);
                            if (saved) {
                                localStorage.setItem(DECK_KEY, decodeURIComponent(atob(saved)));
                            }
                        } catch(e) {}
                    }
                    
                    if (input) {
                        input.value = '${deckData.replace(/'/g, "\\'")}';
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                        
                        // 嘗試觸發 kc-web 的導入事件
                        try {
                            const btn = document.querySelector('[data-action="import"], button:contains("インポート")');
                            if (btn) btn.click();
                        } catch(e) {}
                    }
                    
                    console.log('[poi-kc-web-export] data injected:', '${deckData.substring(0, 50)}...');
                })();
            `).catch(() => {
                setTimeout(injectData, 1000);
            });
        } catch (e) {
            console.error('[poi-kc-web-export] inject failed:', e.message);
        }
    };

    // 等待 dom-ready 後注入
    win.webContents.on('dom-ready', () => {
        setTimeout(injectData, 500);
    });

    return win;
}

function handleExport() {
    try {
        const state = store.getState();
        const fleetData = state.fleet ?? state;

        if (!fleetData?.fleets || !fleetData.fleets.length) {
            notify('沒有找到艦隊數據，請先編排艦隊', 'warning');
            return;
        }

        const deckData = convertToFleetFormat(fleetData, 0);

        if (!deckData || deckData === '{}') {
            notify('艦隊數據為空，請先編排艦隊', 'warning');
            return;
        }

        openKcWeb(deckData);
        notify('已開啟 kc-web，請在頁面中確認數據', 'success');
    } catch (e) {
        console.error('[poi-kc-web-export] error:', e);
        notify(`導出失敗：${e.message}`, 'error');
    }
}

// POI 插件標準導出結構
export function pluginDidLoad(poi) {
    poi.registerMenu({
        title: 'kc-web Export',
        icon: 'fa/external-link',
        onClick() {
            handleExport();
        },
    });

    // 快捷鍵
    poi.registerShortcut({
        key: 'KC_WEB_EXPORT',
        name: 'Export to kc-web',
        accelerator: 'CmdOrCtrl+Shift+E',
        onClick() {
            handleExport();
        },
    });
}
