class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._bufferSize = 4096; // Process in chunks
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    // Assuming mono input
    if (input.length > 0 && input[0].length > 0) {
      const channelData = input[0];
      this._buffer.push(...channelData);

      // Send data back to the main thread when buffer is full
      while (this._buffer.length >= this._bufferSize) {
        const chunk = this._buffer.splice(0, this._bufferSize);
        this.port.postMessage({ type: 'audioData', data: new Float32Array(chunk) });
      }
    }

    // Pass data through (optional, needed if you want to hear the audio)
    // for (let channel = 0; channel < output.length; ++channel) {
    //   output[channel].set(input[channel]);
    // }

    return true; // Keep processor alive
  }
}

registerProcessor('audio-processor', AudioProcessor); 