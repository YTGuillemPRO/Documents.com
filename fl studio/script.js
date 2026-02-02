// =======================
// AUDIO CONTEXT
// =======================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let isPlaying = false;
let currentStep = 0;
let interval;

// =======================
// DRUM SOUNDS
// =======================
const sounds = {
  kick: () => playKick(),
  snare: () => playSnare(),
  hihat: () => playHiHat()
};

function playKick() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(
    50,
    audioCtx.currentTime + 0.15
  );

  gain.gain.setValueAtTime(1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + 0.15
  );

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.15);
}

function playSnare() {
  playNoise(0.2);
}

function playHiHat() {
  playNoise(0.05);
}

function playNoise(duration) {
  const buffer = audioCtx.createBuffer(
    1,
    audioCtx.sampleRate * duration,
    audioCtx.sampleRate
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();
}

// =======================
// STEP SEQUENCER
// =======================
document.querySelectorAll('.steps').forEach(steps => {
  for (let i = 0; i < 16; i++) {
    const step = document.createElement('div');
    step.classList.add('step');
    step.addEventListener('click', () => {
      step.classList.toggle('active');
    });
    steps.appendChild(step);
  }
});

document.getElementById('play').onclick = () => {
  if (isPlaying) return;
  isPlaying = true;

  const bpm = document.getElementById('bpm').value;
  const stepTime = (60 / bpm) / 4 * 1000;

  interval = setInterval(() => {
    document.querySelectorAll('.steps').forEach(row => {
      const steps = row.children;
      if (steps[currentStep].classList.contains('active')) {
        const sound = row.dataset.sound;
        sounds[sound]();
      }
    });

    currentStep = (currentStep + 1) % 16;
  }, stepTime);
};

document.getElementById('stop').onclick = () => {
  isPlaying = false;
  clearInterval(interval);
  currentStep = 0;
};

// =======================
// PIANO DIGITAL
// =======================
function playPiano(freq) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine";
  osc.frequency.value = freq;

  gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + 1
  );

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 1);
}

// Mouse
document.querySelectorAll('.key').forEach(key => {
  key.addEventListener('mousedown', () => {
    key.classList.add('active');
    playPiano(key.dataset.note);
  });

  key.addEventListener('mouseup', () => {
    key.classList.remove('active');
  });

  key.addEventListener('mouseleave', () => {
    key.classList.remove('active');
  });
});

// Teclado del PC
const keyMap = {
  a: 261.63, // C
  w: 277.18, // C#
  s: 293.66, // D
  e: 311.13, // D#
  d: 329.63, // E
  f: 349.23, // F
  t: 369.99, // F#
  g: 392.00, // G
  y: 415.30, // G#
  h: 440.00, // A
  u: 466.16, // A#
  j: 493.88, // B
  k: 523.25  // C
};

document.addEventListener('keydown', e => {
  if (keyMap[e.key]) {
    playPiano(keyMap[e.key]);
  }
});
