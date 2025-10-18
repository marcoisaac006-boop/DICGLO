// Usa un video de prueba público (MP4 válido). Reemplaza con tu enlace real si lo arreglas, o usa YouTube embed.
const VIDEO_SRC = "https://www.w3schools.com/html/mov_bbb.mp4"; // Video de prueba (cambia a tu YouTube: "https://www.youtube.com/embed/TU_VIDEO_ID")

const SUBJECTS = {
  matematica: {
    title: 'Matemática',
    topics: [
      { title: 'Suma y resta', desc: 'Ejercicios básicos de sumas y restas, con ejemplos y práctica.' },
      { title: 'Multiplicaciones', desc: 'Tabla, problemas y ejercicios de multiplicación.' },
      { title: 'Geometría', desc: 'Figuras, perímetros y áreas con actividades interactivas.' }
    ]
  },
  lenguaje: {
    title: 'Lenguaje',
    topics: [
      { title: 'Gramática', desc: 'Clases de palabras, oraciones y análisis sintáctico.' },
      { title: 'Ortografía', desc: 'Reglas y ejercicios para mejorar la escritura.' },
      { title: 'Lectura comprensiva', desc: 'Textos y preguntas para practicar comprensión.' }
    ]
  }
};

const main = document.querySelector('main');
let HOME_HTML = main ? main.innerHTML : '';

function setPresentationVideo() {
  const pv = document.getElementById('presentationVideo');
  const placeholder = document.getElementById('videoPlaceholder');
  if (!pv) return;
  pv.src = VIDEO_SRC;
  pv.load();
  pv.onloadeddata = () => {
    console.log('Video cargado exitosamente');
    placeholder.style.display = 'none';
  };
  pv.onerror = () => {
    console.error('Error cargando video');
    alert('El video no se pudo cargar. Verifica el enlace en app.js o usa un embed de YouTube.');
    placeholder.textContent = 'Error: Video no disponible. Revisa consola.';
  };
}
setPresentationVideo();

function normalizeText(s) {
  return s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';
}

function bindQuickButtons(){
  document.querySelectorAll('.subject-btn').forEach(b => {
    b.removeEventListener('click', quickBtnHandler);
    b.addEventListener('click', quickBtnHandler);
  });
}

function quickBtnHandler(e){
  const sub = e.currentTarget.dataset.subject;
  if (sub) navigateToSubject(sub);
}
bindQuickButtons();

function renderSubjectFullPage(key) {
  const sub = SUBJECTS[key];
  if (!sub) return;
  const topicsHtml = sub.topics.map(t => `
    <div class="topic-card">
      <h3>${t.title}</h3>
      <p>${t.desc}</p>
      <button class="open-topic" data-title="${t.title}">Abrir</button>
    </div>
  `).join('');

  const html = `
    <section class="card subject-full-page">
      <div class="subject-header" style="display:flex;align-items:center;justify-content:space-between;">
        <h1>${sub.title}</h1>
        <button id="volverBtn" class="volver">← Volver</button>
      </div>
      <div class="topics-grid" style="margin-top:12px;display:grid;gap:12px;">
        ${topicsHtml}
      </div>
    </section>
  `;

  main.innerHTML = html;

  document.getElementById('volverBtn').addEventListener('click', renderSelectionPage);

  main.querySelectorAll('.open-topic').forEach(btn => {
    btn.addEventListener('click', () => alert(`Abriste: ${btn.dataset.title}`));
  });

  history.pushState({subject:key}, '', `#${key}`);
}

function renderSelectionPage() {
  const html = `
    <section class="card selection-page">
      <h1>¡Hola ${userName || ''}!</h1>
      <p>(Di: "Matemática" o "Lenguaje", o toca abajo).</p>
      <div style="display:flex; gap:12px;">
        <button class="subject-btn" data-subject="matematica" style="flex:1;padding:18px;">Matemática</button>
        <button class="subject-btn" data-subject="lenguaje" style="flex:1;padding:18px;">Lenguaje</button>
      </div>
      <button id="seleccionVolver" class="volver">← Volver al inicio</button>
    </section>
  `;

  main.innerHTML = html;

  main.querySelectorAll('.subject-btn').forEach(b => {
    b.addEventListener('click', quickBtnHandler);
  });

  document.getElementById('seleccionVolver').addEventListener('click', goHome);

  history.pushState({selection:true}, '', '#selection');
}

function goHome(pushHistory = true) {
  main.innerHTML = HOME_HTML;
  setPresentationVideo();
  bindQuickButtons();
  if (pushHistory) history.pushState({}, '', location.pathname);
}

