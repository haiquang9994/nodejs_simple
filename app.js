var express = require('express'),
        app = express(),
        server = require('http').createServer(app),
        io = require('socket.io').listen(server),
        port = process.env.PORT || 3000;

server.listen(port);
// app.use('/public', express.static(__dirname + '/public'));

var allClients = [];
var rooms = [];

app.get('/cdn/css/:path', function (req, res) {
    res.sendFile(__dirname + '/public/css/' + req.params.path);
});
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/view/webcome.html');
});
app.get('/chat', function (req, res) {
    res.sendfile(__dirname + '/view/chat.html');
});
app.get('/danh-sach-phong', function (req, res) {
    res.sendfile(__dirname + '/view/room-list.html');
});

io.sockets.on('connection', function (socket) {
    socket.on('submit_input_name', function (data) {
        allClients[data.id] = {
            id: data.id,
            name: data.name
        };
        io.to(socket.id).emit('submit_success', {
            state: true,
            id: data.id
        });
    });


    //allClients.push(socket);
    io.sockets.emit('has_connect', socket.id);

    socket.on('send_message', function (data) {
        io.sockets.in(socket.room).emit('new_message', data);
//        socket.broadcast.emit('new_message', data);
    });

    socket.on('get_rooms', function (data) {
        io.to(socket.id).emit('return_get_rooms', {rooms: rooms});
    });

    socket.on('create_room', function (data) {
        var room = Math.floor((Math.random() * 9000) + 1000);
        rooms.push(room);
        io.sockets.emit('return_get_rooms', {rooms: rooms});
        io.to(socket.id).emit('return_create_room', {room: room});
    });

    socket.on('join_room', function (data) {
        socket.room = data.room;
        socket.infoU = allClients[data.login];
        socket.join(data.room);
        io.to(socket.id).emit('return_join_room', allClients[data.login]);
        io.sockets.in(socket.room).emit('client_connect', allClients[data.login]);
    });

    socket.on('disconnect', function () {
        if (socket.infoU) {
            io.sockets.in(socket.room).emit('client_leave', {name: socket.infoU.name, id: socket.infoU.id});
        }
        socket.leave(socket.room);
    });
});