/* ---------- Datos principales (tomados del código original) ---------- */
const WORDS = [
  "ONE","TWO","THREE","FOUR","FIVE","TEN",
  "ELEVEN","TWELVE","TWENTY","THIRTY","FORTY","FIFTY","SIXTY","SEVENTY","ONEHUNDRED"
];
const TRANSLATIONS_NUMBERS = {
  "ONE": "UNO",
  "TWO": "DOS",
  "THREE": "TRES",
  "FOUR": "CUATRO",
  "FIVE": "CINCO",
  "TEN": "DIEZ",
  "ELEVEN": "ONCE",
  "TWELVE": "DOCE",
  "TWENTY": "VEINTE",
  "THIRTY": "TREINTA",
  "FORTY": "CUARENTA",
  "FIFTY": "CINCUENTA",
  "SIXTY": "SESENTA",
  "SEVENTY": "SETENTA",
  "ONEHUNDRED": "CIEN"
};

const GRID_SIZE = 14;

/* --------------- Elementos del DOM (ambas páginas) ---------------- */
const gridEl = document.getElementById('grid');
const wordListEl = document.getElementById('wordList');
const scoreEl = document.getElementById('score');
const totalEl = document.getElementById('total');
const messageEl = document.getElementById('message');
const hintBtn = document.getElementById('hint');
const continueBtn = document.getElementById('continue');
const mainGameSection = document.getElementById('mainGame');
const translateSection = document.getElementById('translateGame');
const translationBoard = document.getElementById('translationBoard');
const checkTranslationsBtn = document.getElementById('checkTranslations');
const resetTranslationsBtn = document.getElementById('resetTranslations');
const backBtn = document.getElementById('back');
const transScoreEl = document.getElementById('transScore');
const transTotalEl = document.getElementById('transTotal');
const transMessageEl = document.getElementById('transMessage');

/* ------------------ Estado juego sopa ------------------ */
let grid = [];
let placements = [];
let selectedCells = [];
let foundWords = new Set();
let score = 0;
// pointer control
let pointerActive = false;
let activePointerId = null;
let checking = false;
let startCell = null;

/* ------------------ Lista y traducciones para la PÁGINA 2 (traducciones) ------------------ */
const TRANSLATION_WORDS = [
  "WINDOW",
  "DOOR",
  "BLACKBOARD",
  "CHAIR",
  "CUPBOARD",
  "SHELF",
  "PEN",
  "PENCIL",
  "RULER",
  "RUBBER",
  "BOOK",
  "SCHOOL BAG",
  "PENCIL CASE"
];
const TRANSLATIONS = {
  "WINDOW": "VENTANA",
  "DOOR": "PUERTA",
  "BLACKBOARD": "PIZARRA",
  "CHAIR": "SILLA",
  "CUPBOARD": "ARMARIO",
  "SHELF": "ESTANTE",
  "PEN": "BOLIGRAFO|PLUMA",
  "PENCIL": "LAPIZ",
  "RULER": "REGLA",
  "RUBBER": "BORRADOR|GOMA",
  "BOOK": "LIBRO",
  "SCHOOL BAG": "MOCHILA",
  "PENCIL CASE": "ESTUCHE"
};

/* ------------------ Página/estado para Matemáticas (nueva) ------------------ */
let mathSection = null; // elemento DOM creado dinámicamente
let mathOps = []; // array de {a, b, op, result, idx}
const MATH_OPERATIONS_COUNT = 6; // tal como pediste

