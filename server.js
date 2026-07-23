const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 設定靜態檔案資料夾（讓前端的 html、css 可以被讀取）
app.use(express.static(path.join(__dirname)));

// 監聽即時通訊連線
io.on('connection', (socket) => {
    console.log('有使用者連線進來了:', socket.id);

    // 接收駕駛介面傳來的站點清單更新，並廣播給所有連線的人（顯示幕等）
    socket.on('update-stations', (stations) => {
        io.emit('update-stations', stations);
    });

    // 接收乘客端的下車鈴訊號，並廣播給駕駛或其他端
    socket.on('press-bell', () => {
        io.emit('bell-ring');
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
