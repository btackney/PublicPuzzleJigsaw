//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//


//var randomPiece = Math.random() * pieces.length;

var pieces = [];

var viewerSockets=[];

var totalPieces=36;

for (var i=0;i<totalPieces;i++){
  var np=new Object();
  np.index=i;
  np.locked=false;
  np.player="";
  pieces.push(np);
}

function lockPiece(id) {
  pieces[id].locked=true;
}

function getPiece(name) {
  
  for (var j=0;j<pieces.length;j++) {
    if (pieces[j].name==name) {
      pieces[j].name="";
    }
  }
  
  var p=[];
  
  for (var i=0;i<pieces.length;i++) {
    if (pieces[i].locked==false) {
      if (pieces[i].player=="") {
        p.push(i);
      }
    }
  }
  
  if (p.length<1) return -1;
  
  // console.log(p);
  
  var jj=Math.floor(Math.random()*p.length);
  
  pieces[ p[jj] ].player=name;
  //console.log("array inside array" + name);
  return p[jj];
}


// var https = require('https');
// var path = require('path');

// var async = require('async');
// var socketio = require('socket.io');
// var express = require('express');
// var router = express();
// //var server = https.createServer(router);

// //var io = socketio.listen(server);

// router.use(express.static(path.resolve(__dirname, 'client')));

// --------------------Secure server code begin

var https = require('https');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');
var router = express();
var fs = require('fs');
var options = {
  key: fs.readFileSync('/etc/letsencrypt/live/www.tackney.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/www.tackney.com/cert.pem')
};
var app = require('https').createServer(options);
var io = require('socket.io').listen(app);
router.use(express.static(path.resolve(__dirname, 'client')));
// var fs = require('fs');
// var https = require('https');
// var app = require('express')();
// var options = {
//   key  : fs.readFileSync('server.key'),
//   cert : fs.readFileSync('server.crt')
// };
// app.get('/', function (req, res) {
//   res.send('Secure World!');
// });
// https.createServer(options, app).listen(3000, function () {
//   console.log('Started!');
// });

// --------------------Secure server code END



var sockets = [];

var viewerSocket = null;

io.on('connection', function (socket) {

    socket.emit('connect', "test");

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
        for (var j=0;j<pieces.length;j++) {
          pieces[j].name="";
        }
    });
    
    socket.on('VIEWER_LOGON', function () {
      //viewerSocket = socket;
      viewerSockets.push(socket);
    });

    socket.on('LOCK_PIECE', function (data) {
      lockPiece(data);
    });
    
    socket.on('DROP_PIECE', function (data) {
      pieces[data].player="";
     // console.log(JSON.stringify(pieces));
    });    
    
    socket.on('NEW_PIECE', function(data) {
      
      var whatPiece = -1;
      
      if (data.index>=0) pieces[data.index].player="";
      
      whatPiece=getPiece(data.player);
      
      socket.emit("PLAYER_PIECE", whatPiece);
      
        for (var i=0;i<viewerSockets.length;i++){
          if (viewerSockets[i]) viewerSockets[i].emit('PLAYER_DATA',{'player':data.player,'piece':whatPiece } );
        }      
      
    });
    
    socket.on('LOGON', function (user){
        //if (viewerSocket) viewerSocket.emit('PLAYER', user);
        
        for (var i=0;i<viewerSockets.length;i++){
          if (viewerSockets[i]) viewerSockets[i].emit('PLAYER',user);
        }
        // var data= {'player':user, 'index': getPiece(user)}
        // socket.emit("PLAYER_PIECE", data);
    });
    
    socket.on('PLAYER_MOVE', function (data){
       //if (viewerSocket) viewerSocket.emit('MOVE_PLAYER', data);
       
        for (var i=0;i<viewerSockets.length;i++){
          if (viewerSockets[i]) viewerSockets[i].emit('MOVE_PLAYER', data);
        }       
    });    
    
  });

app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = app.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
