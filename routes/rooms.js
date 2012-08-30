var Chat = require('./chat');

module.exports = function(app) {
	var io = require('socket.io').listen(app);
	var sys = require('util');
	var uuid   = require('node-uuid');
	var nicknames = {};
	var clients = {};

	io.configure('development', function() {
		io.enable('browser client etag');
		io.set('close timeout', 30);
		io.set('polling duration', 20);
		io.set('log level', 3);
		io.set('transports', [
		                      'websocket',
		                      'flashsocket',
		                      'jsonp-polling'
		                      ]);

		/*
       
		                      'htmlfile',
		                      'xhr-polling',
		 */
	});

	var Room = io.of('/room').on('connection', function(socket) {

		var joinedRoom = null;
		var joinedAdminRoom = null;

		var myNickName = null;
		var mySessionId = null;

		clients[socket.id] = socket;

		// 접속 종료시 Event
		socket.on('disconnect', function () {
			sys.debug('disconnect');  

			if(joinedRoom){
				Chat.leaveRoom(joinedRoom, socket.nickname);
				socket.broadcast.to(joinedRoom).emit('leaved', {nickName: socket.nickname , attendants: Chat.getAttendantsList(joinedRoom)});
				socket.leave(joinedRoom);
				joinedRoom = null;
			}
			
			if(joinedAdminRoom){
				Chat.leaveAdminRoom(joinedAdminRoom, socket.nickname);
				socket.broadcast.to(joinedAdminRoom).emit('leaved', {nickName: socket.nickname});
				socket.leave(joinedAdminRoom);
				joinedAdminRoom = null;
			}
			
			if(socket.isAdminMessager != null && socket.isAdminMessager == 'Y')
			{
				Chat.removeAdminList(socket.id, socket.nickname);
				
				var adminRooms = Chat.getAdminList();
			    var otherAdminList = adminRooms.filter(function(element) {
		           return (element.socketId != socket.id); 
		        });
			    
			    otherAdminList.forEach(function(element, index, arr) {
		           var userSocketId = element.socketId;
		           
		           if(clients[userSocketId] != null) {
						clients[userSocketId].emit('AdminListUpdate', {
							adminList : Chat.getAdminList()
						});
		           }
		        });
			}
			
			delete clients[socket.id];
		});

		// 채팅방 나가기 Event
		socket.on('leave', function (data) {
			sys.debug('leave Event'); 

			if(joinedRoom){
				Chat.leaveRoom(joinedRoom, data.nickName); //data.nickName);
				socket.broadcast.to(joinedRoom).emit('leaved', {nickName: data.nickName,  attendants: Chat.getAttendantsList(joinedRoom)});
				socket.leave(joinedRoom);
				joinedRoom = null;
			}
		});


		socket.on('testleave',function(data) {

			var roomName = data.subj + data.year + data.subjseq;

			if(data.reconnectName)
			{
				sys.debug("Has reconnect name !!! ... " + joinedRoom + socket.nickname);
				Chat.leaveRoom(roomName, data.reconnectName);
				socket.broadcast.to(roomName).emit('leaved',
						{nickName: myNickName,  attendants: Chat.getAttendantsList(joinedRoom)});
				joinedRoom = null;
			}
		});

		// 채팅방 접속 Event
		socket.on('join' , function(data) {
			sys.debug('Join Room!!!');
			var roomName = data.subj + data.year + data.subjseq;

			if(joinedRoom == roomName)
			{
				socket.emit('joined', { error: '현재 접속한 방입니다'} );
				return;
			}
			else if(joinedRoom  != null && joinedRoom != roomName)
			{
				Chat.leaveRoom(joinedRoom, data.nickName);
				socket.broadcast.to(joinedRoom).emit('leaved',
						{nickName: myNickName,  attendants: Chat.getAttendantsList(joinedRoom)});
				socket.leave(joinedRoom);
				joinedRoom = null;
			}

			if(data.reconnectName)
			{
				sys.debug("Has reconnect name !!! ... " + joinedRoom + socket.nickname);
				Chat.leaveRoom(roomName, data.reconnectName);
				socket.broadcast.to(roomName).emit('leaved',
						{nickName: myNickName,  attendants: Chat.getAttendantsList(roomName)});
				joinedRoom = null;
			}

			if(!Chat.hasRoom(roomName)){
				sys.debug('방이 존재하지않으므로 방생성!!!');
				Chat.addRoom(roomName,data.subj,data.year,data.subjseq);
			}

			joinedRoom = roomName;
			socket.join(joinedRoom);
			myNickName =  socket.nickname = Chat.joinRoom(joinedRoom, data.nickName);

			socket.emit('initJoined', {
				isSuccess: true, nickName : myNickName,  attendants: Chat.getAttendantsList(roomName)
			});
			socket.broadcast.to(joinedRoom).emit('joined', {
				isSuccess: true, nickName : myNickName,  attendants: Chat.getAttendantsList(roomName)
			});

		});

		// 1:1 채팅방 생성 및 접속 Event (
		socket.on('joinAdminRoom' , function(data) {
			sys.debug('Join Admin Room!!!');
			var roomName = uuid.v4();

			sys.debug('관리자와 1:1 채팅을 위한 방생성이 생성되었습니다 - RooName : ' + roomName);
			Chat.addAdminRoom(roomName);
			joinedAdminRoom = roomName;
			socket.join(joinedAdminRoom);
			Chat.joinAdminRoom(joinedAdminRoom, socket.nickname);
			
			socket.broadcast.to(joinedAdminRoom).emit('joined', {
				isSuccess: true, nickName : myNickName
			});

			// 관리자를 초대합니다
			var randomSocketId = Chat.getRandomAdminSocketId();
			if(clients[randomSocketId] != null) {
				clients[randomSocketId].emit('invitedAdmin', {
					roomName : roomName,
					msg : data.msg ,
					loginId : myNickName,
					userId : data.userId
				});
			}
			else {
				socket.emit('noAdminList');
			}
		});

		// 1:1 채팅방 관리자 접속 Event (
		socket.on('joinAdminRoomByAdmin' , function(data) {

			sys.debug('Join Admin Room By Admin');
			var roomName = data.roomName;

			joinedAdminRoom = roomName;
			socket.join(joinedAdminRoom);
			Chat.joinAdminRoom(joinedAdminRoom, socket.nickname);
			
			socket.emit('initJoined', {
				isSuccess: true, nickName : myNickName
			});

			socket.broadcast.to(joinedAdminRoom).emit('joined', {
				isSuccess: true, nickName : myNickName
			});
		});

		socket.on('message' , function(data) {
			if(joinedRoom) {
				sys.debug('과정 채팅 메세지가 전달되었습니다');
				socket.emit('message',{nickName:socket.nickname  , msg: data.msg});
				socket.broadcast.to(joinedRoom).json.send({nickName:socket.nickname  , msg: data.msg});   
			}  if(joinedAdminRoom) {
				sys.debug('1:1 채팅 메세지가 전달되었습니다');
				socket.emit('message',{nickName:socket.nickname  , msg: data.msg});
				socket.broadcast.to(joinedAdminRoom).json.send({nickName:socket.nickname  , msg: data.msg});   
			} else {
				sys.debug('message failure!!');
			}

		});

		socket.on('makeRoom' , function(data) {
			Chat.addRoom(roomName,data.subj,data.year,data.subjseq);
			socket.emit('makeRoomSuccess', { roomList : Chat.getRoomList()});  
			socket.broadcast.emit('getAllRoomList',{ roomList : Chat.getRoomList()});  
		});


		socket.on('connectChatServer' , function(data, fn) {
			sys.debug('connectChatServer !!!!!!!!!!!!!');          
			if(data.nickName != '')
			{
				fn({ isSuccess : true});
			}
			else
			{
				fn({ isSuccess : false}); 
			}
		});
		
		socket.on('connectOneByOneChatServer' , function(data, fn) {
			sys.debug('connectChatServer !!!!!!!!!!!!!');          
			if(data.nickName != '')
			{

				if(data.isAdmin != null && data.isAdmin != '')
					socket.isAdmin = data.isAdmin;
				
				if(socket.isAdmin == 'Y')
					myNickName = socket.nickname = data.nickName + ' ( Administrator )';
				else
					myNickName = socket.nickname = data.nickName;
				
					
				fn({ isSuccess : true , nickName : socket.nickname});
			}
			else
			{
				fn({ isSuccess : false}); 
			}
		});

		socket.on('connectAdminServer' , function(data, fn) {
			sys.debug('[MetaChat] 관리자 ( ' + data.nickName + ' - ' +  data.sessionId + ' ) 접속 하였습니다.');          
			if(data.nickName != '')
			{
				fn({ isSuccess : true});
				myNickName =  socket.nickname = data.nickName;
				mySessionId = socket.sessionId = data.sessionId;
				socket.isAdminMessager = 'Y';
			}
			else
				fn({ isSuccess : false});    
		});

		socket.on('addAdminList' , function(data, fn) {
			sys.debug('[MetaChat] 관리자 ( ' + socket.nickname + ' - ' +  socket.sessionId + ' ) 가 상담원 대기열에 추가 되었습니다');          

			if(!Chat.hasAdminAttendant(socket.nickname))
			{
				Chat.addAdminUser(socket.id , socket.nickname);
				fn({ isSuccess : true ,  adminList : Chat.getAdminList()});
			}
			else {
				if(clients[Chat.getAdminSocketId(socket.nickname)] != null)
					clients[Chat.getAdminSocketId(socket.nickname)].emit('force-disconnect');
				
				//Chat.removeAdminList(socket.nickname);
				Chat.addAdminUser(socket.id , socket.nickname);
				fn({ isSuccess : false ,  errorMessage : '이미 해당 아이디는 등록되어 있습니다. 해당 아이디 삭제 후 재등록합니다' , adminList : Chat.getAdminList()});
			}
			
			var adminRooms = Chat.getAdminList();
		    var otherAdminList = adminRooms.filter(function(element) {
	           return (element.socketId != socket.id); 
	        });
		    
		    otherAdminList.forEach(function(element, index, arr) {
	           var userSocketId = element.socketId;
	           
	           if(clients[userSocketId] != null) {
					clients[userSocketId].emit('AdminListUpdate', {
						adminList : Chat.getAdminList()
					});
	           }
	        });	   
		});
	});

};