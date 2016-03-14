/**
 * Created by jose on 4/03/16.
 */

var socket = io();
var mapGame = mapGame || {};

var zoom;
var _map = {};
var _myUser = {};
var _mySoldiers = [];
var _users = [];
var _marks = [];
var _callbackS = false;     //execute at map click
var _soldierT = null;       //id img
var _soldier = null;        //object clicked
var _mark = null;           //mark clicked
var _target = null;         //object clicked with callback on
var _target_mark = null;    //mark clicked with callback on
var _focus = null;          //Circle focus
var _area = null;           //Circle area
var _move = false;          //callback move
var _attack = false;        //callback attack

mapGame.prototype = {
    initLoad: function(){
        $('#main').show('slow');
    },
    joinToGame: function() {
        var username = $('#username').val();
        var color = $('#btnColor').css('backgroundColor');
        var civilization = $('#civilization').html();
        if((username=="") || (civilization==""))
            alert("Debes rellenar todos los campos");
        else{
            socket.emit('newUser', { username: username, color: color, civilization: civilization });
        }
    },
    goToMap: function(user){
        _myUser = user;
        $('#main').hide();
        $('#map').show('slow');
        setTimeout(function () {
            mapGame.prototype.createMap(user.coordinates);
            mapGame.prototype.createControls();
            var z = 1;
            var zooming = setInterval(function(){
                z++;
                _map.setZoom(zoom+z);
                if(z==6) clearInterval(zooming);
            }, 500);
        }, 500);
    },
    createMap: function(coordinates){
        $('#map').css( 'minHeight', $(window).innerHeight() + 'px' );
        zoom = 11;
        _map = L.map('map').setView([coordinates.x, coordinates.y], 11);
        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            accessToken: "pk.eyJ1Ijoiam9zZXZlMTQyIiwiYSI6ImNpbGNyeHc3ZDAwN293Ym02MHVkNDI2ZHcifQ.JRL8mYD-Ouq_8Gb_WSUBNA",
            maxZoom: 18,
            id: 'mapbox.streets',
            dragging: true,
            doubleClickZoom: true,
            boxZoom: true,
            keyboard: true,
            inertia: true,
            zoomAnimation: true,
            zoomAnimationThreshold: 8
        }).addTo(_map);
    },
    createControls: function(){
        var info = L.easyButton({
            id: 'info',
            position: 'topright',
            type: 'replace',
            leafletClasses: false,
            states:[{
                icon: 'fa-crosshairs'
            }]
        });
        var soldier1 = L.easyButton({
            id: 'soldier1',
            position: 'topright',
            type: 'replace',
            leafletClasses: false,
            states:[{
                onClick: function(button, map){
                    _callbackS = true;
                    _soldierT = 1;
                    $('#soldier2, #soldier3').css('border-left',0);
                    $('#soldier1').css('border-left', '5px solid red');
                },
                icon: 'fa-crosshairs'
            }]
        });
        var soldier2 = L.easyButton({
            id: 'soldier2',
            position: 'topright',
            type: 'replace',
            leafletClasses: false,
            states:[{
                onClick: function(button, map){
                    _callbackS = true;
                    _soldierT = 2;
                    $('#soldier1, #soldier3').css('border-left',0);
                    $('#soldier2').css('border-left', '5px solid red');
                },
                icon: 'fa-crosshairs'
            }]
        });
        var soldier3 = L.easyButton({
            id: 'soldier3',
            position: 'topright',
            type: 'replace',
            leafletClasses: false,
            states:[{
                onClick: function(button, map){
                    _callbackS = true;
                    _soldierT = 3;
                    $('#soldier1, #soldier2').css('border-left',0);
                    $('#soldier3').css('border-left', '5px solid red');
                },
                icon: 'fa-crosshairs'
            }]
        });
        var deleter = L.easyButton({
            id: 'deleter',
            position: 'bottomleft',
            type: 'replace',
            leafletClasses: false,
            states:[{
                onClick: function(button, map){
                    mapGame.prototype.controls.deleteMark();
                },
                icon: 'fa-crosshairs'
            }]
        });
        var move = L.easyButton({
            id: 'move',
            position: 'bottomleft',
            type: 'replace',
            leafletClasses: false,
            states:[{
                onClick: function(button, map){
                    mapGame.prototype.controls.moveMark();
                },
                icon: 'fa-crosshairs'
            }]
        });
        var attack = L.easyButton({
            id: 'attack',
            position: 'bottomleft',
            type: 'replace',
            leafletClasses: false,
            states:[{
                onClick: function(button, map){
                    mapGame.prototype.controls.attack();
                },
                icon: 'fa-crosshairs'
            }]
        });
        var controls = [
            info,
            soldier1,
            soldier2,
            soldier3,
            deleter,
            move,
            attack
        ];
        controls.forEach(function(_item){
            _item.addTo(_map);
        });
        var s_path = "/imgs/soldiers/";
        var c_path = "/imgs/controls/";
        $('#info').find('span').hide();
        $('#soldier1').append('<img src="'+s_path+_myUser.civilization +'-s1.png"/>');
        $('#soldier2').append('<img src="'+s_path+_myUser.civilization +'-s2.png"/>');
        $('#soldier3').append('<img src="'+s_path+_myUser.civilization +'-s3.png"/>');
        $('#move').append('<img src="'+c_path+'/move.png"/>');
        $('#attack').append('<img src="'+c_path+'attack.png"/>');
        $('#deleter').append('<img src="'+c_path+'deleter.png"/>');

        _map.on('click', function(e){
            mapGame.prototype.controls.mapClick(e)
        });
        socket.emit('getData', {});
    },
    loadInfo: function(users){
        var info =  "<div>" +
                        "<div class='col-xs-6'>"+
                            "<div class='col-xs-4 dataN'>Jugador:</div>" +
                            "<div class='col-xs-8 dataE'>"+_myUser.username+"</div>" +
                        "</div>"+
                        "<div class='col-xs-6 infoE'>"+
                            "<div class='col-xs-2 dataC' style='background:"+_myUser.color+"'></div>" +
                            "<div class='col-xs-10 dataE'>"+_myUser.civilization+"</div>" +
                        "</div>"+
                        "<div class='col-xs-9'>"+
                            "<div class='col-xs-6'>"+
                                "<div class='col-xs-8 dataN'>Nºsoldados:</div>" +
                                "<div id='nSoldiers' class='col-xs-4 dataE'>"+_mySoldiers.length+"</div>" +
                            "</div>"+
                            "<div class='col-xs-6'>"+
                                "<div class='col-xs-8 dataN'>Nºjugadores:</div>" +
                                "<div id='nUsers' class='col-xs-4 dataE'>"+users.length+"</div>" +
                            "</div>"+
                        "</div>"+
                        "<div id='_soldier' class='col-xs-3'>"+
                        "</div>"+
                    "</div>";
        $('#info').append(info);
    },
    syncUsers: function (users) {
        _users = users;
        $('#nUsers').html(_users.length);
    },
    syncMarks: function (marks) {
        _marks = marks;
        var allMarkersObjArray = [];
        var allMarkersGeoJsonArray = [];
        $.each(_map._layers, function (ml) {
            if (_map._layers[ml].feature)
                allMarkersObjArray.push(this);
                /*allMarkersGeoJsonArray.push(JSON.stringify(this.toGeoJSON()))*/
        });
        allMarkersObjArray.forEach(function(mark){
           _map.removeLayer(mark);
        });
        _marks.forEach(function(mark){
            mapGame.prototype.controls.createMark(mark.player, mark.coordinates,mark.civilization, mark.sType, true);
        });
    },
    controls: {
        mapClick: function(e){
            if(_callbackS){
                if(_soldierT != null){
                    mapGame.prototype.controls.createMark(_myUser.id, e.latlng,_myUser.civilization,_soldierT, false);
                    $('#soldier1, #soldier2, #soldier3').css('border-left',0);
                } else if(_move){
                    if(mapGame.prototype.controls.inRange(e.latlng)) {
                        mapGame.prototype.controls.rePaint(e.latlng);
                        _callbackS = false;
                        _move = false;
                    } else
                        alert("Muevete dentro de tu área");
                } else if(_attack)
                    alert("Seleciona un enemigo");
            } else {
                if((_soldier!=null)&&(_mark!=null)){
                    mapGame.prototype.controls.cleanFocus();
                    _soldier = null;
                    _mark = null;
                    _focus = null;
                    _target = null;
                }
            }
        },
        markClick: function(coords){
            if(_callbackS){
                if(_move) {
                    if(_target&&_target_mark)
                        alert("No puede moverte encima de otro jugador");
                } else if(_attack) {
                    if ((_soldier.coordinates.lat != _target.coordinates.lat) && (_soldier.coordinates.lng != _target.coordinates.lng)) {
                        if(_soldier.player!=_target.player) {
                            if (mapGame.prototype.controls.inRange(coords)) {

                                    coords = {
                                        lat: _target.coordinates.lat,
                                        lng: _target.coordinates.lng - 0.0006
                                    };
                                    mapGame.prototype.controls.rePaint(coords);
                                    setTimeout(function(){
                                        mapGame.prototype.controls.deleteMark(true);
                                        _attack = false;
                                        _callbackS = false;
                                        _soldier = null;
                                        _mark = null;
                                        _target = null;
                                        _target_mark = null;
                                    }, 1000);
                            } else {
                                alert("No esta dentro de tu rango");
                            }
                        } else {
                            alert("No puedes atacar a alguien de tu equipo");
                            _attack = true;
                        }
                    } else {
                        alert("No te puedes atacar a ti mismo...");
                        _attack = true;
                    }
                }
            } else {
                if((_soldier!=null)&&(_mark!=null)){
                    $('#_soldier').empty().append('<img src="/imgs/soldiers/'+_soldier.civilization+'-s'+_soldier.sType+'.png" />');
                    mapGame.prototype.controls.cleanFocus();
                    mapGame.prototype.controls.focusMark(_soldier.coordinates);
                }
            }
        },
        focusMark: function(coordinates) {
            _focus = new L.Circle([(coordinates.lat),coordinates.lng], 60, {
                fillColor: 'red',
                stroke: false,
                clickable: false,
                fillOpacity: 0.5
            });
            _area = new L.Circle([(coordinates.lat),coordinates.lng], 350, {
                fillColor: 'green',
                stroke: false,
                clickable: false,
                fillOpacity: 0.3
            });
            _area.addTo(_map);
            _focus.addTo(_map);
        },
        cleanFocus: function () {
            if((_focus!=null) && (_area!=null)){
                _map.removeLayer(_focus);
                _map.removeLayer(_area);
            }
        },
        createMark: function(owner, coordinates, civilization, soldierT, sync){
            var mark = {
                player: owner,
                civilization: civilization,
                coordinates: coordinates,
                sType: soldierT
            };
            if(sync) {
                var geojsonFeature = {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "type": "Point",
                        "coordinates": [coordinates.lat, coordinates.lng]
                    }
                };
                var marker;
                L.geoJson(geojsonFeature, {
                    pointToLayer: function (feature, latlng) {
                        marker = L.marker(coordinates, {
                                icon: L.icon({
                                    iconUrl: '/imgs/soldiers/' + mark.civilization + '-s' + mark.sType + '.png',
                                    iconSize: [50, 50]
                                })
                            })
                            .on("click", function(){
                                if((_mark==null)&&(_soldier==null)){
                                    _mark = this;
                                    _marks.forEach(function(mk){
                                        if((mk.coordinates.lat == _mark._latlng.lat) && (mk.coordinates.lng == _mark._latlng.lng)){
                                            _soldier = mk;
                                        }
                                    });
                                } else {
                                    if(_callbackS) {
                                        _target_mark = this;
                                        _marks.forEach(function (mk) {
                                            if ((mk.coordinates.lat == _target_mark._latlng.lat) && (mk.coordinates.lng == _target_mark._latlng.lng))
                                                _target = mk;
                                        });
                                    } else {
                                        _mark = this;
                                        _marks.forEach(function(mk){
                                            if((mk.coordinates.lat == _mark._latlng.lat) && (mk.coordinates.lng == _mark._latlng.lng))
                                                _soldier = mk;
                                        });
                                    }
                                }
                                mapGame.prototype.controls.markClick(this._latlng);
                            })
                            .addTo(_map);
                        return marker;
                    }
                }).addTo(_map);
            } else {
                _mySoldiers.push(mark);
                $('#nSoldiers').html(_mySoldiers.length);
                socket.emit('newMark', mark);
                _soldierT = null;
                _callbackS = false;
            }
        },
        moveMark: function(){
            if((_soldier!=null) && (_mark!=null)){
                if(_soldier.player == _myUser.id){
                    _move = true;
                    _callbackS = true;
                } else
                    alert("Solo puedes mover tus personajes")
            } else
                alert("Selecciona primero un personaje");
        },
        attack: function(){
            if((_soldier!=null) && (_mark!=null)){
                if((_soldier.player == _myUser.id)){
                    _attack = true;
                    _callbackS = true;
                } else
                    alert("Solo puedes atacar con tus personajes")
            } else
                alert("Selecciona primero quien atacará");
        },
        rePaint: function(latlng){
            mapGame.prototype.controls.createMark(_myUser.id, latlng,_myUser.civilization, _soldier.sType, false);
            mapGame.prototype.controls.deleteMark();
            mapGame.prototype.controls.cleanFocus();
        },
        inRange: function (latlng) {
                var current_x = _soldier.coordinates.lng;
                var current_y = _soldier.coordinates.lat;
                var new_x = latlng.lng;
                var new_y = latlng.lat;
                var diff_x = Math.abs((current_x) - (new_x)) < 0.0039165;
                var diff_y = Math.abs((current_y) - (new_y)) < 0.003145;
                var diff_diag = ((Math.abs((current_x) - (new_x))) + (Math.abs((current_y) - (new_y))) < 0.0050);
                return diff_x && diff_y && diff_diag;
        },
        deleteMark: function(kill){
            if(kill){
                if((_target!=null) && (_target_mark!=null)){
                        mapGame.prototype.controls.cleanFocus();
                        socket.emit('deleteMark', _target);
                        _callbackS = false;
                        _mark = null;
                }
            } else {
                if((_soldier!=null) && (_mark!=null)){
                    if(_soldier.player == _myUser.id){
                        _mySoldiers.forEach(function(soldier, idx){
                            if((soldier.coordinates.lat == _soldier.coordinates.lat)&&(soldier.coordinates.lng == soldier.coordinates.lng)){
                                _mySoldiers.splice(idx, 1);
                                $('#nSoldiers').html(_mySoldiers.length);
                                mapGame.prototype.controls.cleanFocus();
                                socket.emit('deleteMark', soldier);
                            }
                        });
                        _callbackS = false;
                        _soldier = null;
                        _mark = null;
                    } else
                        alert("Solo puedes eliminar tus personajes")
                } else
                    alert("Selecciona primero un personaje");
            }
        }
    }
};

