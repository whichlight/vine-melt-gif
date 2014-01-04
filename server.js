var  fs = require('fs'),
  server = require('node-static'),
  config = require('./config.js'),
  Twit = require('twit'),
  request = require('request'),
  hyperquest = require('hyperquest'),
  util = require('util');

var EMBEDLY_KEY = config.embedly.key;
var id;
var tweets;

var T = new Twit({
  consumer_key:  config.twitter.consumerKey,
    consumer_secret: config.twitter.consumerSecret,
    access_token: config.twitter.accessToken,
    access_token_secret: config.twitter.accessTokenSecret
})

var fileServer = new server.Server();
var app = require('http').createServer(function (req, res) {
  if (req.url == '/getvine'){
     res.writeHead(200, {'Content-Type': 'text/plain'});
     sendVineVid(function(vineurl){
       res.end(vineurl);
     });
  }
  else{
    fileServer.serve(req, res);
  }
}).listen(8080);

var getTweet = function(callback){
  T.get('search/tweets', { q: 'vine.co', count: 1}, function(err, reply) {
    callback(reply);
  });
}

var parseTextForURL = function(text){
    var re = /(\b(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/ig;
    return text.match(re)[0];
}

var parseVineFromEmbed= function(html){
    console.log(html);
    var re = /(https.*\.mp4\%3F)/ig;
    return html.match(re)[0];
}

var fetchVineSrc = function(url, callback){
  embedlyOembed(url, function(html){
    var src = unescape(parseVineFromEmbed(html));
    callback(src);
  });
}

var embedlyOembed = function(url, callback){
  var call = "https://api.embed.ly/1/oembed?key="+EMBEDLY_KEY+"&url=";
  var req = request(call+url, function(err, res, body){
    if(!err && res.statusCode == 200){
      var embed = JSON.parse(body);
      callback(embed.html);
    }
  });
}

var sendVineVid= function(callback){
  getTweet(function(tweets){
    var vineurl = parseTextForURL(tweets.statuses[0].text);
    console.log("url from twitter: " + vineurl);
    fetchVineSrc(vineurl, function(src){
      console.log("vine movie src: " + src);
      id = src.match(/(videos\/.*\.mp4)/ig)[0].replace('videos/','');
      id = id.slice(0,-4);
      filename = __dirname + "/media/" + id +".mp4";
      var r = hyperquest(src);
      r.pipe(fs.createWriteStream(filename))
      r.on("end", function(){
        currentVineURL = 'media/'+id+'.mp4';
        console.log("saved movie: " + currentVineURL);
        callback(currentVineURL);
      });
    });
  });
}