/* ------------------ Animals (nuevo juego) ------------------ */
/* Lista tal como pediste (he corregido 'birtd' -> 'bird') */
const ANIMALS_EN = [
  "bird","cat","cow","dog","duck","elephant","fish","frog","giraffe",
  "horse","lion","monkey","pig","rabbit","sheep","snake","tiger","turtle","whale","zebra"
];
/* Traducciones al español (targets) */
const ANIMALS_ES = {
  "bird":"pájaro 🐦️",
  "cat":"gato🐱",
  "cow":"vaca 🐄",
  "dog":"perro 🐶",
  "duck":"pato",
  "elephant":"elefante🐘",
  "fish":"pez🐟",
  "frog":"rana",
  "giraffe":"jirafa",
  "horse":"caballo",
  "lion":"león",
  "monkey":"mono🙊",
  "pig":"cerdo🐷",
  "rabbit":"conejo🐇",
  "sheep":"oveja🐑",
  "snake":"serpiente🐍",
  "tiger":"tigre🐯",
  "turtle":"tortuga🐢",
  "whale":"ballena🐋",
  "zebra":"cebra"
};

let animalsScore = 0;
let animalsPlaced = {}; // mapa targetId -> englishName

/* ---------- Inicialización y listeners ---------- */
hintBtn.addEventListener('click', giveHint);
continueBtn.addEventListener('click', () => showTranslateGame());
checkTranslationsBtn.addEventListener('click', checkAllTranslations);
resetTranslationsBtn.addEventListener('click', buildTranslateGame);
backBtn.addEventListener('click', () => {
  translateSection.classList.add('hidden');
  mainGameSection.classList.remove('hidden');
  transMessageEl.textContent = '';
});
initGame();
ensureMathButton(); // crea el botón y la sección de matemáticas dinámicamente
ensureAnimalsButton(); // crea botón y sección de animals

/* ================== Sopa de letras (página 1) ================== */
function initGame(){
  score = 0;
  foundWords.clear();
  selectedCells = [];
  placements = [];
  messageEl.textContent = '';
  totalEl.textContent = WORDS.length;
  scoreEl.textContent = score;
  grid = Array.from({length: GRID_SIZE}, () => Array.from({length: GRID_SIZE}, () => ''));
  placeWords();
  placements.forEach((placement, index) => {
    const hue = (index * 137) % 360;
    placement.hue = hue;
    placement.color = `hsl(${hue}, 70%, 85%)`;
    placement.lightColor = `hsl(${hue}, 70%, 95%)`;
    placement.borderColor = `hsl(${hue}, 70%, 75%)`;
    placement.textColor = `hsl(${hue}, 70%, 25%)`;
  });
  fillEmpty();
  renderGrid();
  renderWordListTwoColumns();
}

/* Colocación de palabras (modificado para permitir cruces si letras coinciden) */
function placeWords(){
  const words = shuffleArray(WORDS.slice());
  for (let w of words){
    let placed = false;
    for (let i=0; i<2000 && !placed; i++) { // Aumentado a 2000 intentos para evitar problemas de colocación
      placed = tryPlaceWord(w);
    }
    if(!placed) console.warn("No se pudo colocar:", w);
  }
}
function tryPlaceWord(word){
  const directions = [
    [0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]
  ];
  const dir = directions[Math.floor(Math.random()*directions.length)];
  const r = Math.floor(Math.random()*GRID_SIZE);
  const c = Math.floor(Math.random()*GRID_SIZE);
  if (canPlace(word, r, c, dir[0], dir[1])){
    place(word, r, c, dir[0], dir[1]);
    return true;
  }
  return false;
}
function canPlace(word, r, c, dr, dc){
  const L = word.length;
  const endR = r + dr*(L-1);
  const endC = c + dc*(L-1);
  if (endR < 0 || endR >= GRID_SIZE || endC < 0 || endC >= GRID_SIZE) return false;
  for (let i=0;i<L;i++){
    const rr = r + dr*i;
    const cc = c + dc*i;
    const existing = grid[rr][cc];
    if (existing && existing !== word[i]) return false; // Permitir si coincide la letra existente
  }
  return true;
}
function place(word, r, c, dr, dc){
  const coords = [];
  for (let i=0;i<word.length;i++){
    const rr = r + dr*i;
    const cc = c + dc*i;
    grid[rr][cc] = word[i];
    coords.push({r:rr,c:cc});
  }
  placements.push({word, coords});
}
function fillEmpty(){
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r=0;r<GRID_SIZE;r++){
    for (let c=0;c<GRID_SIZE;c++){
      if (!grid[r][c]) grid[r][c] = alphabet[Math.floor(Math.random()*alphabet.length)];
    }
  }
}
function renderGrid(){
  gridEl.innerHTML = '';
  gridEl.style.gridTemplateColumns = `repeat(${GRID_SIZE}, var(--cell-size))`;
  for (let r=0;r<GRID_SIZE;r++){
    for (let c=0;c<GRID_SIZE;c++){
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.r = r;
      cell.dataset.c = c;
      cell.textContent = grid[r][c];
      gridEl.appendChild(cell);
    }
  }
  attachPointerHandlers();
}
function renderWordListTwoColumns(){
  wordListEl.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'columns';
  const half = Math.ceil(WORDS.length/2);
  const left = document.createElement('ul');
  const right = document.createElement('ul');
  for (let i=0;i<half;i++){
    const w = WORDS[i];
    const li = createWordItem(w);
    left.appendChild(li);
  }
  for (let i=half;i<WORDS.length;i++){
    const w = WORDS[i];
    const li = createWordItem(w);
    right.appendChild(li);
  }
  wrapper.appendChild(left);
  wrapper.appendChild(right);
  wordListEl.appendChild(wrapper);
}
function createWordItem(w){
  const li = document.createElement('li');
  li.id = `word-${w}`;
  li.textContent = TRANSLATIONS_NUMBERS[w] || w; // Mostrar traducción en español
  return li;
}

