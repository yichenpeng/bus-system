const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 設定 public 資料夾為靜態網頁檔案存放處
app.use(express.static(path.join(__dirname, '../public')));

// 監聽前端連線
io.on('connection', (socket) => {
  console.log('有裝置連線進來了 ID:', socket.id);

  // 1. 接收乘客按鈴
  socket.on('press-bell', () => {
    console.log('🔔 收到下車鈴信號！');
    io.emit('bell-ring'); // 廣播給所有畫面（跑馬燈端顯示鈴聲與音效）
  });

  // 2. 接收司機端更新的站名或跑馬燈
  socket.on('update-bus-info', (data) => {
    console.log('📢 更新公車資訊:', data);
    io.emit('bus-info-updated', data); // 廣播最新站名給跑馬燈
  });

  socket.on('disconnect', () => {
    console.log('有裝置離線了');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`伺服器已啟動，請打開網址：http://localhost:${PORT}`);
});

