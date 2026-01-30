const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const notes = [
  { name: "C5", freq: 523.25 },
  { name: "B4", freq: 493.88 },
  { name: "A#4", freq: 466.16 },
  { name: "A4", freq: 440 },
  { name: "G#4", freq: 415.3 },
  { name: "G4", freq: 392 },
  { name: "F#4", freq: 369.99 },
  { name: "F4", freq: 349.23 },
  { name: "E4", freq: 329.63 },
  { name: "D#4", freq: 311.13 },
  { name: "D4", freq: 293.66 },
  { name: "C#4", freq: 277.18 },
  { name: "C4", freq: 261.63 },
  { name: "B3", freq: 246.94 },
  { name: "A3", freq: 220 },
  { name: "G3", freq: 196 }
];

const STEPS = 32;
let currentStep = 0;
let playing = false;
let timer = null;

const keysDiv = document.getElementById("keys");
const gridDiv = document.getElementById("grid");

// matriz [nota][step]
const pattern = Array(notes.length)
  .fill(0)
  .map(() => Array(STEPS).fill(false));

// crear UI
notes.forEach((note, row) => {
  const key = document.createElement("div");
  key.className = "key" + (note.name.includes("#") ? " black" : "");
  key.textContent = note.name;
  keysDiv.appendChild(key);

  for (let col = 0; col < STEPS; col++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.row = row;
    cell.dataset.col = col;

    cell.onclick = () => {
      pattern[row][col] = !pattern[row][col];
      cell.classList.toggle("active");
    };

    gridDiv.appendChild(cell);
  }
});

// sonido
function playNote(freq) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sawtooth";
  osc.frequency.value = freq;

  gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.25);
}

// play
function play() {
  const bpm = Number(document.getElementById("bpm").value);
  const stepTime = (60 / bpm) * 250;

  timer = setInterval(() => {
    notes.forEach((note, row) => {
      if (pattern[row][currentStep]) {
        playNote(note.freq);
      }
    });

    currentStep = (currentStep + 1) % STEPS;
  }, stepTime);
}

document.getElementById("play").onclick = async () => {
  if (audioCtx.state === "suspended") await audioCtx.resume();
  if (!playing) {
    playing = true;
    play();
  }
};

document.getElementById("stop").onclick = () => {
  clearInterval(timer);
  currentStep = 0;
  playing = false;
};
