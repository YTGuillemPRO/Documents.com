const notes = [
  { name: "C5", black: false },
  { name: "B4", black: false },
  { name: "A#4", black: true },
  { name: "A4", black: false },
  { name: "G#4", black: true },
  { name: "G4", black: false },
  { name: "F#4", black: true },
  { name: "F4", black: false },
  { name: "E4", black: false },
  { name: "D#4", black: true },
  { name: "D4", black: false },
  { name: "C#4", black: true },
  { name: "C4", black: false },
  { name: "B3", black: false },
  { name: "A3", black: false },
  { name: "G3", black: false }
];

const steps = 32;
const keysDiv = document.getElementById("keys");
const gridDiv = document.getElementById("grid");

notes.forEach(note => {
  const key = document.createElement("div");
  key.className = "key" + (note.black ? " black" : "");
  key.textContent = note.name;
  keysDiv.appendChild(key);

  for (let i = 0; i < steps; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.onclick = () => cell.classList.toggle("active");
    gridDiv.appendChild(cell);
  }
});
