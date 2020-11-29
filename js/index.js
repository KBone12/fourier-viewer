import("../pkg/index.js").then(rust => {
  const WindowFunction = rust.WindowFunction;
  const FourierViewer = rust.FourierViewer;

  let viewer = null;
  let windowFunction = WindowFunction.Rectangle;
  let fftSize = 8192;

  document.getElementById("file").addEventListener("change", function () {
    const files = this.files;
    if (files.length === 0) {
      return;
    }
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    files[0].arrayBuffer().then(buffer => audioContext.decodeAudioData(buffer)).then(data => {
      viewer = new FourierViewer(data.getChannelData(0), data.sampleRate);
      document.getElementById("fft_size").max = Math.max(Math.min(data.length, 1 << 16), 2);
      document.getElementById("calculate").click();
    }).catch(console.error).finally(() => {
      audioContext.close();
    });
  }, false);

  document.getElementById("window_function").addEventListener("change", event => {
    if (event.target.value == "Blackman") {
      windowFunction = WindowFunction.Blackman;
    } else if (event.target.value == "Hamming") {
      windowFunction = WindowFunction.Hamming;
    } else if (event.target.value == "Hann") {
      windowFunction = WindowFunction.Hann;
    } else if (event.target.value == "Rectangle") {
      windowFunction = WindowFunction.Rectangle;
    } else {
      console.error("Illegal window function");
    }
  });

  document.getElementById("fft_size").addEventListener("change", event => {
    fftSize = parseInt(event.target.value);
  });

  document.getElementById("calculate").addEventListener("click", () => {
    if (viewer === null) {
      return;
    }
    const canvas = document.getElementById("canvas");
    const peak_values = document.getElementById("peak_values");

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    peak_values.innerHTML = "Peak frequencies:&nbsp;";

    viewer.run_fft(fftSize, windowFunction);
    const peak_frequencies = viewer.peak_frequencies(5);
    for (let i = 0; i < peak_frequencies.length; i += 1) {
      peak_values.innerHTML += peak_frequencies[i].toFixed(1);
      if (i < peak_frequencies.length - 1) {
        peak_values.innerHTML += ",&nbsp;";
      }
    }
    viewer.draw(canvas);
  });
}).catch(console.error);
