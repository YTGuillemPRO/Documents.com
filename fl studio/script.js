const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const notes = [
  { name: "C5", freq: 523.25 },
  { name: "B4", freq: 493.88 },
  { name: "A#4", freq: 466.16 },
  { name: "A4", freq: 440.00 },
  { name: "G#4", freq: 415.30 },
  { name: "G4", freq: 392.00 },
  { name: "F#4", freq: 369.99 },
  { name: "F4", freq: 349.23 },
  { name: "E4", freq: 329.63 },
  { name: "D#4", freq: 311.13 },
  { name: "D4", freq: 293.66 },
  { name: "C#4", freq: 277.18 },
  { name: "C4", freq: 261.63 },
  { name: "B3", freq: 246.94 },
  { name: "A3", freq: 220.00 },
  { name: "G3", freq: 196.00 }
];

const steps = 32;
let currentStep = 0;
let playing = false;
let interval;

const keysDiv = document.getElementById("keys");
const gridDiv = document.getElementById("grid");
const cells = [];

// crear teclas y grid
notes.forEach((note, row) => {
  const key = document.createElement("div");
  key.className = "key" + (note.name.includes("#") ? " black" : "");
  key.textContent = note.name;
  keysDiv.appendChild(key);

  for (let col = 0; col < steps; col++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.row = row;
    cell.dataset.col = col;

    cell.onclick = () => {
      cell.classList.toggle("active");
    };

    gridDiv.appendChild(cell);
    cells.push(cell);
  }
});

// sonido
function playNote(freq) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.frequency.value = freq;
  osc.type = "sawtooth";

  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
}

// reproducir
function play() {
  const bpm = document.getElementById("bpm").value;
  const intervalTime = (60 / bpm) * 250;

  interval = setInterval(() => {
    cells.forEach(cell => {
      if (
        cell.classList.contains("active") &&
        Number(cell.dataset.col) === currentStep
      ) {
        const note = notes[cell.dataset.row];
        playNote(note.freq);
      }
    });

    currentStep = (currentStep + 1) % steps;
  }, intervalTime);
}

document.getElementById("play").onclick = () => {
  if (!playing) {
    playing = true;
    play();
  }
};

document.getElementById("stop").onclick = () => {
  clearInterval(interval);
  currentStep = 0;
  playing = false;
};
