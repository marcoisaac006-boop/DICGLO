/******************** CONFIG: audios + documentos ********************/
const AUDIO_1_URL = "https://res.cloudinary.com/dwzwa3gp0/video/upload/v1755391887/speechma_audio_Jorge_at_7_50_15_PM_on_August_16th_2025_evao84.mp3";
const AUDIO_3_URL = "https://res.cloudinary.com/dwzwa3gp0/video/upload/v1755391887/speechma_audio_Jorge_at_7_50_15_PM_on_August_16th_2025_evao84.mp3";

/* IMPORTANTE: usa URLs de Google Docs con export?format=txt (no 'edit'). */
const DOCS_TXT_URLS = [
  "https://docs.google.com/document/d/16c6Tbj99vgP59L9mBjrAYXmODqfL-IkwZBWUrYX1T2c/export?format=txt",
  "https://docs.google.com/document/d/16c6Tbj99vgP59L9mBjrAYXmODqfL-IkwZBWUrYX1T2c/export?format=txt"
];
const DOC_TITLES = ["Lectura 1","Lectura 2"];

/******************** ELEMENT SELECTORS (se asume script al final del body) ********************/
const sections = {
  welcome: document.getElementById("welcome"),
  neon: document.getElementById("neon-section"),
  reader: document.getElementById("reader-section"),
  questions: document.getElementById("questions-section"),
};
const enterButton = document.getElementById("enter-button");
const finishReading = document.getElementById("finishReading");
const audio1 = document.getElementById("audio1");
const audio3 = document.getElementById("audio3");
if(audio1) audio1.src = AUDIO_1_URL;
if(audio3) audio3.src = AUDIO_3_URL;

/* Reader UI */
const bookContent = document.getElementById("bookContent");
const docTitleEl = document.getElementById("docTitle");
const pageIndicator = document.getElementById("pageIndicator");
const prevBtn = document.getElementById("prevPage");
const nextBtn = document.getElementById("nextPage");
let currentDocIndex = 0;

/* Examen */
const examForm = document.getElementById("exam-form");
const submitButton = document.getElementById("submit-button");
const submissionMessage = document.getElementById("submission-message");
const formWarning = document.getElementById("form-warning");
let orderList = document.getElementById("order-list"); // puede reasignarse en init

/* Puntaje UI (intencionalmente puede ser null porque lo ocultaste en HTML) */
const scoreValueEl = document.getElementById("score-value"); // normalmente null en tu versión

/* Modal & user inputs (moved up so available to helpers) */
const startModal = document.getElementById("start-modal");
const confirmUserButton = document.getElementById("confirm-user");
const userNameInput = document.getElementById("user-name");
const userNameHidden = document.getElementById("user-name-hidden");
let userName = "";

/******************** UTILIDADES GENERALES ********************/
function showSection(id){
  Object.values(sections).forEach(s => s && s.classList.remove("active"));
  if(sections[id]) sections[id].classList.add("active");
}

/* escapeHtml seguro (arreglado para apostrofe) */
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, function(m){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
  });
}

/* Helper: devuelve nombre legible para logs (fallback a ANÓNIMO) */
function getUserNameForLogs(){
  return (userName && userName.trim()) || (userNameHidden && userNameHidden.value) || "ANÓNIMO";
}

