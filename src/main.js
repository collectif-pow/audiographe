import { WSAEDQUOT } from 'constants';

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

io.on('connection', socket => {
	console.log('a user connected');
	socket.on('fft', data => {
		console.log(data);
		socket.broadcast.emit('fft', data);
	});
});

http.listen(3600, () => {
	console.log('listening on *:3000');
});
