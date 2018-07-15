const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const {generateMessage, generateLocationMessage} = require('./utils/message');
const {isRealString, titleCase} = require('./utils/validation');
const {User} = require('./utils/users');
const publicPath = path.join(__dirname , '../public');
const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var users = new User();

app.use(express.static(publicPath));

io.on('connection', function(socket){
	console.log('new user connected');

	socket.on('join', function(params, callback){

		params.name = titleCase(params.name);

		if(!isRealString(params.name) || !isRealString(params.room)) {
			return callback('Username and Chat Group name are required');
		}

		var members = users.getUserList(params.room);
		var member = members.filter(function(member){
			return member === params.name ; 
		});
		console.log(member);
		if( member[0]) {
			return callback('Username already taken');
		}

		socket.join(params.room);
		users.removeUser(socket.id);
		users.addUser(socket.id, params.name, params.room);


		io.to(params.room).emit('updateUserList', users.getUserList(params.room));
		//emit to the socket only
		socket.emit('adminMessage', 'Welcome to chat app');
		//emit to everyone except the socket itself
		socket.broadcast.to(params.room).emit('adminMessage',`${params.name} has joined`);
		callback();
	});	

	socket.on('createMessage', function(message, callback){
		var user = users.getUser(socket.id);

		if(user && isRealString(message.text)){
			//emit to everyone
			io.to(user.room).emit('newMessage', generateMessage(user.name, message.text));
		}
		
		callback();
	});

	socket.on('createLocationMessage', function(coords){
		var user = users.getUser(socket.id);
		if(user){
			io.to(user.room).emit('newLocationMessage',generateLocationMessage(user.name, coords.latitude, coords.longitude));
		}
	});

	socket.on('disconnect', function(){
		var user = users.removeUser(socket.id);

		if (user) {
			io.to(user.room).emit('updateUserList', users.getUserList(user.room));
			io.to(user.room).emit('adminMessage', `${user.name} has left`);
		}
	});
});


server.listen( port , function(){
	console.log('server is up on port 3000');
});
