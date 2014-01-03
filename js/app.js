//https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/HTML-canvas-guide/PuttingVideoonCanvas/PuttingVideoonCanvas.html

var video,
    vidTimer,
    imgs = [],
    gif, gif2;

var frameRate = 1000/4.0;

var colArray = new Array();
var canvas = document.getElementById("canvas");
var dcanvas = document.createElement("canvas");
dcanvas.width = canvas.width;
dcanvas.height = canvas.height;


gif = new GIF({
  workers: 4,
    quality: 10,
    width: canvas.width,
    height: canvas.height,
    workerScript: 'libs/gif.worker.js'
});

gif.on('finished', function(blob){
  var gifimg = document.createElement('img');
  gifimg.id = 'result';
  gifimg.src = URL.createObjectURL(blob);
  $("body").append(gifimg);
});


gif2 = new GIF({
  workers: 4,
    quality: 10,
    width: canvas.width,
    height: canvas.height,
    workerScript: 'libs/gif.worker.js'
});

gif2.on('finished', function(blob){
  var gifimg = document.createElement('img');
  gifimg.id = 'result';
  gifimg.src = URL.createObjectURL(blob);
  $("body").append(gifimg);
});

var showVid = function() {
  var ctx = canvas.getContext('2d');
  //rotate so we sort vertically
  ctx.save();
  ctx.rotate(270 * Math.PI / 180);
  ctx.translate(-1*canvas.width,0);
  ctx.scale(0.5,0.5);
  ctx.drawImage(video, 0, 0);
  ctx.restore();
  var img = new Image();
  img.src=canvas.toDataURL();
  imgs.push(img);


  var dctx = dcanvas.getContext('2d');
  dctx.save();
  dctx.translate(1*canvas.width,0);
  dctx.rotate(90* Math.PI / 180);
  dctx.drawImage(img, 0, 0);
  dctx.restore();
  var img2 = new Image();
  img2.src=dcanvas.toDataURL();
  gif2.addFrame(img2, {delay:200});

  // Repeat 40 times a second to oversample 30 fps video
  vidTimer = setTimeout(showVid, frameRate);
}

var processImage = function(img, callback) {

  var dctx = dcanvas.getContext('2d');
  dctx.save();
  dctx.translate(1*canvas.width,0);
  dctx.rotate(90* Math.PI / 180);
  dctx.drawImage(img, 0, 0);
 console.log(dctx);
  dctx.restore();


  var ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  var pixData = pixels.data;
  pixels.data = pixData;
  ctx.putImageData(pixels, 0, 0);
  for(var i=0; i<(pixData.length/4); i++){
    colArray[i] = pixData.subarray(4*i, (4*i)+4);
  }



  var sortPixels = function(callback){

    var width = canvas.width;
    var height = canvas.height;
    var workersCount = 4;
    var finished = 0;
    var blockSize = Math.floor(height/workersCount);

    //get finished ones
    var onWorkEnded = function(e){
      var blockResult = e.data.result;
      var index = e.data.index;
      var start = index*(blockSize);
      var end = start+(blockSize);
      console.log("finished " + index);

      for(var j=start; j<end; j++){
        for(var i=0; i<width; i++){
          colArray[j*width+i] = blockResult[(j-start)*width+i];
        }
      }
      finished++;

      if(finished == workersCount){
        callback();
      }
    };

    for (var index = 0; index < workersCount; index++){
      console.log("start worker " + index);
      var worker = new Worker('js/sortProcessor.js');
      worker.onmessage = onWorkEnded;
      var start = index*(blockSize);
      var end = start+(blockSize);
      var segmentBlock = colArray.slice(start*width, start*width+ blockSize*width);
      worker.postMessage({
        data: segmentBlock,
        index:index,
        height:blockSize,
        width:width,
      });
    }
  }

  var writeToCanvas = function(){
    for(var i=0; i<(pixData.length/4); i++){
      pixData[4*i]=colArray[i][0];
      pixData[4*i+1]=colArray[i][1];
      pixData[4*i+2]=colArray[i][2];
      pixData[4*i+3]=colArray[i][3];
    }

    pixels.data = pixData;


    //in memory canvas to draw it rotated
    //see http://stackoverflow.com/questions/7638919/putimagedata-on-rotated-canvas-work-incorrect
    var mcanvas = document.createElement("canvas");
    mcanvas.width = canvas.width;
    mcanvas.height = canvas.height;
    mctx = mcanvas.getContext('2d');
    mctx.putImageData(pixels,0,0);

    ctx.save();
    ctx.translate(1*canvas.width,0);
    ctx.rotate(90* Math.PI / 180);
    ctx.drawImage(mcanvas, 0, 0);
    ctx.restore();
    var img = new Image();
    img.src=canvas.toDataURL();
    gif.addFrame(img, {delay:200});
    callback();
  }

  console.log("start sort");
  sortPixels(function(){
    writeToCanvas();
  });
}

var processHandler = function(){
  if(imgs.length <1){
    console.log('done');
    $(canvas).remove();
    gif.render();
  //  gif2.render();
    $(dcanvas).remove();
  }
  else{
    processImage(imgs.shift(), processHandler);
  }
}


var vidEnded =function(e){
  console.log(imgs.length);
  clearInterval(vidTimer);
  $(video).remove();
  $("body").append(dcanvas);
  processImage(imgs.shift(), processHandler);
}

var initVid = function(){

  $(canvas).remove();
 // $(canvas).remove();
  video = document.createElement('video');
  $('body').append(video);
  video.src = "media/vine2.mp4";
  video.width = canvas.width;
  video.addEventListener('ended',vidEnded,false);

  video.addEventListener('loadeddata', function() {
    showVid();
    video.play();
  }, false);
}