function navigateToSubject(key) {
  if (!SUBJECTS[key]) return;
  renderSubjectFullPage(key);
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const synth = window.speechSynthesis;

let recognition = null;
let recognitionActive = false;
let userName = null;
let expectingName = true;

let preferredVoice = null;
function loadVoices() {
  if (!synth) return;
  setTimeout(() => {
    const voices = synth.getVoices();
    if (voices.length === 0) {
      console.warn('No voices loaded. Intentando de nuevo...');
      setTimeout(loadVoices, 500);
      return;
    }
    preferredVoice = voices.find(v => v.name.toLowerCase().includes('google') && v.lang.startsWith('es')) ||
      voices.find(v => v.lang.startsWith('es')) || voices[0];
    console.log('Voz preferida:', preferredVoice ? preferredVoice.name : 'Ninguna');
  }, 200);
}
if (synth) {
  synth.onvoiceschanged = loadVoices;
  loadVoices();
}

function speak(text, opts = {}) {
  return new Promise(resolve => {
    if (!synth) {
      alert('Síntesis de voz no soportada en este navegador.');
      return resolve();
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-ES';
    if (preferredVoice) u.voice = preferredVoice;
    u.onend = resolve;
    u.onerror = e => {
      console.error('Error en speak:', e);
      alert('Error en voz: ' + e.error);
      resolve();
    };
    synth.cancel();
    synth.speak(u);
  });
}

function createRecognition() {
  if (!SpeechRecognition) {
    alert('Reconocimiento de voz no soportado. Usa Chrome.');
    return null;
  }
  recognition = new SpeechRecognition();
  recognition.lang = 'es-ES';
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onstart = () => {
    recognitionActive = true;
    updateStatus('Escuchando...');
    console.log('Reconocimiento iniciado');
  };
  recognition.onend = () => {
    if (recognitionActive) recognition.start();
    else updateStatus('Inactivo');
  };
  recognition.onerror = evt => {
    console.error('Error reconocimiento:', evt);
    if (evt.error === 'not-allowed') alert('Permiso de micrófono denegado. Permítelo en configuración del navegador.');
    updateStatus('Error: ' + evt.error);
  };

  recognition.onresult = async event => {
    const texto = event.results[event.results.length - 1][0].transcript.trim();
    const lower = normalizeText(texto);
    console.log('Texto reconocido:', texto);

    if (!userName) {
      // Lógica para nombre (igual que antes)
      let nombre = /* ... (mantiene la lógica anterior para extraer nombre) */;
      if (nombre) {
        userName = nombre;
        expectingName = false;
        await pauseRecognitionWhileSpeaking('Hola ' + userName + '. Áreas disponibles.');
        renderSelectionPage();
        return;
      }
    }
    // Resto de lógica para materias, etc. (mantiene lo anterior)
  };

  return recognition;
}

function updateStatus(text) {
  document.getElementById('vaStatus').textContent = text;
}

async function pauseRecognitionWhileSpeaking(text) {
  const wasActive = recognitionActive;
  if (recognition && wasActive) recognition.abort();
  recognitionActive = false;
  updateStatus('Hablando...');
  await speak(text);
  if (wasActive) {
    recognition.start();
    recognitionActive = true;
    updateStatus('Escuchando...');
  }
}

function openChat({ speakOnOpen = true } = {}) {
  if (!SpeechRecognition || !synth) {
    updateStatus('No soportado');
    alert('Voz no soportada. Usa Chrome y permite micrófono.');
    return;
  }
  if (!recognition) recognition = createRecognition();
  try {
    recognition.start();
  } catch (e) {
    alert('Error iniciando reconocimiento: ' + e.message);
  }

  document.getElementById('voiceToggle').textContent = 'Cerrar chat';
  document.getElementById('voiceAssistantPanel').classList.remove('hidden');

  if (speakOnOpen) pauseRecognitionWhileSpeaking('Hola, ¿cuál es tu nombre?');
}

function closeChat() {
  if (recognition) recognition.stop();
  recognitionActive = false;
  synth.cancel();

  document.getElementById('voiceToggle').textContent = 'Abrir chat';
  document.getElementById('voiceAssistantPanel').classList.add('hidden');

  updateStatus('Inactivo');
  userName = null;
  expectingName = true;
}

const voiceToggle = document.getElementById('voiceToggle');
if (voiceToggle) {
  voiceToggle.addEventListener('click', () => {
    if (recognitionActive) closeChat();
    else openChat({ speakOnOpen: true });
  });
}

window.addEventListener('popstate', e => {
  const state = e.state;
  if (state && state.subject) renderSubjectFullPage(state.subject);
  else if (state && state.selection) renderSelectionPage();
  else goHome(false);
});