/******************** THREE.JS (mantenido, no modifiqué la lógica visual) ********************/
const canvas = document.getElementById("neonCanvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
let scene=null, camera=null, cubes=[], basePositions=[], binIndex=[];
let animationActive=false;
let audioCtx=null, analyser=null, dataArray=null, currentSource=null, currentAudioEl=null;

function initThree(){
  if(scene) return;
  scene = new THREE.Scene();
  const parent = canvas.parentElement;
  const width = parent.clientWidth, height = parent.clientHeight;
  camera = new THREE.PerspectiveCamera(75, width/height, .1, 1000);
  camera.position.z = 20;
  const ambientLight = new THREE.AmbientLight(0x00ffff, .7);
  const pointLight = new THREE.PointLight(0x00ffff, 2.2, 100);
  pointLight.position.set(15,15,15);
  scene.add(ambientLight, pointLight);
  const sphereRadius = 6, cubeCount = 1000;
  const cubeGeometry = new THREE.BoxGeometry(.12,.12,.12);
  for(let i=0;i<cubeCount;i++){
    const theta = Math.random()*Math.PI*2;
    const phi = Math.acos((Math.random()*2)-1);
    const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
    const y = sphereRadius * Math.sin(phi) * Math.sin(theta);
    const z = sphereRadius * Math.cos(phi);
    const mat = new THREE.MeshStandardMaterial({
      color:0x00ffff,emissive:0x00ffff,emissiveIntensity:2.0,metalness:1,roughness:.2
    });
    const cube = new THREE.Mesh(cubeGeometry, mat);
    cube.position.set(x,y,z);
    basePositions.push(new THREE.Vector3(x,y,z));
    cubes.push(cube);
    scene.add(cube);
  }
  resizeRendererToDisplaySize();
  renderer.render(scene, camera);
}

function connectAudioToAnalyser(audioEl){
  if(!audioCtx){ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
  if(!audioEl._connectedSource){
    try{ audioEl._connectedSource = audioCtx.createMediaElementSource(audioEl); }
    catch(err){ console.warn("No se pudo crear MediaElementSource:", err); }
  }
  if(currentSource && currentSource.disconnect){
    try{ currentSource.disconnect(); }catch(e){}
  }
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  currentSource = audioEl._connectedSource || null;
  if(currentSource){
    currentSource.connect(analyser);
    analyser.connect(audioCtx.destination);
  }
  binIndex = cubes.map((_,i)=> i % analyser.frequencyBinCount);
  currentAudioEl = audioEl;
}

function startNeonWithAudio(audioEl){
  initThree();
  connectAudioToAnalyser(audioEl);
  animationActive = true;
  audioEl.currentTime = 0;
  audioEl.play().catch(err=>console.warn("No se pudo reproducir el audio automáticamente:", err));
  animateLoop();
}
function stopNeon(){ animationActive=false; if(currentAudioEl){ try{ currentAudioEl.pause(); }catch(e){} } }
function animateLoop(){
  if(!animationActive) return;
  requestAnimationFrame(animateLoop);
  if(analyser && dataArray){
    analyser.getByteFrequencyData(dataArray);
    const avg = dataArray.reduce((a,b)=>a+b,0) / dataArray.length;
    const energy = avg / 255;
    const time = performance.now()*0.001;
    const waveSpeed = 2.0, waveAmplitude = 0.4;
    const audioPush = 0.9 * energy;
    for(let i=0;i<cubes.length;i++){
      const cube = cubes[i];
      const base = basePositions[i];
      const bin = binIndex[i];
      const amp = (dataArray[bin] || 0) / 255;
      const wave = Math.sin(time*waveSpeed + i*0.015);
      const factor = 1 + (wave*waveAmplitude*(0.5+energy*0.5)) + (audioPush*amp);
      cube.position.set(base.x*factor, base.y*factor, base.z*factor);
      cube.rotation.x += 0.01 + amp * 0.02;
      cube.rotation.y += 0.01 + amp * 0.02;
      cube.material.emissiveIntensity = 1.6 + amp*1.2 + energy*0.6;
    }
    scene.rotation.y += 0.002 + energy*0.01;
    scene.rotation.x += 0.001 + energy*0.005;
  }
  renderer.render(scene, camera);
}
function resizeRendererToDisplaySize(){
  if(!canvas || !canvas.parentElement) return;
  const parent = canvas.parentElement;
  const width = parent.clientWidth, height = parent.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setSize(Math.floor(width*dpr), Math.floor(height*dpr), false);
  if(camera){
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
  }
}
window.addEventListener("resize", resizeRendererToDisplaySize);

/******************** FLOW: botones & audio events ********************/
enterButton && enterButton.addEventListener("click", async ()=>{
  if(!audioCtx){ try{ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ console.warn(e); } }
  else if(audioCtx.state === "suspended"){ try{ await audioCtx.resume(); }catch(e){} }
  showSection("neon");
  if(audio1) startNeonWithAudio(audio1);
});
audio1 && audio1.addEventListener("ended", ()=>{
  stopNeon();
  currentDocIndex = 0;
  showSection("reader");
  loadDoc(currentDocIndex);
});
/* MODIFICACIÓN: Lógica del botón "Terminé de leer" */
finishReading && finishReading.addEventListener("click", async ()=>{
  if(currentDocIndex < DOCS_TXT_URLS.length - 1){
    alert("Aún quedan lecturas. Usa ► para avanzar a la siguiente página antes de finalizar.");
    return;
  }
  
  // Si llegó aquí, significa que terminó la última lectura
  // Mostrar pantalla de espera en lugar de continuar automáticamente
  showSection("neon"); if(audio3) startNeonWithAudio(audio3);
});
  
  
audio3 && audio3.addEventListener("ended", ()=>{
  stopNeon();
  showSection("questions");
});

/******************** READER: carga documentos (.txt) y paginación ********************/
async function loadDoc(index){
  if(!bookContent) return;
  bookContent.textContent = "Cargando...";
  docTitleEl && (docTitleEl.textContent = DOC_TITLES[index] || `Documento ${index+1}`);
  pageIndicator && (pageIndicator.textContent = `Documento ${index+1} / ${DOCS_TXT_URLS.length}`);
  if(prevBtn) prevBtn.disabled = index === 0;
  if(nextBtn) nextBtn.disabled = index === DOCS_TXT_URLS.length - 1;

  const url = DOCS_TXT_URLS[index];
  try{
    const res = await fetch(url, { mode:"cors" });
    if(!res.ok) throw new Error("HTTP " + res.status);
    const text = await res.text();
    renderTextAsHTML(text);
  }catch(err){
    console.error("Error cargando doc:", err);
    if(bookContent) bookContent.innerHTML = `<p>No se pudo cargar el documento.<br>Revisa que el documento sea público y que uses la URL: <code>/export?format=txt</code></p>`;
  }
}
function renderTextAsHTML(text){
  if(!bookContent) return;
  const paras = text.split(/\n{2,}/g).map(p=>p.trim()).filter(Boolean);
  const html = paras.map(p => `<p>${escapeHtml(p).replace(/\n/g,"<br>")}</p>`).join("");
  bookContent.innerHTML = html;
}
prevBtn && prevBtn.addEventListener("click", ()=>{ if(currentDocIndex>0){ currentDocIndex--; loadDoc(currentDocIndex); } });
nextBtn && nextBtn.addEventListener("click", ()=>{ if(currentDocIndex < DOCS_TXT_URLS.length - 1){ currentDocIndex++; loadDoc(currentDocIndex); } });

/******************** EXAMEN: lógica de puntuación y juegos ********************/
/* Orden correcto fallback */
const correctOrder = ["En","un","lugar","de","la","Mancha","vivía","un","hidalgo"];

/* Desordenar y drag & drop - solo si existe orderList */
(function initOrderListShuffleAndDrag(){
  orderList = document.getElementById("order-list");
  if(!orderList) return;
  // Shuffle (robusto)
  const items = Array.from(orderList.querySelectorAll("li"));
  const cloned = items.slice();
  while(cloned.length){
    const idx = Math.floor(Math.random() * cloned.length);
    orderList.appendChild(cloned.splice(idx,1)[0]);
  }
  // Drag handlers
  let dragSrc = null;
  orderList.addEventListener("dragstart", (e)=>{
    const li = e.target.closest("li");
    if(!li) return;
    dragSrc = li;
    e.dataTransfer.effectAllowed = "move";
    try{ e.dataTransfer.setData("text/plain", li.dataset.word); }catch(err){}
  });
  orderList.addEventListener("dragover", (e)=>{ e.preventDefault(); e.dataTransfer.dropEffect = "move"; });
  orderList.addEventListener("drop", (e)=>{
    e.preventDefault();
    const target = e.target.closest("li");
    if(!target || !dragSrc || target===dragSrc) return;
    const nodes = Array.from(orderList.children);
    const srcIndex = nodes.indexOf(dragSrc);
    const tgtIndex = nodes.indexOf(target);
    if(srcIndex < tgtIndex) orderList.insertBefore(dragSrc, target.nextSibling);
    else orderList.insertBefore(dragSrc, target);
    // evaluar el orden tras el drop (si corresponde)
    setTimeout(checkOrderNow, 20);
  });
})();

/* ------------------ LÓGICA DE PUNTUACIÓN (2 pts por pregunta) ------------------ */
let score = 0;
const SCORE_PER_QUESTION = 2;
const awarded = new Set(); // claves (ej. "q1","v2","order")
let logsArray = []; // Nueva: para recopilar logs y enviar a Formspree

/* Actualiza UI si exists (no la usas) */
function updateScoreDisplay(){
  if(scoreValueEl) scoreValueEl.textContent = score;
}

/* Etiquetas legibles */
function prettyLabelFor(key){
  if(!key) return key;
  if(key === "order") return "Ordena la oración";
  if(key.startsWith("q")) return `Pregunta ${key.slice(1)}`;
  if(key.startsWith("v")) return `Vocabulario ${key.slice(1)}`;
  return key;
}

/* Detecta todas las preguntas presentes en el DOM */
function getQuestionKeys(){
  const radios = Array.from(document.querySelectorAll('input[type="radio"]')).map(r=>r.name).filter(Boolean);
  const uniqueRadios = Array.from(new Set(radios));
  const selects = Array.from(document.querySelectorAll('select')).map(s=>s.name).filter(Boolean);
  const keys = uniqueRadios.concat(selects);
  if(document.getElementById("order-list")) keys.push("order");
  return keys;
}

/* Devuelve true si la pregunta tiene data-correct="requerida" (convención) */
function questionHasRequiredMarker(key){
  if(!key) return false;
  if(key === "order"){
    const fs = document.getElementById("order-list")?.closest("fieldset");
    return !!(fs && fs.dataset && String(fs.dataset.correct).trim() === "requerida");
  }
  // radio
  if(document.querySelector(`input[name="${CSS.escape(key)}"][data-correct="requerida"]`)) return true;
  // select option
  if(document.querySelector(`select[name="${CSS.escape(key)}"] option[data-correct="requerida"]`)) return true;
  return false;
}

/* Devuelve el valor "correcto" declarado en el markup:
   - para radios: devuelve value del input[data-correct]
   - para selects: devuelve value del option[data-correct]
   - para order: devuelve array con la secuencia (split por comas)
*/
function getCorrectValueFor(key){
  if(!key) return null;
  if(key === "order"){
    const fs = document.getElementById("order-list")?.closest("fieldset");
    if(fs && fs.dataset && fs.dataset.answer) {
      return fs.dataset.answer.split(",").map(s=>s.trim());
    }
    return correctOrder.slice();
  }
  const radio = document.querySelector(`input[name="${CSS.escape(key)}"][data-correct="requerida"]`);
  if(radio) return radio.value ?? null;
  const opt = document.querySelector(`select[name="${CSS.escape(key)}"] option[data-correct="requerida"]`);
  if(opt) return opt.value ?? null;
  return null;
}

/* Lista preguntas que NO tienen la marca 'requerida' (útil para debug) */
function listarPreguntasFaltantes(){
  const keys = getQuestionKeys();
  const faltantes = keys.filter(k => !questionHasRequiredMarker(k));
  return faltantes.map(k => ({ key: k, label: prettyLabelFor(k) }));
}

/* Funciones publicas para consola/debug */
function obtenerPuntaje(){ return score; }
window.obtenerPuntaje = obtenerPuntaje;
window.listarPreguntasFaltantes = listarPreguntasFaltantes;

/* Imprime resumen inicial al cargar */
function printInitialSummary(){
  const keys = getQuestionKeys();
  const faltantes = listarPreguntasFaltantes();
  console.log(`EXAMEN CARGADO — Usuario: ${getUserNameForLogs()} — Preguntas totales detectadas: ${keys.length}. Preguntas SIN 'requerida': ${faltantes.length}. Puntaje inicial: ${score}.`);
  if(faltantes.length){
    console.log("Preguntas faltantes (sin marca 'requerida'):", faltantes.map(f=>f.key));
  }
  updateScoreDisplay();
}

/* ------------------ Manejo inmediato: radios y selects ------------------ */
function handleRadioChange(e){
  const name = e.target.name;
  if(!name) return;
  if(!questionHasRequiredMarker(name)){
    console.log(`${getUserNameForLogs()} — ${prettyLabelFor(name)} sin alternativa requerida configurada.`);
    return;
  }
  const selected = document.querySelector(`input[name="${CSS.escape(name)}"]:checked`);
  if(!selected){ console.log(`${getUserNameForLogs()} — ${prettyLabelFor(name)}: sin selección.`); return; }
  const correctVal = getCorrectValueFor(name);
  const isCorrect = (correctVal !== null && selected.value === correctVal);
  if(isCorrect){
    if(!awarded.has(name)){
      awarded.add(name);
      score += SCORE_PER_QUESTION;
      const logStr = `${getUserNameForLogs()} — ${prettyLabelFor(name)} respondida correctamente. +${SCORE_PER_QUESTION} puntos. Puntaje total: ${score}`;
      logsArray.push(logStr);
      console.log(logStr);
      updateScoreDisplay();
    }else{
      const logStr = `${getUserNameForLogs()} — ${prettyLabelFor(name)} ya había sumado antes. Puntaje total: ${score}`;
      logsArray.push(logStr);
      console.log(logStr);
    }
  }else{
    const logStr = `${getUserNameForLogs()} — ${prettyLabelFor(name)} incorrecta. Puntaje total: ${score}`;
    logsArray.push(logStr);
    console.log(logStr);
  }
}

function handleSelectChange(e){
  const name = e.target.name;
  if(!name) return;
  if(!questionHasRequiredMarker(name)){
    console.log(`${getUserNameForLogs()} — ${prettyLabelFor(name)} sin alternativa requerida configurada.`);
    return;
  }
  const sel = e.target;
  const opt = sel.options[sel.selectedIndex];
  if(!opt || !opt.value){ console.log(`${getUserNameForLogs()} — ${prettyLabelFor(name)}: sin selección válida.`); return; }
  const correctVal = getCorrectValueFor(name);
  const isCorrect = (correctVal !== null && opt.value === correctVal);
  if(isCorrect){
    if(!awarded.has(name)){
      awarded.add(name);
      score += SCORE_PER_QUESTION;
      const logStr = `${getUserNameForLogs()} — ${prettyLabelFor(name)} respondida correctamente. +${SCORE_PER_QUESTION} puntos. Puntaje total: ${score}`;
      logsArray.push(logStr);
      console.log(logStr);
      updateScoreDisplay();
    }else{
      const logStr = `${getUserNameForLogs()} — ${prettyLabelFor(name)} ya había sumado antes. Puntaje total: ${score}`;
      logsArray.push(logStr);
      console.log(logStr);
    }
  }else{
    const logStr = `${getUserNameForLogs()} — ${prettyLabelFor(name)} incorrecta. Puntaje total: ${score}`;
    logsArray.push(logStr);
    console.log(logStr);
  }
}

/* Evaluación del juego 'order' */
function checkOrderNow(){
  const ol = document.getElementById("order-list");
  if(!ol) return;
  const key = "order";
  if(!questionHasRequiredMarker(key)){
    console.log(`${getUserNameForLogs()} — ${prettyLabelFor(key)} sin alternativa requerida configurada.`);
    return;
  }
  const currentWords = Array.from(ol.querySelectorAll("li")).map(li=>String(li.dataset.word).trim());
  const expected = getCorrectValueFor(key) || correctOrder;
  const ok = currentWords.length === expected.length && currentWords.every((w,i)=> w === expected[i]);
  if(ok){
    if(!awarded.has(key)){
      awarded.add(key);
      score += SCORE_PER_QUESTION;
      const logStr = `${getUserNameForLogs()} — ${prettyLabelFor(key)} respondida correctamente. +${SCORE_PER_QUESTION} puntos. Puntaje total: ${score}`;
      logsArray.push(logStr);
      console.log(logStr);
      updateScoreDisplay();
    }else{
      const logStr = `${getUserNameForLogs()} — ${prettyLabelFor(key)} ya había sumado antes. Puntaje total: ${score}`;
      logsArray.push(logStr);
      console.log(logStr);
    }
  }else{
    const logStr = `${getUserNameForLogs()} — ${prettyLabelFor(key)} incorrecta. Puntaje total: ${score}`;
    logsArray.push(logStr);
    console.log(logStr);
  }
}

/* Attach immediate listeners (si existen elementos) */
document.querySelectorAll('input[type="radio"]').forEach(r => r.addEventListener('change', handleRadioChange));
document.querySelectorAll('select').forEach(s => s.addEventListener('change', handleSelectChange));

/* ------------------ Evaluación completa (resumen ordenado) ------------------ */
function evaluateAllNow(){
  const keys = getQuestionKeys();
  const results = [];
  for(const key of keys){
    let marked = questionHasRequiredMarker(key);
    let selected = null;
    let isCorrect = false;
    if(key === "order"){
      const ol = document.getElementById("order-list");
      selected = ol ? Array.from(ol.querySelectorAll("li")).map(li=>li.dataset.word) : null;
      const expected = getCorrectValueFor(key) || correctOrder;
      isCorrect = Array.isArray(selected) && selected.length === expected.length && selected.every((w,i)=> w === expected[i]);
    }else{
      const radios = document.querySelectorAll(`input[name="${CSS.escape(key)}"]`);
      if(radios && radios.length){
        const sel = document.querySelector(`input[name="${CSS.escape(key)}"]:checked`);
        selected = sel ? sel.value : null;
        const correctVal = getCorrectValueFor(key);
        isCorrect = (correctVal !== null && selected === correctVal);
      }else{
        const selEl = document.querySelector(`select[name="${CSS.escape(key)}"]`);
        if(selEl){
          const opt = selEl.options[selEl.selectedIndex];
          selected = opt ? opt.value : null;
          const correctVal = getCorrectValueFor(key);
          isCorrect = (correctVal !== null && selected === correctVal);
        }
      }
    }

    let awardedNow = 0;
    if(isCorrect && !awarded.has(key)){
      awarded.add(key);
      score += SCORE_PER_QUESTION;
      awardedNow = SCORE_PER_QUESTION;
    }
    results.push({ key, label: prettyLabelFor(key), marked, selected, isCorrect, awardedNow });
  }

  // Imprimir resumen ordenado en consola
  console.group(`RESUMEN ORDENADO DEL EXAMEN — Usuario: ${getUserNameForLogs()}`);
  results.forEach(r => {
    let logStr = `${r.label} — ${r.marked ? (r.isCorrect ? "Correcta" : "Incorrecta") : "Sin marca 'requerida'"} — selección: ${r.selected ?? "(sin selección)"} — puntos: +${r.awardedNow}`;
    if(r.key === "order"){
      logStr += `\n  -> Oración actual: "${r.selected.join(' ')}"`;
    }
    logsArray.push(logStr); // Nueva: agregar a logsArray
    console.log(logStr);
  });
  const finalLog = `Puntaje final: ${score} — Usuario: ${getUserNameForLogs()}`;
  logsArray.push(finalLog); // Nueva: agregar a logsArray
  console.log(finalLog);
  console.groupEnd();

  updateScoreDisplay();
}

/* ------------------ Validaciones y submit ------------------ */
function allRequiredAnswered(){
  // radios con required
  const requiredRadioNames = Array.from(new Set(Array.from(document.querySelectorAll('input[type="radio"][required]')).map(i=>i.name)));
  for(const name of requiredRadioNames){
    if(!document.querySelector(`input[name="${CSS.escape(name)}"]:checked`)) return false;
  }
  // selects required
  const selects = examForm ? examForm.querySelectorAll('select[required]') : [];
  for(const sel of selects){
    if(!sel.value) return false;
  }
  // orden
  const ol = document.getElementById("order-list");
  if(ol){
    const words = Array.from(ol.querySelectorAll("li")).map(li=>li.dataset.word);
    if(words.length !== correctOrder.length) return false;
  }
  return true;
}

examForm && examForm.addEventListener("submit", (e)=>{
  // Cambio: Detener y ocultar el temporizador inmediatamente al oprimir el botón
  clearInterval(timerInterval);
  if (timerCircle) timerCircle.style.display = 'none';

  if(formWarning) formWarning.style.display = "none";
  if(submissionMessage) submissionMessage.style.display = "none";

  // Requerir nombre confirmado
  if(!getUserNameForLogs() || getUserNameForLogs() === "ANÓNIMO"){
    alert("Por favor confirma tu nombre antes de enviar el examen.");
    if(startModal) startModal.style.display = "flex";
    return;
  }

  if(!allRequiredAnswered()){
    e.preventDefault(); // Solo prevent si incompleto
    if(formWarning){
      formWarning.textContent = "Por favor completa todas las preguntas y actividades antes de enviar.";
      formWarning.style.display = "block";
    }
    // ... (código existente para resaltar bloques incompletos)
    return;
  }

  // Nueva: Actualizar hiddens para Formspree
  // Actualiza hidden de orden (drag&drop)
  const orderItems = document.querySelectorAll('#order-list li');
  const currentOrder = Array.from(orderItems).map(li => li.dataset.word).join(', ');
  if (document.getElementById('order-hidden')) document.getElementById('order-hidden').value = currentOrder;

  // Actualiza puntaje
  if (document.getElementById('score-hidden')) document.getElementById('score-hidden').value = score;

  // Actualiza nombre (ya lo haces en confirmUserButton, pero asegúrate)
  if(userNameHidden) userNameHidden.value = userName;

  // Compila logs en textarea hidden (como texto multilínea)
  const logsSummary = logsArray.join('\n');
  if (document.getElementById('logs-summary-hidden')) document.getElementById('logs-summary-hidden').value = logsSummary;

  // Evaluar todo y sumar
  evaluateAllNow();

  // Deshabilitar formulario para evitar cambios posteriores
  Array.from(examForm.elements).forEach(el => el.disabled = true);

  // Mostrar overlay de envío exitoso
  const submissionOverlay = document.getElementById('submission-overlay');
  if (submissionOverlay) submissionOverlay.style.display = 'flex';

  // Cambio: Seteamos la bandera solo si el envío es exitoso
  isSubmitted = true;

  console.log(`Examen enviado. Usuario: ${getUserNameForLogs()}. Puntaje final: ${score}`);

  // NO preventDefault aquí: permite envío a Formspree
});

/* Accesibilidad: resaltado al intentar enviar incompleto */
submitButton && submitButton.addEventListener("click", ()=>{
  examForm.querySelectorAll("[data-required]").forEach(block=> block.classList.remove("incomplete"));
  setTimeout(()=>{ if(!allRequiredAnswered()){
    examForm.querySelectorAll("[data-required]").forEach(block=>{
      const missingRadio = block.querySelector('input[type="radio"][required]:not(:checked)');
      const missingSelect = block.querySelector('select[required]:not([value])');
      if(missingRadio || missingSelect){ block.classList.add("incomplete"); }
    });
  }},0);
});

/* Estilo visual para incompletos (inyectado vía JS) */
const style = document.createElement("style");
style.textContent = `.block.incomplete{ outline:2px dashed #ffd166; box-shadow:0 0 0 4px #ffd16622 inset; }`;
document.head.appendChild(style);

/* Inicial (imprime resumen de carga) */
document.addEventListener("DOMContentLoaded", ()=>{
  // refrescar referencia a orderList por si cambió
  orderList = document.getElementById("order-list");
  // Mostrar modal de inicio si existe
  if(startModal) startModal.style.display = "flex";
  // Si el hidden ya tiene valor (por ejemplo recarga), sincronizar
  if(userNameHidden && userNameHidden.value){ userName = userNameHidden.value; }
  printInitialSummary();
});

// Confirmación de nombre (si existe el botón/input)
if(confirmUserButton){
  confirmUserButton.addEventListener("click", () => {
    const val = userNameInput ? userNameInput.value.trim() : (userNameHidden ? userNameHidden.value.trim() : "");
    userName = val || "";
    if (userName) {
      if(userNameHidden) userNameHidden.value = userName;
      if(startModal) startModal.style.display = "none";
      console.log(`${getUserNameForLogs()} — Nombre confirmado.`);
      // Reimprimir resumen ahora que hay usuario
      printInitialSummary();
    } else {
      alert("Por favor ingresa tu nombre.");
    }
  });
}

// Configuración del temporizador
let timeLeft = 120; // Cambio: 2 minutos en segundos (corregido de 600)
let timerInterval;
const timerCircle = document.getElementById('timerCircle');
const timeUpMessage = document.getElementById('timeUpMessage');
let isSubmitted = false; // Cambio: Bandera nueva para desactivar el mensaje

// Función para actualizar el temporizador
function updateTimer() {
  const minutes = Math.floor(timeLeft / 60);
  let seconds = timeLeft % 60;
  seconds = seconds < 10 ? '0' + seconds : seconds;
  timerCircle.textContent = `${minutes}:${seconds}`;

  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    timerCircle.style.display = 'none';
    // Cambio: Solo mostrar mensaje si NO se ha enviado el formulario
    if (!isSubmitted) {
      timeUpMessage.style.display = 'flex';
    }
  } else {
    timeLeft--;
  }
}

// Mostrar el círculo del temporizador en el centro inicialmente
function showTimer() {
  timerCircle.style.top = '50%';
  timerCircle.style.left = '50%';
  timerCircle.style.transform = 'translate(-50%, -50%)';
  timerCircle.style.display = 'flex';

  // Mover el círculo a una esquina después de 3 segundos
  setTimeout(() => {
    timerCircle.style.top = '20px';
    timerCircle.style.left = 'auto';
    timerCircle.style.right = '20px';
    timerCircle.style.transform = 'none';
  }, 2000);

  // Comenzar el temporizador
  timerInterval = setInterval(updateTimer, 1000);
}

// Observar cambios en la sección de preguntas para iniciar el temporizador
document.addEventListener('DOMContentLoaded', () => {
  const questionsSection = document.getElementById('questions-section');
  if (questionsSection) {
    // Observa cambios en los atributos de la sección de preguntas
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const attributeValue = mutation.target.getAttribute(mutation.attributeName);
          if (attributeValue.includes("active")) {
            showTimer();
            observer.disconnect(); // Desconectar el observador una vez que se haya llamado a showTimer
          }
        }
      });
    });

    observer.observe(questionsSection, {
      attributes: true,
      attributeFilter: ["class"]
    });
  }
});


