
var sys = require('util');

var Chat = module.exports = {
 
    users : []
    // 사용자 관련
    , rooms: [] 
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
    , getRoomList: function() {
        return this.rooms.map( function(element){
            return element.name;
        });
    }
    , joinRoom : function(roomName, user) {
        var rooms = this.rooms.filter(function(element) {
            return (element.name === roomName); 
        });
        
        if( !this.hasAttendant(rooms[0].attendants, user)){
            sys.debug(' Room Name : ' + rooms[0].name + ' Join User : ' + user);
            rooms[0].attendants.push(user);   
        }
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
    , leaveRoom: function(roomName, user) {
        var rooms = this.rooms.filter(function(element) {
           return (element.name === roomName); 
        });
        
        rooms[0].attendants.forEach(function(element, index, arr) {
           if( element === user ) {
             arr.splice(index, 1);   
           }
        });
    }
}