const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let isPlaying = false;
let currentStep = 0;
let interval;

const sounds = {
  kick: () => playOsc(100, 0.15),
  snare: () => playNoise(0.2),
  hihat: () => playNoise(0.05)
};

function playOsc(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + duration
  );
  osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration) {
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();
}

// Crear pasos
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
function playPiano(freq) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine";
  osc.frequency.value = freq;

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  gain.gain.setValueAtTime(0.8, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + 1
  );

  osc.start();
  osc.stop(audioCtx.currentTime + 1);
}

// Click con mouse
document.querySelectorAll('.key').forEach(key => {
  key.addEventListener('mousedown', () => {
    key.classList.add('active');
    playPiano(key.dataset.note);
  });

  key.addEventListener('mouseup', () => {
    key.classList.remove('active');
  });
});

// Teclado del PC
const keyMap = {
  a: 261.63,
  w: 277.18,
  s: 293.66,
  e: 311.13,
  d: 329.63,
  f: 349.23,
  t: 369.99,
  g: 392.00,
  y: 415.30,
  h: 440.00,
  u: 466.16,
  j: 493.88,
  k: 523.25
};

document.addEventListener('keydown', e => {
  if (keyMap[e.key]) {
    playPiano(keyMap[e.key]);
  }
});
