const webcamElement = document.getElementById('webcam');
const webcam = new Webcam(webcamElement, 'user');
const canvasPerson = document.getElementById("canvasPerson");
const multiplier = 0.75;
const outputStride = 16;
const segmentationThreshold = 0.75;
const contextPerson = canvasPerson.getContext("2d");
let net;
let cameraFrame;
let screenMode;

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };
})();

window.cancelAnimationFrame = (function(){
    return  window.cancelAnimationFrame || window.mozCancelAnimationFrame;
})();


// This callback is for the webcam switch.
// If it is successful, we should hide the radio button
$("#webcam-switch").change(function () {
    if(this.checked){
        console.log('trying to enable cam');
        $('.md-modal').addClass('md-show');
        webcam.start(true)
            .then(result =>{
               console.log("webcam started");
               $(".webcam-container").removeClass("d-none");
               $("#webcam-control").hide();
               contextPerson.clearRect(0,0,canvasPerson.width,canvasPerson.height);
               screenMode = window.innerWidth > window.innerHeight? 'l' : 'p';
               
               cameraFrame = startDetectBody();
            })
            .catch(err => {
                console.log(err);
                // set webcam 
                alert('Failed to set webcam. Please ensure you are using a modern browser ');
                $("#webcam-switch").prop('checked', false);
            });
    }
    else {        
        webcam.stop();
        cancelAnimationFrame(cameraFrame);
        contextPerson.clearRect(0,0,canvasPerson.width,canvasPerson.height);
        console.log("webcam stopped");
    }        
});

$("#webcam").bind("loadedmetadata", function () {
    screenModeChange();
    if(net != null){
        cameraFrame = detectBody();
    }
});

function startDetectBody() {
    if(net == null){
        $(".spinner").show();
        bodyPix.load({
            architecture: 'MobileNetV1',
            outputStride: outputStride,
            multiplier: multiplier,
            quantBytes: 2
        })
        .catch(error => {
            console.log(error);
        })
        .then(objNet => {
            $(".spinner").hide();
            net = objNet;
            $("#canvasPerson").show();
            cameraFrame = detectBody();
        });
    }else{
        $("#canvasPerson").removeClass("d-none");
    }
}

function detectBody(){
    net.segmentPerson(webcamElement,  {
        flipHorizontal: false,
        internalResolution: 'medium',
        segmentationThreshold: segmentationThreshold
      })
    .catch(error => {
        console.log(error);
    })
    .then(personSegmentation => {
        if(personSegmentation!=null){
            drawBody(personSegmentation);
        }
    });
    cameraFrame = requestAnimFrame(detectBody);
}

function drawBody(personSegmentation)
{
    if(screenMode == 'l'){
        var canvas = document.createElement('canvas');
        canvas.width = webcamElement.width;
        canvas.height = webcamElement.height;
        var context = canvas.getContext('2d');
        context.drawImage(webcamElement, 0, 0);
        var imageData = context.getImageData(0,0, webcamElement.width, webcamElement.height);
        
        var pixel = imageData.data;
        for (var p = 0; p<pixel.length; p+=4)
        {
          if (personSegmentation.data[p/4] == 0) {
              pixel[p+3] = 0;
          }
        }
        context.imageSmoothingEnabled = true;
        context.putImageData(imageData,0,0);
    
        var imageObject=new Image();
        imageObject.onload=function(){        
            contextPerson.clearRect(0,0,canvasPerson.width,canvasPerson.height);
            contextPerson.imageSmoothingEnabled = true;
            contextPerson.drawImage(imageObject, 0, 0, canvasPerson.width, canvasPerson.height);
        }
        imageObject.src=canvas.toDataURL();
    }else {
        // assumes webcam height/width match canvas height/width
        contextPerson.drawImage(webcamElement, 0, 0, webcamElement.width, webcamElement.height);
        var imageData = contextPerson.getImageData(0,0, webcamElement.width, webcamElement.height);
        var pixel = imageData.data;
        for (var p = 0; p<pixel.length; p+=4)
        {
          if (personSegmentation.data[p/4] == 0) {
              pixel[p+3] = 0;
          }
        }
        contextPerson.imageSmoothingEnabled = true;
        contextPerson.putImageData(imageData,0,0);
    }
}

$("#fakeSelect").click(function () {
    $('#background-container').css('background-image', 'url(images/pyramid.jpg)');
});

$(window).resize(function() {
    screenModeChange();
});

function screenModeChange(){
    /*screenMode = window.innerWidth > window.innerHeight? 'l' : 'p';
    if(screenMode == 'l'){
        canvasPerson.style.width = '100vw';
        canvasPerson.style.height = 'auto';
    }else {
        canvasPerson.style.width = window.innerWidth + 'px';
        canvasPerson.style.height = '100vh';
    }*/
}