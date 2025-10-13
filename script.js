const VIDEO_IFRAME_SRC = "https://res.cloudinary.com/dwzwa3gp0/video/upload/v1754274776/WhatsApp_Video_2025-08-03_at_9.27.00_PM_xabtde.mp4";

// --- Datos de materias y temas
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
  if (VIDEO_IFRAME_SRC && VIDEO_IFRAME_SRC.trim() !== '') {
    pv.src = VIDEO_IFRAME_SRC;
    if (placeholder) placeholder.style.display = 'none';
  } else {
    pv.src = '';
    if (placeholder) placeholder.style.display = 'block';
  }
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

  if (main) main.innerHTML = html;

  const volver = document.getElementById('volverBtn');
  if (volver) {
    volver.addEventListener('click', () => {
      renderSelectionPage();
    });
  }

  if (main) main.querySelectorAll('.open-topic').forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.dataset.title;
      alert(`Abriste: ${title}\nAquí puedes añadir ejercicios para ${title}.`);
    });
  });

  try {
    history.pushState({subject:key}, '', `#${key}`);
  } catch (e) { }
}

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

  if (main) main.innerHTML = html;

  if (main) {
    main.querySelectorAll('.subject-btn').forEach(b => {
      b.addEventListener('click', (e) => {
        const sub = e.currentTarget.dataset.subject;
        if (sub) navigateToSubject(sub);
      });
    });
  }

  const sv = document.getElementById('seleccionVolver');
  if (sv) sv.addEventListener('click', () => {
    goHome();
  });

  try {
    history.pushState({selection:true}, '', '#selection');
  } catch(e){}
}

function goHome(pushHistory = true) {
  if (main) main.innerHTML = HOME_HTML;
  setPresentationVideo();
  bindQuickButtons();

  if (pushHistory) {
    try {
      history.pushState({}, '', location.pathname.replace(location.hash,''));
    } catch(e){}
  }
}

function navigateToSubject(key) {
  if (!SUBJECTS[key]) return;
  renderSubjectFullPage(key);
}

// === ASISTENTE DE VOZ MEJORADO ===
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
const synth = window.speechSynthesis || null;

let recognition = null;
let recognitionActive = false;
let userName = null;
let expectingName = true;
let isSpeaking = false;

// Cargar voces mejorado
let preferredVoice = null;
let voicesLoaded = false;

function loadVoices() {
  if (!synth) return;
  const voices = synth.getVoices();
  if (!voices || voices.length === 0) return;
  
  voicesLoaded = true;
  
  // Buscar voz en español de Google
  preferredVoice = voices.find(v => 
    (v.name || '').toLowerCase().includes('google') && 
    (v.lang || '').startsWith('es')
  ) || voices.find(v => 
    (v.lang || '').startsWith('es')
  ) || voices[0];
  
  console.log('Voz seleccionada:', preferredVoice?.name || 'ninguna');
}

if (synth) {
  synth.onvoiceschanged = loadVoices;
  loadVoices();
  // Cargar voces adicional después de un delay
  setTimeout(loadVoices, 100);
}

// Función de síntesis mejorada
function speak(text, opts = {}) {
  return new Promise((resolve) => {
    if (!synth) {
      console.warn('speechSynthesis no disponible');
      return resolve();
    }

    // Asegurar que las voces estén cargadas
    if (!voicesLoaded) {
      loadVoices();
    }

    try {
      // Cancelar cualquier síntesis anterior
      synth.cancel();
      
      const u = new SpeechSynthesisUtterance(text);
      u.lang = opts.lang || 'es-ES';
      u.rate = opts.rate || 1.0;
      u.pitch = opts.pitch || 1.0;
      u.volume = opts.volume || 1.0;
      
      if (preferredVoice) {
        u.voice = preferredVoice;
      }

      isSpeaking = true;

      u.onstart = () => {
        console.log('Hablando:', text);
        isSpeaking = true;
      };

      u.onend = () => {
        console.log('Terminó de hablar');
        isSpeaking = false;
        resolve();
      };

      u.onerror = (e) => {
        console.error('Error en síntesis de voz:', e);
        isSpeaking = false;
        resolve();
      };

      // Pequeño delay para asegurar que funcione
      setTimeout(() => {
        synth.speak(u);
      }, 50);

    } catch (e) {
      console.error('Excepción en speak():', e);
      isSpeaking = false;
      resolve();
    }
  });
}

