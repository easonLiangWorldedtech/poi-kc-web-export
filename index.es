/**
 * poi-kc-web-export
 * Export fleet data to kc-web (制空権シミュレータ)
 */

import React from 'react';
import { ipcRenderer } from 'electron';
import { store } from 'views/create-store';

// POI 插件標準導出結構 — 必須有 reactClass 才能正常運作
export const reactClass = () => {
    const [status, setStatus] = React.useState('');

    const handleExport = async () => {
        try {
            const state = store.getState();
            const fleetData = state.fleet ?? state;

            if (!fleetData?.fleets || !fleetData.fleets.length) {
                setStatus('沒有找到艦隊數據，請先編排艦隊');
                return;
            }

            // 轉換為 kc-web deck builder 格式 (第1艦隊)
            const result = { version: 4, hqlv: fleetData.admiralLevel || 120 };

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
                    const extra = ship.extraEquipment ?? ship.ex;
                    if (extra) {
                        entry.ex = { i: typeof extra === 'object' ? (extra.id ?? extra.masterId) : extra };
                    }
                    result[fleetKey][shipKey] = entry;
                }
            }

            const deckData = JSON.stringify(result);

            if (!deckData || deckData === '{}') {
                setStatus('艦隊數據為空，請先編排艦隊');
                return;
            }

            // 打開 kc-web webview
            try {
                const win = ipcRenderer.sendSync('poi:window-create', {
                    title: 'kc-web Export',
                    width: 1200,
                    height: 800,
                    url: 'https://noro6.github.io/kc-web/#/',
                });

                if (win?.webContents) {
                    win.webContents.on('dom-ready', () => {
                        setTimeout(() => {
                            try {
                                win.webContents.executeJavaScript(`
                                    (function() {
                                        const DECK_KEY = 'deck-builder-data';
                                        let input = document.querySelector('textarea, [data-deck-data], input[type="text"]');
                                        if (!input) {
                                            try {
                                                const saved = localStorage.getItem(DECK_KEY);
                                                if (saved) localStorage.setItem(DECK_KEY, decodeURIComponent(atob(saved)));
                                            } catch(e) {}
                                        }
                                        if (input) {
                                            input.value = '${deckData.replace(/'/g, "\\'")}';
                                            input.dispatchEvent(new Event('input', { bubbles: true }));
                                            input.dispatchEvent(new Event('change', { bubbles: true }));
                                            try {
                                                const btn = document.querySelector('[data-action="import"], button:contains("インポート")');
                                                if (btn) btn.click();
                                            } catch(e) {}
                                        }
                                    })();
                                `);
                            } catch(e) {
                                console.error('[poi-kc-web-export] inject failed:', e.message);
                            }
                        }, 500);
                    });
                } else {
                    require('electron').shell.openExternal('https://noro6.github.io/kc-web/#/');
                }

                setStatus('已開啟 kc-web，請在頁面中確認數據');
            } catch (e) {
                require('electron').shell.openExternal('https://noro6.github.io/kc-web/#/');
                setStatus('已開啟瀏覽器，請手動導入數據');
            }
        } catch (e) {
            console.error('[poi-kc-web-export] error:', e);
            setStatus(`導出失敗：${e.message}`);
        }
    };

    return React.createElement('div', { style: { padding: '15px' } },
        React.createElement('h3', null, 'kc-web Export'),
        React.createElement('p', null, '將艦隊數據導出到 kc-web (制空権シミュレータ)'),
        React.createElement('button', {
            onClick: handleExport,
            style: { padding: '8px 16px', cursor: 'pointer' }
        }, '導出到 kc-web'),
        status && React.createElement('p', { style: { color: '#ff6b6b', marginTop: '10px' } }, status)
    );
};

// POI 插件標準導出結構 — POI 不傳 poi 參數
export function pluginDidLoad() {}
