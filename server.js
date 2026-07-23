const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 設定靜態檔案資料夾，讓瀏覽器可以讀取 public 裡的網頁
app.use(express.static('public'));

// 當有使用者連線時
io.on('connection', (socket) => {
    console.log('有新的使用者連線進來了：', socket.id);

    // 接收駕駛員更新的站點清單
    socket.on('update-stations', (stations) => {
        console.log('收到新的站點清單:', stations);
        // 修改這裡：用 io.emit 廣播，並且事件名稱改成 'update-stations'
        io.emit('update-stations', stations);
    });

    // 接收駕駛員切換下一站的指令
    socket.on('update-next-station', (station) => {
        // 廣播給所有人當前站點
        io.emit('next-station-changed', station);
    });

    socket.on('disconnect', () => {
        console.log('使用者已離線：', socket.id);
    });
});

// 啟動伺服器，監聽 3000 通訊埠
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`伺服器已啟動！請在瀏覽器輸入: http://localhost:${PORT}/driver.html`);
});
