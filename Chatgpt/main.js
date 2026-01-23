let memoria = {
  nombre: localStorage.getItem("nombre") || null
};

const chat = document.getElementById("chat");
const input = document.getElementById("input");

function hablar(texto) {
  const voz = new SpeechSynthesisUtterance(texto);
  voz.lang = "es-ES";
  speechSynthesis.speak(voz);
}

function agregar(quien, texto) {
  chat.innerHTML += `<div><b>${quien}:</b> ${texto}</div>`;
  chat.scrollTop = chat.scrollHeight;
}

function pensar(texto) {
  texto = texto.toLowerCase();

  if (texto.includes("mi nombre es")) {
    memoria.nombre = texto.replace("mi nombre es", "").trim();
    localStorage.setItem("nombre", memoria.nombre);
    return `Encantado, ${memoria.nombre}`;
  }

  if (texto.includes("como me llamo")) {
    return memoria.nombre
      ? `Te llamas ${memoria.nombre}`
      : "Aún no sé tu nombre";
  }

  if (texto.includes("hora")) return "Son las " + new Date().toLocaleTimeString();
  if (texto.includes("fecha")) return "Hoy es " + new Date().toLocaleDateString();
  if (texto.includes("hola")) return "Hola 👋";
  if (texto.includes("quien eres")) return "Soy un asistente virtual offline 🤖";

  return "No entiendo eso todavía 😅";
}

function enviar() {
  if (!input.value) return;
  agregar("Tú", input.value);
  const respuesta = pensar(input.value);
  agregar("IA", respuesta);
  hablar(respuesta);
  input.value = "";
}

// Reconocimiento de voz
function escuchar() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = "es-ES";
  recognition.start();

  recognition.onresult = (e) => {
    input.value = e.results[0][0].transcript;
    enviar();
  };
}

