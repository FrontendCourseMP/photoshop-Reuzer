/* eslint-disable no-restricted-globals */

self.onmessage = (e: MessageEvent) => {
  const { imageData, channels } = e.data;
  const { width, height, data } = imageData;
  
  // Use a transferrable buffer for maximum performance
  const outputBuffer = new Uint8ClampedArray(data.length);
  
  // Fast path: if all channels are on, just copy (though usually we don't call worker for this)
  if (channels.r && channels.g && channels.b && channels.a) {
    outputBuffer.set(data);
  } else if (!channels.r && !channels.g && !channels.b && channels.a) {
    // Special case: Alpha mask only
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      outputBuffer[i] = alpha;
      outputBuffer[i + 1] = alpha;
      outputBuffer[i + 2] = alpha;
      outputBuffer[i + 3] = 255;
    }
  } else {
    // General channel filtering
    for (let i = 0; i < data.length; i += 4) {
      outputBuffer[i] = channels.r ? data[i] : 0;
      outputBuffer[i + 1] = channels.g ? data[i + 1] : 0;
      outputBuffer[i + 2] = channels.b ? data[i + 2] : 0;
      outputBuffer[i + 3] = channels.a ? data[i + 3] : 255;
    }
  }

  const result = new ImageData(outputBuffer, width, height);
  // Transfer the buffer back to avoid copying
  self.postMessage(result, [outputBuffer.buffer] as any);
};

export {};
