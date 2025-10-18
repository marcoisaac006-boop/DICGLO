
/**
 * app.js - versión corregida (reemplazar completamente)
 * - Usa <video> en lugar de iframe para MP4.
 * - Manejo robusto de speechSynthesis.getVoices() y SpeechRecognition.
 * - Mensajes claros y defensivos (no lanza errores si falta API).
 */

/* ===========================
   CONFIG
   =========================== */
// Pon aquí tu enlace MP4 (o deja vacío para que aparezca el placeholder)
const VIDEO_SRC = "https://res.cloudinary.com/dwzwa3gp0/video/upload/v1754274776/WhatsApp_Video_2025-08-03_at_9.27.00_PM_xabtde.mp4";

/* ===========================
   DATOS (no cambiar salvo quieras)
   =========================== */
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

/* ===========================
   SELECTORES / ESTADO
   =========================== */
const main = document.querySelector('main');
let HOME_HTML = main ? main.innerHTML : '';

/* ===========================
   VIDEO: asignar <video> correctamente
   =========================== */
function setPresentationVideo() {
  const videoEl = document.getElementById('presentationVideo');
  const sourceEl = document.getElementById('presentationVideoSource');
  const placeholder = document.getElementById('videoPlaceholder');
  if (!videoEl || !sourceEl) return;

  if (VIDEO_SRC && VIDEO_SRC.trim() !== '') {
    sourceEl.src = VIDEO_SRC;
    try { videoEl.load(); } catch (e) { /* ignore */ }
    if (placeholder) placeholder.style.display = 'none';
  } else {
    sourceEl.src = '';
    try { videoEl.load(); } catch (e) { /* ignore */ }
    if (placeholder) placeholder.style.display = 'block';
  }
}

/* ===========================
   UTILIDADES
   =========================== */
function normalizeText(s) {
  return s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';
}

function updateStatus(text) {
  const s = document.getElementById('vaStatus');
  if (s) s.textContent = text;
}

/* ===========================
   RENDER / NAVEGACIÓN
   =========================== */
function bindQuickButtons(){
  document.querySelectorAll('.subject-btn').forEach(b => {
    // remover listener anterior defensivamente
    try { b.removeEventListener('click', quickBtnHandler); } catch (e) {}
    b.addEventListener('click', quickBtnHandler);
  });
}

function quickBtnHandler(e){
  const sub = e.currentTarget ? e.currentTarget.dataset.subject : null;
  if (sub) navigateToSubject(sub);
}

// Renderizar la "página" completa de la materia
function renderSubjectFullPage(key) {
  const sub = SUBJECTS[key];
  if (!sub || !main) return;

  const topicsHtml = sub.topics.map(t => {
    return `<div class="topic-card">
      <h3>${t.title}</h3>
      <p>${t.desc}</p>
      <div style="margin-top:10px"><button class="open-topic" data-title="${t.title}">Abrir</button></div>
    </div>`;
  }).join('');

  const html = `
    <section class="card subject-full-page">
      <div class="subject-header" style="display:flex;align-items:center;justify-content:space-between;">
        <h1>${sub.title}</h1>
        <div>
          <button id="volverBtn" class="volver">← Volver</button>
        </div>
      </div>

      <div class="topics-grid" style="margin-top:12px;display:grid;gap:12px;">
        ${topicsHtml}
      </div>
    </section>
  `;

  main.innerHTML = html;

  const volver = document.getElementById('volverBtn');
  if (volver) {
    volver.addEventListener('click', () => {
      renderSelectionPage();
    });
  }

  main.querySelectorAll('.open-topic').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      const title = ev.currentTarget.dataset.title;
      alert(`Abriste: ${title}\nAquí puedes añadir ejercicios para ${title}.`);
    });
  });

  try { history.pushState({subject:key}, '', `#${key}`); } catch (e) {}
}

// Renderiza la página de selección (saludo + botones)
function renderSelectionPage() {
  const html = `
    <section class="card selection-page">
      <div class="selection-header">
        <h1>¡Hola ${userName || ''}!</h1>
        <p>(Puedes decir por voz: <strong>"Matemática"</strong> o <strong>"Lenguaje"</strong>, o tocar los botones de abajo).</p>
      </div>

      <div class="selection-buttons" style="margin-top:16px; display:flex; gap:12px; flex-wrap:wrap;">
        <button class="subject-btn large-subject-btn" data-subject="matematica" style="flex:1;min-width:120px;padding:18px;border-radius:10px;font-size:16px;font-weight:700;">Matemática</button>
        <button class="subject-btn large-subject-btn" data-subject="lenguaje" style="flex:1;min-width:120px;padding:18px;border-radius:10px;font-size:16px;font-weight:700;">Lenguaje</button>
      </div>

      <div style="margin-top:18px;">
        <button id="seleccionVolver" class="volver">← Volver al inicio</button>
      </div>
    </section>
  `;

  if (!main) return;
  main.innerHTML = html;

  // bind botones
  main.querySelectorAll('.subject-btn').forEach(b => {
    b.addEventListener('click', (e) => {
      const sub = e.currentTarget.dataset.subject;
      if (sub) navigateToSubject(sub);
    });
  });

  const sv = document.getElementById('seleccionVolver');
  if (sv) sv.addEventListener('click', () => {
    goHome();
  });

  try { history.pushState({selection:true}, '', '#selection'); } catch(e){}
}

