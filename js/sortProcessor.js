importScripts("sort.js");

self.onmessage = function(e){
  var colorBlock = e.data.data;
  var index = e.data.index;
  var height= e.data.height;
  var width = e.data.width;
  var result = [];

  for(var j=0; j<height; j++){
    result = msort(colorBlock.slice(j*width, j*width+width));
    for(var i = 0; i<width;i++){
      colorBlock[j*width+i]=result[i];
    }
  }


  self.postMessage({result:colorBlock, index: index});
}
