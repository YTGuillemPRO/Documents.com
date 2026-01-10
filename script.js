import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GithubAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAsx2kPeIGGdgWB7NNTNsDdMKhD946R71A",
  authDomain: "inicio-sessio.firebaseapp.com",
  projectId: "inicio-sessio",
  storageBucket: "inicio-sessio.firebasestorage.app",
  messagingSenderId: "317240360522",
  appId: "1:317240360522:web:7308be4afe4b5d81d6b0b3",
  measurementId: "G-3YNVH5N03F"
};

// Inicialización
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GithubAuthProvider();

// Elementos de la interfaz
const loginBtn = document.getElementById('btn-login');
const statusText = document.getElementById('status');
const clickBtn = document.getElementById('btn-click');

// Lógica de Autenticación
loginBtn.onclick = async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Error al entrar:", error);
        alert("Fallo el login: " + error.message);
    }
};

// Detectar cuando el usuario entra o sale
onAuthStateChanged(auth, (user) => {
    if (user) {
        statusText.innerText = `Bienvenido, ${user.displayName}`;
        loginBtn.style.display = 'none'; // Escondemos el botón si ya entró
    } else {
        statusText.innerText = "Estado: No identificado";
        loginBtn.style.display = 'block';
    }
});

// Lógica del Juego (Local)
let clicks = 0;
clickBtn.onclick = () => {
    clicks++;
    console.log("Has hecho " + clicks + " clicks");
};