$(document).ready(function() {

    mapGame.prototype.initLoad();
    $('.civilizacion').click(function () {
        $('#civilization').html($(this).prop('id'));
    });
    $('#play').click(function () {
        mapGame.prototype.joinToGame();
    });
    $(document).keydown(function (event) {
        if (event.ctrlKey == true && (event.which == '61' || event.which == '107' || event.which == '173' || event.which == '109' || event.which == '187' || event.which == '189'  ))
            event.preventDefault();
    });
    $(window).bind('mousewheel DOMMouseScroll', function (event) {
        if (event.ctrlKey == true)
            event.preventDefault();
    });

    socket.on('sendMap', function (user) {
        mapGame.prototype.goToMap(user);
    });
    socket.on('takeData', function (data) {
        mapGame.prototype.loadInfo(data.users);
        mapGame.prototype.syncMarks(data.marks);
    });
    socket.on('syncUsers', function(users){
            mapGame.prototype.syncUsers(users);
    });
    socket.on('syncMarks', function(marks){
        mapGame.prototype.syncMarks(marks);
    });
    socket.on('oneKill', function(e){
        _mySoldiers.forEach(function(soldier, idx){
            if ((soldier.coordinates.lat == e.latlng.lat)&& (soldier.coordinates.lng == e.latlng.lng))
                _mySoldiers.splice(idx, 1);
        });
        $('#nSoldiers').html(_mySoldiers.length);
    });


});
