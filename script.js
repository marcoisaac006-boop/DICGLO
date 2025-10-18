const VIDEO_IFRAME_SRC = "https://res.cloudinary.com/dwzwa3gp0/video/upload/v1754274776/WhatsApp_Video_2025-08-03_at_9.27.00_PM_xabtde.mp4"; // <-- PON TU ENLACE MP4 AQUÍ (o embed YouTube para iframe)

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

// --- Elementos globales y snapshot del HOME para restaurar
const main = document.querySelector('main');
let HOME_HTML = main ? main.innerHTML : '';

// Ajustar el video según la constante interna (ahora usa <video>)
function setPresentationVideo() {
  const pv = document.getElementById('presentationVideo');
  const placeholder = document.getElementById('videoPlaceholder');
  if (!pv) return;
  if (VIDEO_IFRAME_SRC && VIDEO_IFRAME_SRC.trim() !== '') {
    pv.src = VIDEO_IFRAME_SRC;
    pv.load(); // Fuerza recarga
    if (placeholder) placeholder.style.display = 'none';
  } else {
    pv.src = '';
    if (placeholder) placeholder.style.display = 'block';
  }
}
setPresentationVideo();

// --- utilidades
function normalizeText(s) {
  return s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';
}

// Enlaza los botones rápidos que están en la página de inicio
function bindQuickButtons(){
  document.querySelectorAll('.subject-btn').forEach(b => {
    b.removeEventListener('click', quickBtnHandler); // Evita duplicados
    b.addEventListener('click', quickBtnHandler);
  });
}

function quickBtnHandler(e){
  const sub = e.currentTarget.dataset.subject;
  if (sub) navigateToSubject(sub);
  // CLICK: No hablar cuando el usuario hace click.
}
bindQuickButtons();

// --- RENDER: reemplaza el contenido principal por una "página" de resultados de la materia
function renderSubjectFullPage(key) {
  const sub = SUBJECTS[key];
  if (!sub) return;
  // construir HTML de la nueva "página"
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

  // reemplazamos TODO el contenido del <main> (inicio desaparece visualmente)
  if (main) main.innerHTML = html;

  // bind a botones del nuevo DOM
  const volver = document.getElementById('volverBtn');
  if (volver) {
    volver.addEventListener('click', () => {
      // CLICK: al presionar Volver no debe hablar. Redirigimos a la página de selección.
      renderSelectionPage();
      // no speak()
    });
  }

  // Bind a cada "Abrir" de tema
  if (main) main.querySelectorAll('.open-topic').forEach(btn => {
    btn.addEventListener('click', () => {
      const title = btn.dataset.title;
      // CLICK: no hablar aquí, sólo mostrar/abrir.
      alert(`Abriste: ${title}\nAquí puedes añadir ejercicios para ${title}.`);
    });
  });

  // guardar estado en el historial para que se comporte como "nueva página"
  try {
    history.pushState({subject:key}, '', `#${key}`);
  } catch (e) { /* ignore */ }
}

// --- NUEVO: renderiza la "página de selección" que aparece justo después de saludar al usuario por nombre
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

  // bind: botones grandes de materia
  if (main) {
    main.querySelectorAll('.subject-btn').forEach(b => {
      b.removeEventListener('click', quickBtnHandler); // Evita duplicados
      b.addEventListener('click', (e) => {
        const sub = e.currentTarget.dataset.subject;
        if (sub) {
          navigateToSubject(sub);
          // CLICK: no pauseRecognitionWhileSpeaking, no speak
        }
      });
    });
  }

  // bind: volver al inicio
  const sv = document.getElementById('seleccionVolver');
  if (sv) sv.addEventListener('click', () => {
    goHome();
    // CLICK: no speak()
  });

  // push state para que el back funcione
  try {
    history.pushState({selection:true}, '', '#selection');
  } catch(e){}
}

// Restaura la página de inicio guardada en HOME_HTML
function goHome(pushHistory = true) {
  if (main) main.innerHTML = HOME_HTML;
  // reconfigurar video y botones rápidos
  setPresentationVideo();
  bindQuickButtons();

  if (pushHistory) {
    try {
      history.pushState({}, '', location.pathname.replace(location.hash,''));
    } catch(e){}
  }
}

// Navegación por voz o click hacia una materia
function navigateToSubject(key) {
  if (!SUBJECTS[key]) return;
  renderSubjectFullPage(key);
}

// --- Asistente de voz (adaptado)
// Verificaciones de compatibilidad
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
const synth = window.speechSynthesis || null;

let recognition = null;
let recognitionActive = false;
let userName = null;
let expectingName = true;

// cargar voces con retraso para asegurar disponibilidad
let preferredVoice = null;
function loadVoices() {
  if (!synth) return;
  setTimeout(() => { // Retraso para que voces carguen en algunos navegadores
    const voices = synth.getVoices();
    if (!voices || voices.length === 0) {
      console.warn('No voices available');
      return;
    }
    preferredVoice = voices.find(v => (v.name || '').toLowerCase().includes('google') && (v.lang || '').startsWith('es'))
      || voices.find(v => (v.lang || '').startsWith('es'))
      || voices[0];
    console.log('Preferred voice:', preferredVoice ? preferredVoice.name : 'None');
  }, 100);
}
if (synth) { synth.onvoiceschanged = loadVoices; loadVoices(); }

