const notes = [
  "C5","B4","A#4","A4","G#4","G4","F#4","F4",
  "E4","D#4","D4","C#4","C4","B3","A3","G3"
];

const steps = 32;

const keysDiv = document.getElementById("keys");
const gridDiv = document.getElementById("grid");

notes.forEach((note, row) => {
  // tecla
  const key = document.createElement("div");
  key.className = "key" + (note.includes("#") ? " black" : "");
  key.textContent = note;
  keysDiv.appendChild(key);

  // celdas
  for (let col = 0; col < steps; col++) {
    const cell = document.createElement("div");
    cell.className = "cell";

    cell.onclick = () => {
      cell.classList.toggle("active");
    };

    gridDiv.appendChild(cell);
  }
});
