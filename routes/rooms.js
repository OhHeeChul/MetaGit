var Chat = require('./chat');

module.exports = function(app) {
   var io = require('socket.io').listen(app);
   var sys = require('util');
   var uuid   = require('node-uuid');
   var nicknames = {};
   var clients = {};
   /*
   io.configure(function() {
      io.set('log level', 3);
      io.set('transports', [
         'websocket',
         'flashsocket',
         'htmlfile',
         'xhr-polling',
         'jsonp-polling'
      ]);
   });
   */
   
    var Room = io.of('/room').on('connection', function(socket) {
        
    var joinedRoom = null;
    clients[socket.id] = socket;
     
    socket.on('connectChatServer' , function(data) { 
    });
    
    socket.on('disconnect', function () {
        
         if(joinedRoom){
            Chat.leaveRoom(joinedRoom, socket.nickName);
            socket.broadcast.to(joinedRoom).emit('leaved',
            {nickName: socket.nickName});
            socket.leave(joinedRoom);
            joinedRoom = null;
        }
        
        delete clients[socket.id];
        // delete nicknames[socket.nickname];
    });
    
    socket.on('leave', function (data) {
        if(joinedRoom){
            Chat.leaveRoom(joinedRoom, data.nickName);
            socket.broadcast.to(joinedRoom).emit('leaved',
            {nickName: data.nickName});
            socket.leave(joinedRom);
            joinedRoom = null;
        }
    });
    
    
    socket.on('join' , function(data) {
        sys.debug('Join Room!!!');
        
        if(joinedRoom == data.roomName)
        {
            socket.emit('joined', { error: '현재 접속한 방입니다'} );
            return;
        }
        else if(joinedRoom  != null && joinedRoom != data.roomName)
        {
            Chat.leaveRoom(joinedRoom, data.nickName);
            socket.broadcast.to(joinedRoom).emit('leaved',
            {nickName: data.nickName,  attendants: Chat.getAttendantsList(joinedRoom)});
            socket.leave(joinedRoom);
            joinedRoom = null;
        }
        
        if(Chat.hasRoom(data.roomName)){
            
            joinedRoom = data.roomName;
            socket.join(joinedRoom);
            Chat.joinRoom(joinedRoom, data.nickName);
            socket.emit('joined', {
                isSuccess: true, nickName : data.nickName,  attendants: Chat.getAttendantsList(data.roomName)
            });
            socket.broadcast.to(joinedRoom).emit('joined', {
                isSuccess: true, nickName : data.nickName,  attendants: Chat.getAttendantsList(data.roomName)
            });
            
        } else {
            socket.emit('joined', { error: 'Room is not Exist'} );
        }
    });
    
        socket.on('message' , function(data) {
            if(joinedRoom) {
               sys.debug('message success!!');
                socket.broadcast.to(joinedRoom).json.send(data);   
            } else {
               sys.debug('message failure!!');
            }
            
        });
    
        socket.on('makeRoom' , function(data) {
            Chat.addRoom(uuid.v1(),data.subj,data.year,data.subjseq);
            socket.emit('makeRoomSuccess', { roomList : Chat.getRoomList()});  
            socket.broadcast.emit('getAllRoomList',{ roomList : Chat.getRoomList()});  
        });
    
        
        socket.on('connectChatServer' , function(data, fn) {
            
            
            
            socket.nickname = data.nickName;
            socket.set('nickname', data.nickName, function () {
            });
            socket.uuidCode = uuid.v1();
            socket.set('uuidCode', socket.uuidCode, function () {
            });
            
            sys.debug('Client Generate uuidCode  : ' + socket.uuidCode);
            
                if (nicknames[data.nickName]) 
                {
                    sys.debug('중복 로그인...');
                    fn(true);
                    
                    for (var socketId in clients){
                     
                       var userSocket = clients[socketId];
                       
                  
                       userSocket.get('nickname', function (err, name) {
                          userSocket.get('uuidCode', function (err2, uuid) {
                               sys.debug('Clients : ' + name + ' - ' + uuid);
                       
                               if(name === data.nickName &&  uuid != socket.uuidCode) {
                                sys.debug('socket disconnection method : ' + userSocket);
                                // userSocket.emit('forceDisconnect');
                                socket.broadcast.emit('forceDisconnect', socketId);
                               }
                          });
                       });
                    }
                    
                    delete nicknames[data.nickName];
                    nicknames[data.nickName] = data.nickName;
    
                } else {
                    fn(false);
                    nicknames[data.nickName] = data.nickName;
                }
                
            sys.debug('Clients NickName: ' + socket.nickname);
            socket.emit('getAllRoomList', { roomList : Chat.getRoomList()});   
        });
    

    });

};