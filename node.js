const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatChat = require('./utils/messages');
const { userJoinsChat, getCurrentUser, userLeavesChat, getRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Diskord Bot'

// Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoinsChat(socket.id, username, room);
        
        socket.join(user.room);

        // Welcome current user
        socket.emit('message', formatChat(botName, 'Welcome to Diskord'));

        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatChat(botName, `${user.username} has joined the chat`));

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoom(user.room)
        });
    })

    // Listen for chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatChat(user.username, msg));
    });

    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeavesChat(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatChat(botName, `${user.username} has left the chat`));

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoom(user.room)
            });
        }
    });
});

const port = 3000;

server.listen(port, () => console.log(`Server running on ${port}`));