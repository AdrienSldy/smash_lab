const express = require('express');
const app = express();
const socketIo = require('socket.io');


const http = require('http');
const server = http.Server(app);
const io = socketIo(server);


const getQuestion = require('./question/QuestionController.js');
const Api = require('./api.js');
require('dotenv').config()


server.listen(3100, function () {
  console.log('Example app listening on port 3100!');
});

app.get(['/','/question','/question/:category'], getQuestion);

app.use('/api', Api);

function matching(socket){
  if(!rooms.length){
    socket.room = 'lab_0';
    rooms.push({name: socket.room, players: [socket.id], lock: false});
    socket.join(socket.room);
  }else{
    let match = rooms.some((room, index) => {
      if(room.players.length < 2 && !room.lock){
        room.players.push(socket.id);
        room.lock = true;
        socket.room = room.name;
        socket.join(socket.room);
        return true;
      }
    });
    if(!match){
      socket.room = 'lab_' + (parseInt(rooms[rooms.length - 1].name.split("_")[1]) + 1);
      rooms.push({name: socket.room, players: [socket.id], lock: false});
      socket.join(socket.room);
    }
  }
}

function clean(socket){
  rooms.forEach((room, index) => {
    if(room.players.includes(socket.id)){
      console.log('user : ' + socket.id + ' delete of : ' + rooms[index].name);
      room.players.splice(room.players.indexOf(socket.id), 1);
      if(!room.players.length){
         console.log('rooms delete : ' + rooms[index].name);
        rooms.splice(index, 1);
      }
      console.log(rooms);
    }
  });
}

const rooms = [];

io.on('connection', (socket) => {

  matching(socket);

  console.log('Room: ' + socket.room);
  console.log('Rooms : ' + rooms);

  socket.emit('lab', socket.id);

  socket.on('start', () => {
    socket.to(socket.room).broadcast.emit('start', socket.id);
  });

  socket.on('match', () => {
    socket.to(socket.room).broadcast.emit('match', socket.id);
  })

  socket.on('heroSelected', (hero_id) => {
    socket.to(socket.room).broadcast.emit('enemySelection', hero_id);
  });

  socket.on('attack', (enemy) => {
    socket.to(socket.room).broadcast.emit('attack', enemy);
  });

  socket.on('disconnect', () => {
    clean(socket);
    console.log('disconnect');
  });
});