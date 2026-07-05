# poi API 參考

## 插件開發指南

poi 插件基於 Electron + React 架構，使用 Redux 進行狀態管理。

## 基本結構

```javascript
// index.es - 插件入口文件
export default function main(poi) {
    // 註冊菜單
    poi.registerMenu({
        title: '插件名稱',
        icon: 'fa/icon-name',
        onClick() {
            // 點擊處理邏輯
        }
    });
}
```

## poi 對象 API

### 狀態管理

```javascript
// 獲取 Redux store
const state = poi.store.getState();

// 常用路徑
state.fleet          // 艦隊數據
state.ship           // 艦娘數據
state.item           // 裝備數據
state.map            // 地圖數據
state.quest          // 任務數據
```

### 艦隊數據結構

```javascript
// poi.store.getState('fleet')
{
    fleets: [
        {
            ships: [
                {
                    id: 1,              // 艦娘 ID
                    level: 80,          // 等級
                    exp: 12345,         // 經驗值
                    equipment: [1, 2, 3, 4],  // 裝備列表 (ID)
                    hp: { current: 100, max: 100 },  // HP
                    fuel: { current: 50, max: 50 },   // 燃料
                    ammo: { current: 80, max: 80 },   // 彈藥
                    lu: 10,             // 運 (Luck)
                    as: 20,           // 対潜値
                    aa: 30,           // 対空値
                    extraEquipment: { id: 50 },  // 補強増設
                    ar: 1,            // 札
                    sp: 1,            // 海色ribbon/白たすき
                    hqLv: 120         // 提督等級
                }
            ]
        }
    ],
    admiralLevel: 120
}
```

### 艦娘數據結構

```javascript
// poi.store.getState('ship')
{
    ships: {
        '1': {
            id: 1,
            name: '初雪',
            type: '驱逐舰',
            masterId: 1,
            level: 80,
            exp: 12345,
            // ... 其他屬性
        }
    }
}
```

### 裝備數據結構

```javascript
// poi.store.getState('item')
{
    items: {
        '1': {
            id: 1,
            name: '12cm 単装砲',
            type: '主砲',
            // ... 其他屬性
        }
    }
}
```

## UI 相關 API

### 彈出提示

```javascript
import { popup } from 'poi/lib/ui/util/popup';

popup({
    type: 'success',  // success | warning | error | info
    content: '消息內容'
});
```

### 打開窗口

```javascript
import { ipcRenderer } from 'electron';

// 打開新窗口
const win = ipcRenderer.sendSync('poi:window-create', {
    title: '窗口標題',
    width: 1200,
    height: 800,
    url: 'https://example.com'
});
```

### 菜單註冊

```javascript
poi.registerMenu({
    title: '菜單位置',      // 菜單位置 (如 '工具欄')
    icon: 'fa/icon-name',  // Font Awesome 圖標
    onClick() { /* ... */ },
    priority: 90           // 優先級 (越高越靠前)
});
```

## 事件監聽

```javascript
// 監聽遊戲數據更新
poi.on('fleet-update', (data) => {
    console.log('艦隊已更新:', data);
});

// 監聽任務完成
poi.on('quest-complete', (questId) => {
    console.log('任務完成:', questId);
});
```

## 數據轉換示例

### poi → kc-web deck builder 格式

```javascript
function convertToFleetFormat(fleetData, fleetIndex) {
    const fleetNum = fleetIndex + 1;
    
    return {
        version: 4,
        hqlv: fleetData.admiralLevel || 120,
        [`f${fleetNum}`]: {
            ships: fleetData.fleets[fleetIndex].ships.map((ship, i) => ({
                i: ship.id,
                lv: ship.level,
                is: ship.equipment || [0, 0, 0, 0],
                hp: ship.hp?.current,
                lu: ship.lu,
                ex: ship.extraEquipment ? { i: ship.extraEquipment.id } : undefined
            }))
        }
    };
}
```

## 常見問題

### Q: 如何獲取當前選中的艦隊？
A: 使用 `poi.store.getState('fleet').selectedFleetIndex`

### Q: 如何更新艦隊數據？
A: 通過 dispatch Redux action：
```javascript
poi.store.dispatch({
    type: 'UPDATE_FLEET',
    payload: newData
});
```

### Q: 插件如何獲取用戶設置？
A: 使用 `poi.settings.get('plugin-name')`

## 參考資源

- [poi GitHub](https://github.com/poooi/poi)
- [poi Wiki](https://github.com/poooi/poi/wiki)
- [Electron API](https://www.electronjs.org/docs/api/)
- [Redux](https://redux.js.org/)
