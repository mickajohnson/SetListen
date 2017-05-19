var express = require("express");
var path = require("path");
var app = express();
var root = __dirname;

app.use(express.static(path.join(root, "client")));
app.use(express.static(path.join(root, "bower_components")));

app.get('/callback', function (req, res){
  console.log(req);
  console.log(res);
  res.redirect('/')
});

app.listen(8080, function(){console.log("listening on port 8080");
})
