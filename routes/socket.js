const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const router = express.Router();


module.exports = function (io) {
    let room = [];
    let a = 0;

    io.on('connection', (socket) => {
        console.log('user connected');
        socket.on('disconnect', () => {
            console.log('user disconnected');
        });


        socket.on('leaveRoom', (num, name) => {
            socket.leave(room[num], () => {
                console.log(name + ' leave a ' + room[num]);
                io.to(room[num]).emit('leaveRoom', num, name);
            });
        });

        //manager가 room에 들어오면 그 제목의 그룹 조회해서 
        socket.on('joinRoom', (num, name) => {
            socket.join(room[num], () => {
                console.log(name + ' join a ' + room[num]);
                io.to(room[num]).emit('joinRoom', num, name);
            });
        });


        socket.on('chat message', (num, name, msg) => {
            a = num;
            io.to(room[a]).emit('chat message', name, msg);
        });
    });
};

