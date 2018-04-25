const socket = io();

const context = new AudioContext();
let audioBuffer;
let sourceNode;
let splitter;
let analyser;
let javascriptNode;

/**
 * Setup the nodes that will analyse and process the sound
 * @param callback - the callback which is fired when the javascriptNode has processed 2048 audio frames
 */
const setupAudioNodes = callback => {
	// create a stream source from the microphone
	// see : http://www.w3.org/TR/webaudio/#MediaStreamAudioSourceNode-section
	// get the usermedia object to be able to connect to the mic
	navigator.getUserMedia(
		{ audio: true, video: false },
		stream => {
			// setup a javascript node that will process audio with a buffer of 2048 frames
			// so every 2048 frame an AudioProcessingEvent event will be fired
			// this node have one input channel and one output channel
			// see: http://www.w3.org/TR/webaudio/#ScriptProcessorNode
			javascriptNode = context.createScriptProcessor(4096, 1, 1);
			// connect the node to its destination
			javascriptNode.connect(context.destination);

			// create an analyzer, capable of realtime analysis of the audio frames
			// see: http://www.w3.org/TR/webaudio/#RealtimeAnalyserNode-section
			analyser = context.createAnalyser();
			// do not analyze each frame, smooth it
			analyser.smoothingTimeConstant = 0.3;
			// size of the fft, results of sampling the sound in 1024/2=512 frequencies
			analyser.fftSize = 256;

			// audioprocess callback definition
			onAudioProcess(callback);

			// plug the nodes together
			// analyser-->javascriptNode to analyze and interact with the sound
			// see this again : http://www.w3.org/TR/webaudio/#ModularRouting-section
			analyser.connect(javascriptNode);
			mediaStreamBuffer = context.createMediaStreamSource(stream);
			// connect the source to the analyser
			mediaStreamBuffer.connect(analyser);
			// dont do that unless you like Larsen effect
			//mediaStreamBuffer.connect(context.destination);
		},
		err => {
			console.log(err);
			console.log('go and get a decent browser!');
		}
	);
};

/**
 * Callback fired each time 2048 frames have been processed by the javascriptNode
 */
const onAudioProcess = callback => {
	// see : http://www.w3.org/TR/webaudio/#AudioProcessingEvent-section
	javascriptNode.onaudioprocess = function() {
		// creates an array of the size of 'frequencyBinCount' which is half of the 'fftSize'
		// so you'll have an array ready to get the amplitude of each frequency of the sound
		const array = new Uint8Array(analyser.frequencyBinCount);
		// put the current amplitude of each frequency in the array
		// see: http://www.w3.org/TR/webaudio/#methods-and-parameters
		analyser.getByteFrequencyData(array);
		// send the fft to the server
		callback(array);
	};
};

setupAudioNodes(fft => {
	socket.emit('fft', fft);
});
