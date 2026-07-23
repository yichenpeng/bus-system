const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 設定靜態檔案資料夾（讓前端的 html、css 可以被讀取）
app.use(express.static(path.join(__dirname)));

// 伺服器保存目前系統的完整狀態
// 這樣中途才連進來的顯示幕 / 駕駛端，也能馬上拿到最新資料，不用等下一次同步
let state = {
    stations: [],          // 站點清單 [{name, address, lat, lon}]
    targetIndex: 0,         // 目前「目標站」（正在前往、尚未抵達的站）的索引
    stationPhase: 'next',   // 'next'：下一站（距離 > 500m） / 'arriving'：即將到站（距離 <= 500m） / 'finished'：已抵達最後一站
    announcements: [],      // 跑馬燈宣導訊息 [{id, text}]
    bellActive: false,      // 是否有尚未清除的下車鈴提示
    arrivalLog: []          // 到站時間紀錄 [{station, time, timestamp}]，供駕駛追蹤當天狀況
};

io.on('connection', (socket) => {
    console.log('有使用者連線進來了:', socket.id);

    // 新連線的人（顯示幕或駕駛端）馬上同步目前完整狀態
    socket.emit('full-state', state);

    // 駕駛端：站點清單 / 目標站 / 距離狀態 更新
    socket.on('driver-update-stations', (data) => {
        state.stations = data.stations || [];
        state.targetIndex = data.targetIndex ?? 0;
        state.stationPhase = data.stationPhase || 'next';

        io.emit('stations-update', {
            stations: state.stations,
            targetIndex: state.targetIndex,
            stationPhase: state.stationPhase
        });
    });

    // 駕駛端：跑馬燈宣導訊息更新（疫情、旅遊資訊、政令宣導...等）
    socket.on('driver-update-announcements', (data) => {
        state.announcements = data.announcements || [];
        io.emit('announcements-update', { announcements: state.announcements });
    });

    // 駕駛端：按下「確認到站」，記錄到站時間（供司機日後追蹤當天狀況）
    socket.on('driver-log-arrival', (data) => {
        const entry = {
            station: data.station,
            time: data.time,
            timestamp: Date.now()
        };
        state.arrivalLog.push(entry);
        io.emit('arrival-log-update', { arrivalLog: state.arrivalLog });
    });

    // 駕駛端：清空到站紀錄（例如一天行駛結束後重置）
    socket.on('driver-clear-log', () => {
        state.arrivalLog = [];
        io.emit('arrival-log-update', { arrivalLog: state.arrivalLog });
    });

    // 乘客端：按下下車鈴
    socket.on('press-bell', () => {
        state.bellActive = true;
        io.emit('bell-ring');
    });

    // 駕駛端：確認並清除下車鈴提示
    socket.on('clear-bell', () => {
        state.bellActive = false;
        io.emit('bell-clear');
    });

    socket.on('disconnect', () => {
        console.log('使用者斷線了:', socket.id);
    });
});

// 啟動伺服器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`伺服器正在 port ${PORT} 上執行中...`);
});
