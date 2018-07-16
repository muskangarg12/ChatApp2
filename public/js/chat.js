var socket = io();

socket.on('connect', function() {
	var params = jQuery.deparam(window.location.search);

	socket.emit('join', params, function(err){
		if (err) {
			alert(err);
			window.location.href = '/';
		} else {
			console.log('No error');
		}
	});
});

function scrollToBottom () {
	//selectors
	var messages = jQuery('#messages');
	var newMessage = messages.children('li:last-child');
	//heights
	var clientHeight = messages.prop('clientHeight');
	var scrolltop = messages.prop('scrollTop');
	var scrollHeight = messages.prop('scrollHeight');
	var newMessageHeight = newMessage.innerHeight();
	var lastMessageHeight = newMessage.prev().innerHeight();

	if ((clientHeight + scrolltop + newMessageHeight + lastMessageHeight) >= scrollHeight) {
		messages.scrollTop(scrollHeight);
	}
}

socket.on('disconnect', function(){
	console.log('disconnected from server');
});

socket.on('updateUserList', function(users){
	var ol = jQuery('<ol></ol>');

	users.forEach(function(user){
		ol.append(jQuery('<li></li>').text(user));
	});

	jQuery('#users').html(ol);
});

socket.on('adminMessage', function(message){
	var template = jQuery('#admin-message-template').html();
	var html = Mustache.render(template, {
		text: message,
	});

	jQuery('#messages').append(html);
	scrollToBottom();
});

socket.on('newMessage', function(message){
	var formattedTime = moment(message.createdAt).format('h:mm a');
	var template = jQuery('#message-template').html();
	var html = Mustache.render(template, {
		text: message.text,
		from: message.from,
		createdAt: formattedTime
	});

	jQuery('#messages').append(html);
	scrollToBottom();
});

socket.on('newLocationMessage', function(message){
	var formattedTime = moment(message.createdAt).format('h:mm a');
	var template = jQuery('#locationMessage-template').html();
	var html = Mustache.render(template, {
		from: message.from,
		url: message.url,
		createdAt: formattedTime
	});

	jQuery('#messages').append(html);
	scrollToBottom();
});

jQuery('#message-form').on('submit', function(e){
	e.preventDefault();

	var messageTextbox = jQuery('[name=message]');

	socket.emit('createMessage', {
		text: messageTextbox.val()
	}, function(){
		messageTextbox.val("");
		jQuery(".emojionearea-editor").html("");
	});
});


var locationButton = jQuery('#send-location');
locationButton.on('click', function(){
	if(!navigator.geolocation){
		return alert('Geolocation not supported by your browser');
	}

	locationButton.attr('disabled', 'disabled').text('Sending location...');

	navigator.geolocation.getCurrentPosition( function(position){
		locationButton.removeAttr('disabled').text('Send location');
		socket.emit('createLocationMessage', {
			latitude: position.coords.latitude,
			longitude: position.coords.longitude
		});
	}, function(){
		locationButton.removeAttr('disabled').text('Send location');
		alert('Unable to fetch location.');
	});
});