/* Función auxiliar para GCD */
function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  return b === 0 ? a : gcd(b, a % b);
}

/* Pointer handlers */
function attachPointerHandlers(){
  gridEl.addEventListener('pointerdown', (e) => {
    if (pointerActive) return;
    pointerActive = true;
    activePointerId = e.pointerId;
    if (e.target.setPointerCapture) {
      try { e.target.setPointerCapture(activePointerId); } catch(e){/*ignore*/ }
    }
    if (e.target.classList && e.target.classList.contains('cell')){
      clearSelection();
      const r = parseInt(e.target.dataset.r);
      const c = parseInt(e.target.dataset.c);
      const key = `${r}-${c}`;
      const el = e.target;
      selectedCells.push({key, el, r, c});
      el.classList.add('selected');
      startCell = {r, c, key, el};
    }
  });
  gridEl.addEventListener('pointermove', (e) => {
    if (!pointerActive || e.pointerId !== activePointerId) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el.classList && el.classList.contains('cell')) addToSelection(el);
  });
  window.addEventListener('pointerup', (e) => {
    if (!pointerActive || e.pointerId !== activePointerId) return;
    pointerActive = false;
    activePointerId = null;
    if (!checking) {
      checking = true;
      setTimeout(() => {
        checkSelection();
        checking = false;
      }, 10);
    }
  });
}
function addToSelection(el){
  if (!startCell) return;
  if (el.classList.contains('found')) return;
  const r = parseInt(el.dataset.r);
  const c = parseInt(el.dataset.c);
  const key = `${r}-${c}`;
  if (key === startCell.key) return;

  // Limpiar selección actual excepto la celda inicial
  selectedCells.forEach((s, idx) => {
    if (idx > 0) s.el.classList.remove('selected');
  });
  selectedCells = [selectedCells[0]];

  // Calcular dirección y pasos
  let dr = r - startCell.r;
  let dc = c - startCell.c;
  let ad_r = Math.abs(dr);
  let ad_c = Math.abs(dc);
  let g = gcd(ad_r, ad_c);
  if (g === 0) return;

  let step_dr = dr / g;
  let step_dc = dc / g;
  if (Math.abs(step_dr) > 1 || Math.abs(step_dc) > 1) return; // No es una dirección válida (horizontal, vertical, diagonal)

  // Añadir todas las celdas intermedias y la final
  for (let i = 1; i <= g; i++) {
    const rr = startCell.r + i * step_dr;
    const cc = startCell.c + i * step_dc;
    const sel_key = `${rr}-${cc}`;
    const sel_el = gridEl.querySelector(`.cell[data-r="${rr}"][data-c="${cc}"]`);
    if (!sel_el || sel_el.classList.contains('found')) continue;
    selectedCells.push({key: sel_key, el: sel_el, r: rr, c: cc});
    sel_el.classList.add('selected');
  }
}
function clearSelection(){
  selectedCells.forEach(s => s.el.classList.remove('selected'));
  selectedCells = [];
  startCell = null;
}
function checkSelection(){
  if (selectedCells.length === 0) return;
  const word = selectedCells.map(s => s.el.textContent).join('');
  const rev = [...selectedCells].reverse().map(s => s.el.textContent).join('');
  const normalized = word.toUpperCase();
  const normalizedRev = rev.toUpperCase();
  const selKeys = new Set(selectedCells.map(s => `${s.r}-${s.c}`));
  const found = placements.find(p => {
    if (foundWords.has(p.word)) return false;
    if (p.word !== normalized && p.word !== normalizedRev) return false;
    const pKeys = new Set(p.coords.map(coord => `${coord.r}-${coord.c}`));
    return setsEqual(pKeys, selKeys);
  });
  if (found){
    if (!foundWords.has(found.word)){
      selectedCells.forEach(s => {
        s.el.classList.remove('selected');
        s.el.classList.add('found');
        s.el.style.setProperty('background-color', found.color, 'important');
        s.el.style.setProperty('border-color', found.borderColor, 'important');
        s.el.style.setProperty('color', found.textColor, 'important');
      });
      markFound(found.word);
      messageEl.textContent = `¡Has encontrado: ${TRANSLATIONS_NUMBERS[found.word] || found.word}!`; // Mensaje con traducción
      score++;
      scoreEl.textContent = score;
      const li = document.getElementById(`word-${found.word}`);
      if (li) {
        li.classList.add('found');
        li.style.setProperty('background', `linear-gradient(${found.color}, ${found.lightColor})`, 'important');
      }
      if (score === WORDS.length){
        messageEl.textContent = `¡Felicidades! Encontraste todas las palabras. Puntuación: ${score}/${WORDS.length}`;
      }
    }
  } else {
    selectedCells.forEach(s => s.el.classList.remove('selected'));
    messageEl.textContent = '';
  }
  selectedCells = [];
  startCell = null;
}
function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (let item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}
function markFound(word){
  foundWords.add(word);
}
function giveHint(){
  const notFound = placements.filter(p => !foundWords.has(p.word));
  if (notFound.length === 0){
    messageEl.textContent = 'No quedan pistas: ya encontraste todo.';
    return;
  }
  const pick = notFound[Math.floor(Math.random()*notFound.length)];
  const coord = pick.coords[Math.floor(Math.random()*pick.coords.length)];
  const selector = `.cell[data-r="${coord.r}"][data-c="${coord.c}"]`;
  const cell = document.querySelector(selector);
  if (cell){
    if (!cell.classList.contains('found')){ 
      cell.classList.add('selected');
      setTimeout(()=>cell.classList.remove('selected'), 900);
    }
  }
  messageEl.textContent = `Pista: busca la palabra que significa "${TRANSLATIONS_NUMBERS[pick.word]}" (longitud ${pick.word.length})`;
}
function shuffleArray(a){
  for (let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

/* ================== Traducciones (página 2) ================== */
function showTranslateGame(){
  mainGameSection.classList.add('hidden');
  translateSection.classList.remove('hidden');
  buildTranslateGame();
}
function buildTranslateGame(){
  translationBoard.innerHTML = '';
  transMessageEl.textContent = '';
  const words = TRANSLATION_WORDS.slice();
  transTotalEl.textContent = words.length;
  transScoreEl.textContent = 0;
  words.forEach((w, idx) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'translation-row';
    const chip = document.createElement('div');
    chip.className = 'word-chip';
    chip.textContent = w;
    chip.dataset.word = w;
    const inputContainer = document.createElement('div');
    inputContainer.className = 'translation-input';
    inputContainer.style.flex = '1';
    inputContainer.style.justifyContent = 'flex-end';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'traducción...';
    input.dataset.word = w;
    input.id = `trans-input-${idx}`;
    input.setAttribute('aria-label', `Traducción de ${w}`);
    input.style.minWidth = '180px';
    const hintSpan = document.createElement('span');
    hintSpan.className = 'result';
    hintSpan.textContent = '';
    inputContainer.appendChild(input);
    inputContainer.appendChild(hintSpan);
    rowEl.appendChild(chip);
    rowEl.appendChild(inputContainer);
    translationBoard.appendChild(rowEl);
  });
}
function normalizeForCompare(str){
  if (!str && str !== '') return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
}
function checkAllTranslations(){
  const inputs = translationBoard.querySelectorAll('input[type="text"]');
  let correct = 0;
  inputs.forEach(input => {
    const wordKey = input.dataset.word;
    const userRaw = input.value || '';
    const user = normalizeForCompare(userRaw);
    const acceptedRaw = TRANSLATIONS[wordKey] || '';
    const acceptedList = acceptedRaw.split('|').map(s => normalizeForCompare(s));
    const hintSpan = input.nextElementSibling;
    const wrapper = input.parentElement;
    if (user && acceptedList.includes(user)){
      correct++;
      wrapper.classList.remove('incorrect');
      wrapper.classList.add('correct');
      if (hintSpan) hintSpan.textContent = '✓';
    } else {
      wrapper.classList.remove('correct');
      wrapper.classList.add('incorrect');
      if (hintSpan) hintSpan.textContent = `✗ (${acceptedList[0] || '—'})`;
    }
  });
  transScoreEl.textContent = correct;
  transMessageEl.textContent = `Has obtenido ${correct} / ${inputs.length} puntos.`;
}

/* ================== Matemáticas (página 3, nueva) ================== */
function ensureMathButton(){
  // 1) agregar botón al control de la página principal si no existe
  const controls = mainGameSection.querySelector('.controls');
  if (controls && !document.getElementById('mathBtn')) {
    const mathBtn = document.createElement('button');
    mathBtn.id = 'mathBtn';
    mathBtn.textContent = 'Math →';
    mathBtn.style.background = 'var(--accent-2)';
    mathBtn.addEventListener('click', () => showMathGame());
    controls.appendChild(mathBtn);
  }
  // 2) crear sección mathSection dinámicamente y añadir al <main> si no existe
  if (!mathSection) {
    mathSection = document.createElement('section');
    mathSection.id = 'mathGame';
    mathSection.className = 'hidden';
    mathSection.innerHTML = `
      <section class="controls">
        <div class="score">Puntos: <span id="mathScore">0</span> / <span id="mathTotal">0</span></div>
        <button id="mathCheck">Comprobar</button>
        <button id="mathReset">Reiniciar</button>
        <button id="mathBack">← Volver</button>
        <div id="mathMessage" class="message"></div>
      </section>
      <section id="mathBoard" class="translation-board"></section>
      <section class="instructions">
        <h3>Instrucciones - Math</h3>
        <p>Resuelve las 6 operaciones (suma o resta). <strong>Escribe la respuesta únicamente en palabras en inglés</strong> (ej.: <em>twelve</em>, <em>zero</em>, <em>twenty-one</em>). No se permiten dígitos.</p>
      </section>
    `;
    // anexar al <main> (debemos encontrar el <main> en el DOM)
    const main = document.querySelector('main');
    main.appendChild(mathSection);
    // listeners de los botones de la sección creada
    document.getElementById('mathCheck').addEventListener('click', checkMathAnswers);
    document.getElementById('mathReset').addEventListener('click', buildMathGame);
    document.getElementById('mathBack').addEventListener('click', () => {
      mathSection.classList.add('hidden');
      mainGameSection.classList.remove('hidden');
      const mathMsg = document.getElementById('mathMessage');
      if (mathMsg) mathMsg.textContent = '';
    });
  }
}

function showMathGame(){
  mainGameSection.classList.add('hidden');
  translateSection.classList.add('hidden');
  mathSection.classList.remove('hidden');
  buildMathGame();
}

function buildMathGame(){
  mathOps = [];
  const board = document.getElementById('mathBoard');
  const scoreEl = document.getElementById('mathScore');
  const totalEl = document.getElementById('mathTotal');
  const msgEl = document.getElementById('mathMessage');
  if (!board || !scoreEl || !totalEl) return;
  board.innerHTML = '';
  msgEl.textContent = '';
  scoreEl.textContent = 0;
  totalEl.textContent = MATH_OPERATIONS_COUNT;
  for (let i = 0; i < MATH_OPERATIONS_COUNT; i++){
    // generar operación
    const opType = Math.random() < 0.5 ? '+' : '-';
    let a = randInt(0, 50);
    let b = randInt(0, 50);
    if (opType === '-' && a < b) [a, b] = [b, a]; // asegurar a >= b
    const result = opType === '+' ? a + b : a - b;
    mathOps.push({a, b, op: opType, result, idx: i});
    const row = document.createElement('div');
    row.className = 'translation-row';
    const expr = document.createElement('div');
    expr.className = 'word-chip';
    expr.textContent = `${a} ${opType} ${b} =`;
    const inputContainer = document.createElement('div');
    inputContainer.className = 'translation-input';
    inputContainer.style.flex = '1';
    inputContainer.style.justifyContent = 'flex-end';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'answer in words (english)...';
    input.dataset.idx = i;
    input.setAttribute('aria-label', `Answer for ${a} ${opType} ${b}`);
    input.style.minWidth = '220px';
    const hint = document.createElement('span');
    hint.className = 'result';
    hint.textContent = '';
    inputContainer.appendChild(input);
    inputContainer.appendChild(hint);
    row.appendChild(expr);
    row.appendChild(inputContainer);
    board.appendChild(row);
  }
}
function checkMathAnswers(){
  const inputs = document.querySelectorAll('#mathBoard input[type="text"]');
  let correct = 0;
  const msgEl = document.getElementById('mathMessage');
  inputs.forEach(input => {
    const idx = parseInt(input.dataset.idx, 10);
    const op = mathOps[idx];
    const userRaw = (input.value || '').trim();
    const hintSpan = input.nextElementSibling;
    const wrapper = input.parentElement;
    if (/[0-9]/.test(userRaw)) {
      wrapper.classList.remove('correct');
      wrapper.classList.add('incorrect');
      if (hintSpan) hintSpan.textContent = `✗ (No digits allowed)`;
      return;
    }
    if (/[^A-Za-z\s\-áéíóúÁÉÍÓÚñÑ]/.test(userRaw)) {
      wrapper.classList.remove('correct');
      wrapper.classList.add('incorrect');
      if (hintSpan) hintSpan.textContent = `✗ (Use English letters only)`;
      return;
    }
    const userNorm = normalizeEnglishAnswer(userRaw);
    const expectedWords = numberToEnglishWords(op.result);
    const expectedNorm = normalizeEnglishAnswer(expectedWords);
    if (userNorm === expectedNorm) {
      correct++;
      wrapper.classList.remove('incorrect');
      wrapper.classList.add('correct');
      if (hintSpan) hintSpan.textContent = '✓';
    } else {
      wrapper.classList.remove('correct');
      wrapper.classList.add('incorrect');
      if (hintSpan) hintSpan.textContent = `✗ (${expectedWords})`;
    }
  });
  const scoreEl = document.getElementById('mathScore');
  if (scoreEl) scoreEl.textContent = correct;
  msgEl.textContent = `Has obtenido ${correct} / ${MATH_OPERATIONS_COUNT} puntos.`;
}

/* ---------------- Helper: números -> palabras (inglés) ---------------- */
function numberToEnglishWords(n){
  if (typeof n !== 'number' || isNaN(n)) return '';
  if (n < 0) return 'minus ' + numberToEnglishWords(Math.abs(n));
  const below20 = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const tens = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  if (n < 20) return below20[n];
  if (n < 100){
    const t = Math.floor(n / 10);
    const r = n % 10;
    return r === 0 ? tens[t] : `${tens[t]} ${below20[r]}`;
  }
  return String(n);
}
function normalizeEnglishAnswer(s){
  if (!s && s !== '') return '';
  let t = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  t = t.toLowerCase();
  t = t.replace(/-/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}
function randInt(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ------------------ util debug ------------------ */
function showPlacements(){
  console.log('placements', placements);
}

/* ================== Animals game: botón + UI dinámico ================== */
function ensureAnimalsButton(){
  const controls = mainGameSection.querySelector('.controls');
  if (controls && !document.getElementById('animalsBtn')) {
    const animalsBtn = document.createElement('button');
    animalsBtn.id = 'animalsBtn';
    animalsBtn.textContent = 'Animals →';
    animalsBtn.style.background = 'var(--accent-2)';
    animalsBtn.addEventListener('click', () => showAnimalsGame());
    controls.appendChild(animalsBtn);
  }

  // listeners para la sección animals (está en el HTML)
  const animalsBack = document.getElementById('animalsBack');
  if (animalsBack) {
    animalsBack.addEventListener('click', () => {
      document.getElementById('animalsGame').classList.add('hidden');
      mainGameSection.classList.remove('hidden');
      const msg = document.getElementById('animalsMessage');
      if (msg) msg.textContent = '';
    });
  }

  // botón 'Comprobar' y 'Reiniciar' se asocian al mostrar el juego (cuando el DOM esté listo)
}

/* Muestra la sección animals y construye el tablero */
function showAnimalsGame(){
  mainGameSection.classList.add('hidden');
  translateSection.classList.add('hidden');
  if (mathSection) mathSection.classList.add('hidden');
  document.getElementById('animalsGame').classList.remove('hidden');
  buildAnimalsGame();
}

function buildAnimalsGame(){
  const row = document.getElementById('animalsRow');
  const targets = document.getElementById('animalsTargets');
  const scoreDisplay = document.getElementById('animalsScore');
  const totalDisplay = document.getElementById('animalsTotal');
  const msg = document.getElementById('animalsMessage');

  if (!row || !targets || !scoreDisplay) return;

  // reset
  row.innerHTML = '';
  targets.innerHTML = '';
  animalsScore = 0;
  animalsPlaced = {};
  scoreDisplay.textContent = '0';
  totalDisplay.textContent = ANIMALS_EN.length;
  if (msg) msg.textContent = '';

  // generar chips (draggables) - mezclados
  const shuffledEn = shuffleArray(ANIMALS_EN.slice());
  shuffledEn.forEach(name => {
    const chip = document.createElement('div');
    chip.className = 'animal-chip';
    chip.draggable = true;
    chip.id = `chip-${name}`;
    chip.textContent = name;
    chip.dataset.animal = name;
    chip.addEventListener('dragstart', animalDragStart);
    chip.addEventListener('dragend', animalDragEnd);
    row.appendChild(chip);
  });

  // generar targets (español) - mezclar las traducciones para crear el desafio
  const pairs = ANIMALS_EN.map(en => ({en, es: ANIMALS_ES[en]}));
  const shuffledPairs = shuffleArray(pairs.slice());

  shuffledPairs.forEach((p, idx) => {
    const target = document.createElement('div');
    target.className = 'target';
    target.id = `target-${idx}`;
    target.dataset.accept = p.en; // la respuesta correcta en inglés
    // mostrar etiqueta (span) con la traducción en español y una ranura donde dejar la ficha
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = p.es;
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.textContent = ''; // quedará el nombre arrastrado
    target.appendChild(label);
    target.appendChild(slot);

    // listeners DnD
    target.addEventListener('dragenter', (e) => {
      e.preventDefault();
      target.classList.add('dragover');
    });
    target.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    target.addEventListener('dragleave', (e) => {
      target.classList.remove('dragover');
    });
    target.addEventListener('drop', (e) => {
      e.preventDefault();
      target.classList.remove('dragover');
      const dragged = e.dataTransfer.getData('text/plain');
      handleAnimalDrop(dragged, target.id);
    });

    targets.appendChild(target);
  });

  // asociar botones de la sección
  const checkBtn = document.getElementById('animalsCheck');
  const resetBtn = document.getElementById('animalsReset');
  const backBtnLocal = document.getElementById('animalsBack');
  if (checkBtn) {
    checkBtn.onclick = () => scoreAnimals(true);
  }
  if (resetBtn) {
    resetBtn.onclick = buildAnimalsGame;
  }
  if (backBtnLocal) {
    backBtnLocal.onclick = () => {
      document.getElementById('animalsGame').classList.add('hidden');
      mainGameSection.classList.remove('hidden');
    };
  }
}

/* Drag handlers para chips */
function animalDragStart(e){
  const name = e.target.dataset.animal;
  e.dataTransfer.setData('text/plain', name);
  // opcional: marcador visual
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(()=> e.target.classList.add('dragging'), 10);
}
function animalDragEnd(e){
  e.target.classList.remove('dragging');
}

/* Manejar drop en un target */
function handleAnimalDrop(draggedName, targetId){
  const target = document.getElementById(targetId);
  if (!target) return;
  const slot = target.querySelector('.slot');
  if (!slot) return;

  // Si ya hay una ficha en la casilla, devolver esa ficha al area de fichas
  if (slot.dataset.animal) {
    // devolver el chip anterior
    const prev = slot.dataset.animal;
    const prevChip = document.getElementById(`chip-${prev}`);
    if (prevChip) prevChip.style.display = ''; // mostrar de nuevo
    slot.textContent = '';
    delete slot.dataset.animal;
  }

  // colocar la nueva ficha
  const chip = document.getElementById(`chip-${draggedName}`);
  if (chip) {
    // esconder chip del área para simular que está colocada
    chip.style.display = 'none';
  }
  slot.textContent = draggedName;
  slot.dataset.animal = draggedName;
  animalsPlaced[targetId] = draggedName;

  // auto-evaluar y marcar correcto/incorrecto (feedback inmediato)
  const expected = target.dataset.accept;
  if (draggedName === expected) {
    target.classList.remove('incorrect');
    target.classList.add('correct');
  } else {
    target.classList.remove('correct');
    target.classList.add('incorrect');
  }

  // actualizar puntuación visible (número de emparejamientos correctos)
  scoreAnimals(false);
}

/* Calcula y muestra puntuación; si forceShow:true muestra mensaje y bloquea cambios */
function scoreAnimals(forceShow){
  const targets = document.querySelectorAll('#animalsTargets .target');
  let correct = 0;
  let filled = 0;
  targets.forEach(t => {
    const slot = t.querySelector('.slot');
    if (slot && slot.dataset.animal) {
      filled++;
      if (slot.dataset.animal === t.dataset.accept) correct++;
    }
  });
  const scoreDisplay = document.getElementById('animalsScore');
  const totalDisplay = document.getElementById('animalsTotal');
  if (scoreDisplay) scoreDisplay.textContent = correct;
  if (totalDisplay && !totalDisplay.textContent) totalDisplay.textContent = ANIMALS_EN.length;

  const msg = document.getElementById('animalsMessage');
  if (forceShow) {
    if (msg) {
      msg.textContent = `Has obtenido ${correct} / ${ANIMALS_EN.length} puntos. (${filled} casillas llenas)`;
    }
    // si quieres bloquear cambios tras comprobar, podríamos deshabilitar arrastre aquí (no lo hacemos para permitir reintentos)
  }
  return correct;
}

/* ---------------- Utility ---------------- */
function randInt(min, max){
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ----------------- EOF ----------------- */


