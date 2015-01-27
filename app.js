var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var port = process.env.PORT || 5000;
var swig  = require('swig');

app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.set('view cache', false);
swig.setDefaults({ cache: false });

app.use(express.static(path.join(__dirname, '/game')));
app.use(express.static(path.join(__dirname, '/public')));

app.get('/', function(req, res){
	res.render('index');
});

http.listen(port, function(){
	console.log('listening on localhost:' + port);
});