function createRecognition() {
  if (!SpeechRecognition) return null;
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
    console.log('Reconocimiento terminado');
    if (recognitionActive && !isSpeaking) {
      try { 
        recognition.start(); 
        console.log('Reconocimiento reiniciado');
      } catch (e) {
        console.warn('No se pudo reiniciar:', e);
      }
    } else {
      updateStatus('Inactivo');
    }
  };
  
  recognition.onerror = (evt) => {
    console.error('SpeechRecognition error:', evt.error);
    if (evt.error === 'no-speech' || evt.error === 'aborted') {
      // Errores normales, reintentar
      return;
    }
    updateStatus('Error: ' + (evt.error || 'desconocido'));
  };

  recognition.onresult = async (event) => {
    const texto = (event.results[event.results.length - 1][0].transcript || '').trim();
    const lower = normalizeText(texto);
    console.log('Reconocido:', texto);

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
        const reply = 'Hola ' + userName + '. Qué te gustaría aprender hoy. Aquí tienes la lista de áreas disponibles.';
        await pauseRecognitionWhileSpeaking(reply);
        renderSelectionPage();
        return;
      }
    }

    if (lower.includes('areas disponibles') || lower.includes('áreas disponibles')) {
      renderSelectionPage();
      await pauseRecognitionWhileSpeaking('Estas son las áreas disponibles');
      return;
    }

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

    if (lower.includes('volver') || lower.includes('inicio')) {
      goHome();
      await pauseRecognitionWhileSpeaking('Volviendo al inicio');
      return;
    }
  };

  return recognition;
}

function updateStatus(text){
  const s = document.getElementById('vaStatus');
  if (s) s.textContent = text;
}

// MEJORADO: usar stop() en lugar de abort()
async function pauseRecognitionWhileSpeaking(textToSay) {
  const wasActive = recognitionActive;
  
  if (recognition && wasActive) {
    recognitionActive = false;
    try { 
      recognition.stop(); // Cambiado de abort() a stop()
    } catch (e) {
      console.warn('Error al detener reconocimiento:', e);
    }
    updateStatus('Hablando...');
  }
  
  await speak(textToSay);
  
  // Esperar un poco más antes de reiniciar el reconocimiento
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (wasActive) {
    recognitionActive = true;
    try {
      recognition.start();
      updateStatus('Escuchando...');
    } catch (e) {
      console.warn('No se pudo reanudar reconocimiento:', e);
      updateStatus('Error al reanudar');
    }
  } else {
    updateStatus('Inactivo');
  }
}

function openChat({ speakOnOpen = true } = {}) {
  if (!SpeechRecognition || !synth) {
    updateStatus('Tu navegador no soporta reconocimiento o síntesis de voz.');
    alert('Tu navegador no soporta las funciones de voz necesarias. Prueba con Chrome o Edge.');
    return;
  }
  
  if (!recognition) recognition = createRecognition();
  
  try { 
    recognition.start(); 
    recognitionActive = true; 
    updateStatus('Escuchando...'); 
  } catch (e) {
    console.error('Error al iniciar reconocimiento:', e);
  }

  const voiceBtn = document.getElementById('voiceToggle');
  if (voiceBtn) {
    voiceBtn.textContent = '🔴 Cerrar chat';
    voiceBtn.setAttribute('aria-pressed','true');
  }

  const panel = document.getElementById('voiceAssistantPanel');
  if (panel) { 
    panel.classList.remove('hidden'); 
    panel.setAttribute('aria-hidden','false'); 
  }

  if (speakOnOpen) {
    pauseRecognitionWhileSpeaking('Hola, bienvenido, ¿cuál es tu nombre?');
  }
}

function closeChat() {
  if (recognition) {
    recognitionActive = false;
    try { recognition.stop(); } catch (e) {}
  }
  try { synth.cancel(); } catch (e) {}

  const voiceBtn = document.getElementById('voiceToggle');
  if (voiceBtn) {
    voiceBtn.textContent = '🎤 Asistente';
    voiceBtn.setAttribute('aria-pressed','false');
  }

  const panel = document.getElementById('voiceAssistantPanel');
  if (panel) { 
    panel.classList.add('hidden'); 
    panel.setAttribute('aria-hidden','true'); 
  }

  updateStatus('Inactivo');
  userName = null;
  expectingName = true;
}

const openBtnLegacy = document.getElementById('openChatBtn');
const closeBtnLegacy = document.getElementById('closeChatBtn');
if (openBtnLegacy) openBtnLegacy.style.display = 'none';
if (closeBtnLegacy) closeBtnLegacy.style.display = 'none';

const voiceToggle = document.getElementById('voiceToggle');
if (voiceToggle) {
  voiceToggle.textContent = '🎤 Asistente';
  voiceToggle.setAttribute('aria-pressed','false');

  voiceToggle.addEventListener('click', () => {
    if (recognitionActive) {
      closeChat();
    } else {
      openChat({ speakOnOpen: true });
    }
  });
}

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









