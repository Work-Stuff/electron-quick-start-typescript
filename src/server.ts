import * as http from 'https';
import * as fs from 'fs';
import * as socketIo from 'socket.io';

const server = http.createServer({
    key: fs.readFileSync('./certificate/localhost_key.pem').toString(),
    cert: fs.readFileSync('./certificate/localhost_cert.pem').toString()
  }, (req, res) => {
    res.statusCode = 200;
    console.log('req.url', req.url);
    if ( req.url === '/calls/' ) {
      res.setHeader('Content-Type', 'text/html');
      res.write(fs.readFileSync("./dist/html/main.html", {encoding: "utf8"}));
    } else {
      res.setHeader('Content-Type', 'application/javascript');
      res.write(fs.readFileSync('.' + req.url, {encoding: "utf8"}));
    }
    res.end();
  });

server.listen(8888, "localhost");

const socketServer: socketIo.Server = socketIo(server);
socketServer.origins('*:*');

let connectedSocketIds: String[] = [];

socketServer.on('connection', (socket: socketIo.Socket) => {
  socket.on('join-call', () => {
    connectedSocketIds.push(socket.id);
    socket.emit('search-users', connectedSocketIds.filter(id => id !== socket.id));
  });
  socket.on('user-video-pause', (data: any) => {
    socket.broadcast.emit('user-video-pause', {
      userSocketId: socket.id,
      pause: data.pause
    } );
  });
  socket.on('user-audio-mute', () => {
    socket.broadcast.emit('user-audio-mute', socket.id);
  });
  socket.on('disconnect', () => {
    connectedSocketIds = connectedSocketIds.filter(id => id !== socket.id);
    socket.broadcast.emit('user-leave', socket.id);
  });
  socket.on('signaling', (data: any) => {
    socket.to(data.to).emit('signaling', data);
  });
});