// Restaurar home guardado
function goHome(pushHistory = true) {
  if (!main) return;
  main.innerHTML = HOME_HTML;
  // reconfigurar video y botones rápidos
  setPresentationVideo();
  // espera microtick para enlazar botones que acaben de crearse
  setTimeout(bindQuickButtons, 40);

  if (pushHistory) {
    try { history.pushState({}, '', location.pathname.replace(location.hash,'')); } catch(e){}
  }
}

function navigateToSubject(key) {
  if (!SUBJECTS[key]) return;
  renderSubjectFullPage(key);
}

/* ===========================
   ASISTENTE DE VOZ (SpeechRecognition + speechSynthesis)
   =========================== */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
const synth = window.speechSynthesis || null;

let recognition = null;
let recognitionActive = false;
let userName = null;
let expectingName = true;

// VOCES: preferencia y carga robusta
let preferredVoice = null;
function choosePreferredVoice(voices) {
  return voices.find(v => (v.name || '').toLowerCase().includes('google') && (v.lang || '').startsWith('es'))
    || voices.find(v => (v.lang || '').startsWith('es'))
    || voices[0];
}

function loadVoices() {
  if (!synth) return;
  let voices = synth.getVoices();
  if (voices && voices.length > 0) {
    preferredVoice = choosePreferredVoice(voices);
    return;
  }
  // Reintentar ligeramente después (algunos navegadores llenan voces asíncronamente)
  setTimeout(() => {
    voices = synth.getVoices();
    if (voices && voices.length > 0) {
      preferredVoice = choosePreferredVoice(voices);
    }
  }, 250);
}

if (synth) {
  synth.onvoiceschanged = loadVoices;
  loadVoices();
}

// speak: devuelve Promise para poder esperar
function speak(text, opts = {}) {
  return new Promise((resolve) => {
    if (!synth) return resolve();
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = opts.lang || 'es-ES';
      if (preferredVoice) u.voice = preferredVoice;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      try { synth.cancel(); } catch (e) {}
      synth.speak(u);
    } catch (e) { resolve(); }
  });
}

function createRecognition() {
  if (!SpeechRecognition) return null;
  recognition = new SpeechRecognition();
  recognition.lang = 'es-ES';
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onstart = () => { recognitionActive = true; updateStatus('Escuchando...'); };
  recognition.onend = () => {
    // si debe seguir activo, reiniciamos
    if (recognitionActive) {
      try { recognition.start(); } catch (e) { updateStatus('Inactivo'); }
    } else updateStatus('Inactivo');
  };
  recognition.onerror = (evt) => {
    console.error('SpeechRecognition error', evt);
    updateStatus('Error: ' + (evt.error || 'desconocido'));
  };

  recognition.onresult = async (event) => {
    try {
      const last = event.results[event.results.length - 1];
      const texto = (last && last[0] && last[0].transcript) ? last[0].transcript.trim() : '';
      const lower = normalizeText(texto);
      console.log('Reconocido:', texto);

      // Capturar nombre si no hay userName
      if (!userName) {
        let nombre = null;
        if (lower.includes('me llamo')) nombre = texto.split(/me llamo/i)[1] || '';
        else if (lower.includes('mi nombre es')) nombre = texto.split(/mi nombre es/i)[1] || '';
        else if (lower.match(/^soy\s+/i)) nombre = texto.replace(/^soy\s+/i, '');
        else {
          const palabras = lower.split(/\s+/).filter(Boolean);
          if (expectingName && palabras.length <= 4) nombre = texto;
        }

        if (nombre) {
          nombre = nombre.replace(/[.,!?]$/g,'').trim();
          nombre = nombre.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          userName = nombre;
          expectingName = false;
          const reply = 'Hola ' + userName + '. ¿Qué te gustaría aprender hoy? Aquí tienes la lista de áreas disponibles.';
          await pauseRecognitionWhileSpeaking(reply);
          renderSelectionPage();
          return;
        }
      }

      // Comandos de voz -> abrir selección
      if (lower.includes('areas disponibles') || lower.includes('áreas disponibles')) {
        renderSelectionPage();
        await pauseRecognitionWhileSpeaking('Estas son las áreas disponibles');
        return;
      }

      // Detectar materias por palabra clave
      for (const key of Object.keys(SUBJECTS)) {
        const titleNorm = normalizeText(SUBJECTS[key].title);
        if (lower.includes(key) || lower.includes(titleNorm)) {
          navigateToSubject(key);
          await pauseRecognitionWhileSpeaking(`Perfecto. Estos son los temas disponibles del área de ${SUBJECTS[key].title}`);
          return;
        }
      }

      if (lower.includes('matemat') || lower.includes('mate')) {
        navigateToSubject('matematica');
        await pauseRecognitionWhileSpeaking('Perfecto. Estos son los temas disponibles de matemática');
        return;
      }
      if (lower.includes('lengua') || lower.includes('lenguaje') || lower.includes('gramatic')) {
        navigateToSubject('lenguaje');
        await pauseRecognitionWhileSpeaking('Perfecto. Estos son los temas disponibles de lenguaje');
        return;
      }

      // Volver al inicio
      if (lower.includes('volver') || lower.includes('inicio')) {
        goHome();
        await pauseRecognitionWhileSpeaking('Volviendo al inicio');
        return;
      }
      // Si no coincide nada, no hacemos speak
    } catch (e) {
      console.error('Error procesando resultado de reconocimiento:', e);
    }
  };

  return recognition;
}

