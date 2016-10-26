var url = require("url");
var qs = require('querystring');
var http = require("http");
var mysql      = require('mysql');
var express = require('express');


var dbInfo = {
  host     : 'localhost',
  user     : 'novaes',
  password : 'azsxdc',
  database : 'ws-maps'
};
var res;

var app = express();

app.get('/teste', function (req, res) {
   console.log("DDDD");
});


http.createServer(function(request, response) {
    var connection = mysql.createConnection(dbInfo);
    
    res = response;
    response.writeHead(200, {"Content-Type":"text/plain"});
    
    var option = request.url.split('/')[1];

    connection.query('SELECT * from Categories', getCategories);
    connection.end();
  
    
}).listen(8080);

function getCategories(err, rows, fields) {
      
      if (!err){
        res.write(JSON.stringify(rows));
        res.end();
      }else{
        console.log('Error while performing Query.');
      }

}

