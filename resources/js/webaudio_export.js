window.onload = init;
var context;
var offline;
var bufferLoader;
var source1 = null;
var audioBasePath = 'resources/audio/';

var bufferLoader;

function init() {
    // Fix up prefixing
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    // offline = new webkitOfflineAudioContext(numChannels, lengthInSamples, sampleRate)
    offline = new OfflineAudioContext(2, 10 * 44100, 44100) || new webkitOfflineAudioContext(2, 10 * 44100, 44100);
    context = new AudioContext();
    // Wiring
    // Create Audio Nodes
    var gain_1 = context.createGain(); // Create source gain node for channel 1
    var gain_2 = context.createGain(); // Create source gain node for channel 2
    var gain_3 = context.createGain(); // Create source gain node for channel 3

    var comp_global = context.createDynamicsCompressor(); // Create global compressor node
    var gain_master = context.createGain(); // Create master gain node



    bufferLoader = new BufferLoader(
        context, [
            audioBasePath + '1.mp3',
            audioBasePath + '4.mp3',
            audioBasePath + '2.mp3'
        ],
        finishedLoading
    );

    bufferLoader.load();

    offline.oncomplete = function(ev) {
        alert('test');
        var source = context.createBufferSource();
        source.buffer = ev.renderedBuffer;
        source.connect(context.destination);
        source.loop = true;
        source.start(0);


        sendWaveToPost(ev.renderedBuffer);
    }
}

function finishedLoading(bufferList) {

    source1 = offline.createBufferSource(); // Create a sound source 1
    source1.buffer = bufferList[0]; // Add the buffered data to our object
    // source1.loop = true; // Make it loop
    source1.connect(offline.destination);
    // gain_1.gain.value = 1; // 0 : mute / 1 : unmute
    source1.start(0); // Play immediately

    source2 = offline.createBufferSource(); // Create a sound source 2
    source2.buffer = bufferList[1]; // Add the buffered data to our object
    // source2.loop = true; // Make it loop
    source2.connect(offline.destination);
    // gain_2.gain.value = 1; // 0 : mute / 1 : unmute
    source2.start(0); // Play immediately

    source3 = offline.createBufferSource(); // Create a sound source 3
    source3.buffer = bufferList[2]; // Add the buffered data to our object
    // source3.loop = true; // Make it loop
    source3.connect(offline.destination);
    // gain_3.gain.value = 1;  // 0 : mute / 1 : unmute
    source3.start(0); // Play immediately

    offline.startRendering();
    // // $('.buffertime').text(bufferList[2].duration);


}


function sendWaveToPost(buffer) {
  var worker = new Worker('resources/js/recorderjs/recorderWorker.js');

  // initialize the new worker
  worker.postMessage({
    command: 'init',
    config: {
      sampleRate: 44100
    }
  });

  // callback for `exportWAV`
  worker.onmessage = function(e) {
    blob = e.data;
    var url = (window.URL || window.webkitURL).createObjectURL(blob);
    console.log(url);
    $('.buffertime').attr('href', url);
    var data = new FormData();

    data.append("audio", blob, (new Date()).getTime() + ".wav");
 
      // console.log(data);
      // Recorder.forceDownload(blob[, 'finalname.mp3']);
    // var oReq = new XMLHttpRequest();
    // oReq.open("POST", "resources/audio/save_file");
    // oReq.send(data);
    // oReq.onload = function(oEvent) {
    //   if (oReq.status == 200) {
    //     console.log("Uploaded");
    //   } else {
    //     console.log("Error " + oReq.status + " occurred uploading your file.");
    //   }
    // };
  };

  // send the channel data from our buffer to the worker
  worker.postMessage({
    command: 'record',
    buffer: [
      buffer.getChannelData(0),
      buffer.getChannelData(1)
    ]
  });

  // ask the worker for a WAV
  worker.postMessage({
    command: 'exportWAV',
    type: 'audio/wav'
  });
}