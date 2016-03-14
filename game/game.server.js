/**
 * Created by root on 12/03/16.
 */


var io = require('socket.io')();
var _users = [];
var _numUsers = 0;
var _marks = [];
var getCoordinates = function(civilization){
    var cities = {
        'Albolote': { x: 37.23052, y: -3.65701},
        'Atarfe': { x: 37.222270, y: -3.68862},
        'Maracena': { x:37.20811, y: -3.63184},
        'SantaFe': { x:37.18928, y: -3.71842}
    };
    return cities[civilization];
};

io.on('connection', function (socket) {
    socket.on('newUser', function (data) {
        _numUsers++;
        var user = {
                'id': socket.id,
                'username': data.username,
                'color': data.color,
                'civilization': data.civilization,
                'coordinates': getCoordinates(data.civilization)
            };
        _users.push(user);
        console.log("NUEVO USUARIO::: USER --> "+user.username+ "N--> "+_users.length+"\n");
        socket.emit('sendMap', user);
        io.sockets.emit('syncUsers', _users );
    });

    socket.on('getData', function () {
        socket.emit('takeData', {
            users: _users,
            marks: _marks
        });
    });
    socket.on('newMark', function (mark) {
        _marks.push(mark);
        io.sockets.emit('syncMarks', _marks );
        console.log("NUEVO MARCADOR::: USER --> "+mark.player+ " Marks -->"+mark.coordinates.len+ " N--> "+_marks.length+"\n");
    });
    socket.on('moveMark', function (soldier) {

    });
    socket.on('deleteMark', function (soldier) {
        _marks.forEach(function(mark, idx){
            if ((mark.coordinates.lat == soldier.coordinates.lat)&&(mark.coordinates.lng == soldier.coordinates.lng)){
                console.log("MARCADOR BORRADO::: USER --> "+mark.player+ " Marks -->"+mark.coordinates.lat+ " N--> "+_marks.length+"\n");
                _marks.splice(idx, 1);
            }
        });
        io.sockets.emit('syncMarks', _marks );
        io.to(soldier.player).emit('oneKill', { latlng: soldier.coordinates } );
    });

    socket.on('disconnect', function () {
        _users.forEach(function(user, idx){
            if ( user.id = socket.id ) _users.splice(idx, 1);
        });
        _marks.forEach(function(mark, idx){
            if (mark.id == socket.id)  _marks.splice(idx, 1);
        });
        io.sockets.emit('syncUsers', _users );
        io.sockets.emit('syncMarks', _marks);
        console.log("UNO QUE SE VA");
        console.log("USERS --> "+_users.length+ " Marks -->" +_marks.length+"\n");
    });
});

module.exports = io;