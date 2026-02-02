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
