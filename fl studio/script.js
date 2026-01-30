const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const steps = [];
const totalSteps = 16;
let currentStep = 0;
let isPlaying = false;
let interval;

// crear sonidos
function playSound(freq) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.frequency.value = freq;
  osc.type = "square";

  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.2);
}

// crear secuenciador
const sequencer = document.getElementById("sequencer");

for (let i = 0; i < totalSteps; i++) {
  const step = document.createElement("div");
  step.classList.add("step");

  step.addEventListener("click", () => {
    step.classList.toggle("active");
  });

  sequencer.appendChild(step);
  steps.push(step);
}

function play() {
  interval = setInterval(() => {
    steps.forEach((step, index) => {
      if (index === currentStep && step.classList.contains("active")) {
        playSound(200 + index * 10);
      }
    });

    currentStep = (currentStep + 1) % totalSteps;
  }, 150);
}

document.getElementById("play").onclick = () => {
  if (!isPlaying) {
    isPlaying = true;
    play();
  }
};

document.getElementById("stop").onclick = () => {
  clearInterval(interval);
  currentStep = 0;
  isPlaying = false;
};