function speak(text, opts = {}) {
  return new Promise((resolve) => {
    if (!synth) {
      console.warn('SpeechSynthesis not supported');
      return resolve();
    }
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = opts.lang || 'es-ES';
      if (preferredVoice) u.voice = preferredVoice;
      u.onend = () => resolve();
      u.onerror = (e) => {
        console.error('Speech error:', e);
        resolve();
      };
      synth.cancel();
      synth.speak(u);
    } catch (e) {
      console.error('Speak failed:', e);
      resolve();
    }
  });
}

function createRecognition() {
  if (!SpeechRecognition) {
    alert('Tu navegador no soporta reconocimiento de voz. Prueba Chrome o Edge.');
    return null;
  }
  recognition = new SpeechRecognition();
  recognition.lang = 'es-ES';
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onstart = () => { recognitionActive = true; updateStatus('Escuchando...'); };
  recognition.onend = () => {
    if (recognitionActive) {
      try { recognition.start(); } catch (e) { console.error('Restart failed:', e); }
    } else updateStatus('Inactivo');
  };
  recognition.onerror = (evt) => {
    console.error('SpeechRecognition error', evt);
    updateStatus('Error: ' + (evt.error || 'desconocido') + '. Permite el micrófono?');
  };

  recognition.onresult = async (event) => {
    const texto = (event.results[event.results.length - 1][0].transcript || '').trim();
    const lower = normalizeText(texto);
    console.log('Reconocido:', texto);

    // Si aún no tenemos nombre, intentamos capturarlo
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
        // RESPUESTA por voz: abrir la página de selección
        const reply = 'Hola ' + userName + '. Qué te gustaría aprender hoy. Aquí tienes la lista de áreas disponibles.';
        await pauseRecognitionWhileSpeaking(reply);
        renderSelectionPage();
        return;
      }
    }

    // Detectar frase para mostrar la página de selección (áreas disponibles)
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

    // frases compuestas y sinónimos simples
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

    // volver al inicio (voz)
    if (lower.includes('volver') || lower.includes('inicio')) {
      goHome();
      await pauseRecognitionWhileSpeaking('Volviendo al inicio');
      return;
    }

    // si no coincide nada, no hacemos speak
  };

  return recognition;
}

function updateStatus(text){
  const s = document.getElementById('vaStatus');
  if (s) s.textContent = text;
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
    } catch (e) { 
      console.warn('No se pudo reanudar reconocimiento:', e); 
      updateStatus('Error al reanudar');
    }
  } else updateStatus('Inactivo');
}

// openChat ahora acepta opciones para controlar si debe hablar al abrir (útil para distinguir click vs voz)
function openChat({ speakOnOpen = true } = {}) {
  if (!SpeechRecognition || !synth) {
    updateStatus('No soportado');
    alert('Tu navegador no soporta voz/reconocimiento. Usa Chrome para mejor experiencia.');
    return;
  }
  if (!recognition) recognition = createRecognition();
  try { 
    recognition.start(); 
    recognitionActive = true; 
    updateStatus('Escuchando...'); 
  } catch (e) {
    console.error('Start failed:', e);
    updateStatus('Error al iniciar');
  }

  // Actualizar etiqueta del botón único (voiceToggle)
  const voiceBtn = document.getElementById('voiceToggle');
  if (voiceBtn) {
    voiceBtn.textContent = 'Cerrar chat';
    voiceBtn.setAttribute('aria-pressed','true');
  }

  // Mostrar panel si existe (puede contener controles adicionales)
  const panel = document.getElementById('voiceAssistantPanel');
  if (panel) { panel.classList.remove('hidden'); panel.setAttribute('aria-hidden','false'); }

  // Sólo hablar si la apertura fue por VOZ (speakOnOpen === true)
  if (speakOnOpen) {
    pauseRecognitionWhileSpeaking('Hola, bienvenido, ¿cuál es tu nombre?');
  }
}

function closeChat() {
  if (recognition) {
    recognitionActive = false;
    try { recognition.stop(); } catch (e) {}
    try { recognition.abort(); } catch (e) {}
  }
  try { synth.cancel(); } catch (e) {}

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

// --- Limpieza y nuevo comportamiento: ocultar botones legacy (si existen) y usar solo el botón superior
const openBtnLegacy = document.getElementById('openChatBtn');
const closeBtnLegacy = document.getElementById('closeChatBtn');
if (openBtnLegacy) openBtnLegacy.style.display = 'none';
if (closeBtnLegacy) closeBtnLegacy.style.display = 'none';

// Configuración del botón único superior (#voiceToggle)
const voiceToggle = document.getElementById('voiceToggle');
if (voiceToggle) {
  // inicializar etiqueta
  voiceToggle.textContent = 'Abrir chat';
  voiceToggle.setAttribute('aria-pressed','false');

  voiceToggle.addEventListener('click', () => {
    if (recognitionActive) {
      closeChat();
    } else {
      // CLICK: abrir por click SÍ debe hablar (excepción solicitada)
      openChat({ speakOnOpen: true });
    }
  });
}

// --- Historial: manejar back/forward
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





