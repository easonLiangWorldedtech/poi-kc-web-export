/**
 * poi-kc-web-export
 * Export fleet data to kc-web (制空権シミュレータ)
 */

import { ipcRenderer } from 'electron';
import { popup } from 'poi/lib/ui/util/popup';
import $ from 'lodash';

// kc-web deck builder 格式轉換
function convertToFleetFormat(fleetData, fleetIndex) {
    const fleetNum = fleetIndex + 1;
    
    // 基礎結構
    const result = {
        version: 4,
        hqlv: fleetData.admiralLevel || 120,
    };

    // 轉換每個艦隊
    for (let i = 0; i < 8; i++) {
        const fleetKey = `f${i + 1}`;
        if (!fleetData.fleets[i]) continue;
        
        const ships = fleetData.fleets[i].ships || [];
        result[fleetKey] = {};
        
        for (let j = 0; j < Math.min(6, ships.length); j++) {
            const ship = ships[j];
            if (!ship) continue;
            
            const shipKey = `s${j + 1}`;
            result[fleetKey][shipKey] = {
                i: ship.id || 0,           // 艦娘 ID
                lv: ship.level || 1,        // 等級
                is: (ship.equipment || []).map(e => e ? (e.id || e) : 0),  // 裝備列表
            };
            
            // HP（如果可用）
            if (ship.hp !== undefined) {
                result[fleetKey][shipKey].hp = ship.hp;
            }
            
            // 運（如果可用）
            if (ship.lu !== undefined) {
                result[fleetKey][shipKey].lu = ship.lu;
            }
            
            // 補強增設（如果可用）
            if (ship.extraEquipment) {
                result[fleetKey][shipKey].ex = {
                    i: ship.extraEquipment.id || ship.extraEquipment,
                };
            }
        }
    }

    return JSON.stringify(result);
}

// 打開 kc-web webview
function openKcWeb(deckData) {
    const url = 'https://noro6.github.io/kc-web/#/';
    
    // 使用 poi 的 popup 功能打開新窗口
    const win = ipcRenderer.sendSync('poi:window-create', {
        title: 'kc-web Export',
        width: 1200,
        height: 800,
        url: url,
    });

    // 等待窗口加載後注入數據
    setTimeout(() => {
        try {
            win.webContents.executeJavaScript(`
                (function() {
                    // 等待 kc-web 初始化
                    const checkReady = () => {
                        const deckInput = document.querySelector('[data-deck-data], input[type="text"], textarea');
                        if (!deckInput) {
                            setTimeout(checkReady, 500);
                            return;
                        }
                        
                        // 設置數據
                        deckInput.value = '${deckData}';
                        deckInput.dispatchEvent(new Event('input', { bubbles: true }));
                        deckInput.dispatchEvent(new Event('change', { bubbles: true }));
                        
                        console.log('kc-web data injected successfully');
                    };
                    
                    checkReady();
                })();
            `);
        } catch (e) {
            console.error('Failed to inject data:', e);
        }
    }, 2000);

    return win;
}

// 主插件入口
export default function main(poi) {
    // 註冊插件菜單
    poi.registerMenu({
        title: 'kc-web Export',
        icon: 'fa/external-link',
        onClick() {
            try {
                // 獲取當前艦隊數據
                const fleetData = poi.store.getState('fleet');
                
                if (!fleetData || !fleetData.fleets) {
                    popup({ type: 'warning', content: '沒有找到艦隊數據' });
                    return;
                }

                // 轉換為 kc-web 格式
                const deckData = convertToFleetFormat(fleetData, 0);
                
                if (!deckData || deckData === '{}') {
                    popup({ type: 'warning', content: '艦隊數據為空，請先編排艦隊' });
                    return;
                }

                // 打開 kc-web
                openKcWeb(deckData);
                
                popup({ type: 'success', content: '已開啟 kc-web，請在頁面中確認數據' });
            } catch (e) {
                console.error('kc-web export error:', e);
                popup({ type: 'error', content: `導出失敗：${e.message}` });
            }
        },
    });

    // 註冊快捷鍵（可選）
    poi.registerShortcut({
        key: 'KC_WEB_EXPORT',
        name: 'Export to kc-web',
        accelerator: 'CmdOrCtrl+Shift+E',
        onClick() {
            main(poi).default(poi);
        },
    });
}
