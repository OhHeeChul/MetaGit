
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' })
};

var Room = io.of('/index').on('connection', function(socket) {
    
var currentRoom = null;
currentRoom = '나만의방';
socket.join(currentRoom);
socket.emit('joined',{
   isSuccess: true, nickName : 'aaa' 
});

socket.on('message' , function(data) {
    if(currentRoom) {
        socket.broadcast.to(currentRoom).json.send(data);   
    }
});
});