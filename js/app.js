//https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/HTML-canvas-guide/PuttingVideoonCanvas/PuttingVideoonCanvas.html

var video,
    vidTimer,
    imgs = [],
    frames=[];

var frameRate = 1000/4.0;

var colArray = new Array();
var canvas = document.getElementById("canvas");
//color stuff


var showVid = function() {
  var ctx = canvas.getContext('2d');
  //rotate so we sort vertically
  ctx.save();
  ctx.rotate(270 * Math.PI / 180);
  ctx.translate(-1*canvas.width,0);
  ctx.drawImage(video, 0, 0);
  ctx.restore();
  var img = new Image();
  img.src=canvas.toDataURL();
  imgs.push(img);
  // Repeat 40 times a second to oversample 30 fps video
  vidTimer = setTimeout(showVid, frameRate);
}

var processImage = function(img, callback) {
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
    mcanvas = document.createElement("canvas");
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
    frames.push(img);
   $('body').append(img);

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
  }
  else{
    processImage(imgs.shift(), processHandler);
  }
}


var vidEnded =function(e){
  console.log(imgs.length);
  clearInterval(vidTimer);
  processImage(imgs.shift(), processHandler);
}

var initVid = function(){
  video = document.createElement('video');
  $('body').append(video);
  video.src = "media/vine.mp4";
  video.addEventListener('ended',vidEnded,false);

  video.addEventListener('loadeddata', function() {
    showVid();
    video.play();
//    processImage(video);
  }, false);
}


