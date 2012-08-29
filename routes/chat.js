
var sys = require('util');

var Chat = module.exports = {
 
    users : []
    // 사용자 관련
	, adminUsers : []
    // 사용자 관련
    , rooms: [] 
    // 채팅방 관련
	, adminRooms: [] 
	// 채팅방 관련
    , lastJoinRooms: []
    // 최종 접속 방
    , addUserLastRoom: function(roomName,user){
        this.deleteUserLastRoom(user);
        this.lastJoinRooms.push( { name: roomName, user: user } );   
    }
    , deleteUserLastRoom: function(user){
        
        this.lastJoinRooms.forEach(function(element, index, arr) {
           if( element.user === user ) {
             arr.splice(index, 1);   
           }
        });
        
    }, getUserLastRoom: function(user){
        
        var lastRooms = this.lastJoinRooms.filter(function(element) {
           return (element.user === user); 
        });
        
        return lastRooms[0].name;
    }
    , hasUser : function(nickName) {
        var users = this.users.filter( function ( element ) {
            return(element === nickName); 
        });
        
        if(users.length > 0 ) {
            return true;   
        } else {
            return false;   
        }   
    }
    , addUser : function (nickName) {
        this.users.push(nickName);   
    } 
    // 관리자 추가
    , addAdminUser : function (id , nickName) { 
        this.adminUsers.push({ socketId : id , nickname : nickName });   
    }
    , hasRoom : function (roomName) {
        var rooms = this.rooms.filter(function(element) {
           return (element.name === roomName); 
        });
        
        if( rooms.length > 0 ) {
            return true;   
        } else {
            return false;
        }
    }
    , addRoom: function(roomName,subj,year,subjseq){
        this.rooms.push( { name: roomName, subj: subj, year:year, subjseq:subjseq, attendants:[]} );   
    }
    , addAdminRoom: function(roomName){
        this.adminRooms.push( { name: roomName , attendants:[]} );   
    }
    , getRoomList: function() {
        return this.rooms.map( function(element){
            return element.name;
        });
    }
    , joinRoom : function(roomName, user) {
        var rooms = this.rooms.filter(function(element) {
            return (element.name === roomName); 
        });
        
        var joinUser = '';
        
        if( !this.hasAttendant(rooms[0].attendants, user)){
            sys.debug(' Room Name : ' + rooms[0].name + ' Join User : ' + user);
            rooms[0].attendants.push(user);
            joinUser = user;
        } else {
            
            var userList = rooms[0].attendants.filter(function(element) {
                
               return (String(element).split(' ')[0] === user); 
            });
            
            var maxValue = 0;
            
            for(var i = 0; i < userList.length; i++)
            {
                var userNumber = String(String(userList[i]).split(' ')[1]).replace('(','').replace(')','');
                
                sys.debug('User Number : ' + userNumber);
                
                if(maxValue < Number(userNumber))
                    maxValue = userNumber;
            }
            maxValue++;
            
            rooms[0].attendants.push(user + ' (' + maxValue + ')');
            
            joinUser = user + ' (' + maxValue + ')';
        }
        
        return joinUser;
    }
    , joinAdminRoom : function(roomName, user) {
        var rooms = this.adminRooms.filter(function(element) {
            return (element.name === roomName); 
        });
        
        var joinUser = '';
        sys.debug(' Room Name : ' + rooms[0].name + ' Join User : ' + user);
        rooms[0].attendants.push(user);
        joinUser = user;
        return joinUser;
    }
    
    , hasAttendant: function(attendants, user) {
       return attendants.some(function(element) {
          return (element === user); 
       });
        
    }
    , getAttendantsList: function(roomName) {
        var rooms = this.rooms.filter(function(element) {
           return (element.name === roomName); 
        });
        
        return rooms[0].attendants;
    }
    , getAdminRoomAttendantsList: function(roomName) {
        var rooms = this.adminRooms.filter(function(element) {
           return (element.name === roomName); 
        });
        
        return rooms[0].attendants;
    }
    , hasAdminAttendant: function(nickName) {
    	var admin = this.adminUsers.filter(function(element) {
           return (element.nickname === nickName); 
        });
         
         if( admin.length > 0 ) {
             return true;   
         } else {
             return false;
         }
     }
    , getAdminList: function() {
        return this.adminUsers;
    }
    , getAdminSocketId: function(nickName) {
    	 var admin = this.adminUsers.filter(function(element) {
            return (element.nickname === nickName); 
         });
    	
		 if( admin.length > 0 ) {
			 return admin[0].socketId;
		 }
		 else{
			 return -1;
		 }
    }
    , removeAdminList: function(nickName) {
    	this.adminUsers.forEach(function(element, index, arr) {
	        if( element.nickname === nickName ) {
	          arr.splice(index, 1);   
	        }
        });
    }
    , leaveRoom: function(roomName, user) {
        var room = this.rooms.filter(function(element) {
           return (element.name === roomName); 
        });
        
        sys.debug('leaveRoom : rooms Name :' + roomName);
        sys.debug('leaveRoom : rooms length :' + room.length);
        sys.debug('leaveRoom : rooms length :' + user);
        sys.debug('leaveRoom : rooms length :' + room[0].attendants);
        
       if(this.hasAttendant(room[0].attendants, user)){
           room[0].attendants.forEach(function(element, index, arr) {
	           if( element === user ) {
	             arr.splice(index, 1);   
	           }
           });
       }
    }
    , leaveAdminRoom: function(roomName, user) {
        var room = this.adminRooms.filter(function(element) {
           return (element.name === roomName); 
        });
        
        sys.debug('leaveRoom : rooms Name :' + roomName);
        sys.debug('leaveRoom : rooms length :' + room.length);
        sys.debug('leaveRoom : rooms length :' + user);
        sys.debug('leaveRoom : rooms length :' + room[0].attendants);
        
       if(this.hasAttendant(room[0].attendants, user)){
           room[0].attendants.forEach(function(element, index, arr) {
	           if( element === user ) {
	             arr.splice(index, 1);   
	           }
           });
           
           if(room[0].attendants.length == 0)
           {
        	   sys.debug('남은 유저가 없으므로 방을 삭제합니다');
        	   
        	   this.adminRooms.filter(function(element, index, arr) {
	    	        if(element.name === room[0].name ) {
	    	          arr.splice(index, 1);   
	    	        }
	           });
        	   
        	   if(this.adminRooms != null)
        		   sys.debug('남은 1:1 채팅방 수 : ' + this.adminRooms.length);
           }
       }
    }
}