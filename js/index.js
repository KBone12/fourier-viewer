import("../pkg/index.js").then(rust => {
  document.getElementById("file").addEventListener("change", function () {
    const files = this.files;
    if (files.length === 0) {
      return;
    }
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    files[0].arrayBuffer().then(buffer => audioContext.decodeAudioData(buffer)).then(data => {
      console.log(data);
      const fftSize = 1 << 16;
      const spectra = rust.run_fft(data.getChannelData(0), fftSize);
      const powers = rust.spectra_to_powers(spectra);
      const peak_values = document.getElementById("peak_values");
      const peak_indices = rust.peak_indices(powers.slice(0, powers.length / 2), 5);
      for (let i = 0; i < peak_indices.length; i += 1) {
        peak_values.innerText += "" + peak_indices[i] * (data.sampleRate / fftSize) + ", ";
      }
      rust.plot_power_spectra_to_canvas(document.getElementById("canvas"), powers, data.sampleRate);
    }).catch(console.error).finally(() => {
      audioContext.close();
    });
  }, false);
}).catch(console.error);
