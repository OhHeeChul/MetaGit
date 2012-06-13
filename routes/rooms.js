var Chat = require('./chat');

module.exports = function(app) {
   var io = require('socket.io').listen(app);
   var sys = require('util');
   var uuid   = require('node-uuid');
   var nicknames = {};
   var clients = {};

   io.configure('development', function() {
      io.set('close timeout', 12);
      io.set('polling duration', 8);
      io.set('log level', 3);
      io.set('transports', [
         'htmlfile',
         'xhr-polling',
         'jsonp-polling'
      ]);
      
      /*
         'websocket',
         'flashsocket',
      */
   });
   
    var Room = io.of('/room').on('connection', function(socket) {
        
    var joinedRoom = null;
    var myNickName = null;
    
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
    
        socket.on('message' , function(data) {
            if(joinedRoom) {
                sys.debug('message success!!');
                socket.emit('message',{nickName:socket.nickname  , msg: data.msg});
                socket.broadcast.to(joinedRoom).json.send({nickName:socket.nickname  , msg: data.msg});   
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
                fn({ isSuccess : true});
            else
                fn({ isSuccess : false});    
        });
        
    

    });

};