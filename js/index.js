import("../pkg/index.js").then(rust => {
  document.getElementById("file").addEventListener("change", function () {
    const files = this.files;
    if (files.length === 0) {
      return;
    }
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    files[0].arrayBuffer().then(buffer => audioContext.decodeAudioData(buffer)).then(data => {
      console.log(data);
      const spectra = rust.run_fft(data.getChannelData(0), 8192);
      console.log(spectra);
    }).catch(console.error).finally(() => {
      audioContext.close();
    });
  }, false);
}).catch(console.error);
