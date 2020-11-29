import("../pkg/index.js").then(rust => {
  const WindowFunction = rust.WindowFunction;

  let audioData = null;
  let windowFunction = WindowFunction.Rectangle;
  let fftSize = 2;

  document.getElementById("file").addEventListener("change", function () {
    const files = this.files;
    if (files.length === 0) {
      return;
    }
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    files[0].arrayBuffer().then(buffer => audioContext.decodeAudioData(buffer)).then(data => {
      audioData = data;
      document.getElementById("fft_size").max = Math.max(Math.min(audioData.length, 1 << 16), 2);
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
    if (audioData === null) {
      return;
    }
    const canvas = document.getElementById("canvas");
    const peak_values = document.getElementById("peak_values");

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    peak_values.innerHTML = "Peak frequencies:&nbsp;";

    const spectra = rust.run_fft(audioData.getChannelData(0), fftSize, windowFunction);
    const powers = rust.spectra_to_powers(spectra);
    const peak_indices = rust.peak_indices(powers.slice(0, powers.length / 2), 5);
    for (let i = 0; i < peak_indices.length; i += 1) {
      peak_values.innerHTML += (peak_indices[i] * (audioData.sampleRate / fftSize)).toFixed(1);
      if (i < peak_indices.length - 1) {
        peak_values.innerHTML += ",&nbsp;";
      }
    }
    rust.plot_power_spectra_to_canvas(canvas, powers, audioData.sampleRate);
  });
}).catch(console.error);
