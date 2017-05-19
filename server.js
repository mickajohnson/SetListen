var express = require("express");
var path = require("path");
var app = express();
var root = __dirname;

app.use(express.static(path.join(root, "client")));
app.use(express.static(path.join(root, "bower_components")));

app.get('/callback', function (req, res){
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.redirect('/')
});

app.listen(process.env.PORT || 2401, function(){console.log("listening on port 8080");
})