async function pauseRecognitionWhileSpeaking(textToSay) {
  const wasActive = !!recognitionActive;
  if (recognition && wasActive) {
    try { recognition.abort(); } catch (e) {}
    recognitionActive = false;
    updateStatus('Hablando...');
  }
  await speak(textToSay);
  if (wasActive) {
    try {
      recognition.start();
      recognitionActive = true;
      updateStatus('Escuchando...');
    } catch (e) { console.warn('No se pudo reanudar reconocimiento:', e); updateStatus('Inactivo'); }
  } else updateStatus('Inactivo');
}

function openChat({ speakOnOpen = true } = {}) {
  if (!SpeechRecognition || !synth) {
    updateStatus('Tu navegador no soporta reconocimiento o síntesis de voz.');
    return;
  }
  if (!recognition) recognition = createRecognition();
  try { recognition.start(); recognitionActive = true; updateStatus('Escuchando...'); } catch (e) { console.warn('No se pudo iniciar reconocimiento:', e); }

  const voiceBtn = document.getElementById('voiceToggle');
  if (voiceBtn) {
    voiceBtn.textContent = 'Cerrar chat';
    voiceBtn.setAttribute('aria-pressed','true');
  }

  const panel = document.getElementById('voiceAssistantPanel');
  if (panel) { panel.classList.remove('hidden'); panel.setAttribute('aria-hidden','false'); }

  if (speakOnOpen) {
    // preguntar nombre
    pauseRecognitionWhileSpeaking('Hola, bienvenido, ¿cuál es tu nombre?');
  }
}

function closeChat() {
  if (recognition) {
    recognitionActive = false;
    try { recognition.stop(); } catch (e) {}
    try { recognition.abort(); } catch (e) {}
  }
  try { if (synth) synth.cancel(); } catch (e) {}

  const voiceBtn = document.getElementById('voiceToggle');
  if (voiceBtn) {
    voiceBtn.textContent = 'Abrir chat';
    voiceBtn.setAttribute('aria-pressed','false');
  }

  const panel = document.getElementById('voiceAssistantPanel');
  if (panel) { panel.classList.add('hidden'); panel.setAttribute('aria-hidden','true'); }

  updateStatus('Inactivo');
  userName = null;
  expectingName = true;
}

/* ===========================
   INICIALIZACIÓN UI / BOTONES
   =========================== */
// Ocultar botones legacy si existen
const openBtnLegacy = document.getElementById('openChatBtn');
const closeBtnLegacy = document.getElementById('closeChatBtn');
if (openBtnLegacy) openBtnLegacy.style.display = 'none';
if (closeBtnLegacy) closeBtnLegacy.style.display = 'none';

// Configuración del botón superior
const voiceToggle = document.getElementById('voiceToggle');
if (voiceToggle) {
  voiceToggle.textContent = 'Abrir chat';
  voiceToggle.setAttribute('aria-pressed','false');

  voiceToggle.addEventListener('click', () => {
    if (recognitionActive) {
      closeChat();
    } else {
      // CLICK: abrir por click (se hablará)
      openChat({ speakOnOpen: true });
    }
  });
}

// Enlace inicial de botones rápidos (si existen en HOME)
setTimeout(() => {
  try { bindQuickButtons(); } catch (e) {}
}, 80);

/* ===========================
   COMPATIBILIDAD / ADVERTENCIAS
   =========================== */
function showSupportWarnings() {
  const missing = [];
  if (!SpeechRecognition) missing.push('reconocimiento de voz (SpeechRecognition)');
  if (!synth) missing.push('síntesis de voz (speechSynthesis)');
  if (missing.length) {
    console.warn('Faltan APIs en este navegador:', missing.join(', '));
    updateStatus('Tu navegador no soporta ' + missing.join(' y ') + '. Prueba Chrome/Edge en HTTPS.');
  }
}
showSupportWarnings();

/* ===========================
   HISTORIAL (back/forward)
   =========================== */
window.addEventListener('popstate', (e) => {
  const state = e.state;
  if (state && state.subject) {
    renderSubjectFullPage(state.subject);
  } else if (state && state.selection) {
    renderSelectionPage();
  } else {
    goHome(false);
  }
});

/* ===========================
   INICIAL: configurar video y guardar HOME_HTML (ya hecho arriba)
   =========================== */
try { setPresentationVideo(); } catch (e) { console.warn('No se pudo configurar video al inicio:', e); }






