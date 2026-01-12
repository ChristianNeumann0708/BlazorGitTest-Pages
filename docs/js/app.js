import { Storage } from './storage.js';
import { Wort } from './wort.js';

let sessionSeconds = 0;
let timerInterval = null;
let sessionCorrect = 0;
let sessionWrong = 0;
let sessionTotal = 0;

let lastWord = null;
let lastIndex = -1;

let autoDeleteEnabled = false;
let autoDeleteThreshold = 10;


// ------------------------------
// Globale Variablen
// ------------------------------
let wortListe = [];
let currentWord = null;
let currentIndex = -1;

// ------------------------------
// DOM-Elemente
// ------------------------------
const listEl = document.getElementById('word-list');
const inputNeu = document.getElementById('input-new');
const inputFalsch = document.getElementById('input-falsch');
const display = document.getElementById('word-display');
const stats = document.getElementById('stats');
const variants = document.getElementById('wrong-variants');

// Buttons
const btnCorrect = document.getElementById('btn-correct');
const btnWrong = document.getElementById('btn-wrong');
const btnDelete = document.getElementById('btn-delete');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

// ------------------------------
// Event-Handler
// ------------------------------
btnCorrect.onclick = markCorrect;
btnWrong.onclick = markWrong;
btnDelete.onclick = deleteCurrent;
btnPrev.onclick = prevWord;
btnNext.onclick = nextWord;

inputNeu.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleAdd();
});

inputFalsch.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleFalsch();
});

// ------------------------------
// Wort hinzufügen
// ------------------------------
function handleAdd() {
  const text = inputNeu.value.trim();
  if (!text) return;

  let existing = wortListe.find(w => w.text.toLowerCase() === text.toLowerCase());

  if (existing) {
    selectWord(existing);
  } else {
    const neu = new Wort(text);
    wortListe.push(neu);
    save();
    selectWord(neu);
  }

  inputNeu.value = '';
  renderList();
}

// ------------------------------
// Falsch geschrieben
// ------------------------------
function handleFalsch() {
  if (!currentWord) return;

  const falsch = inputFalsch.value.trim();
  if (!falsch) return;

  currentWord.falschGeschrieben(falsch);

  // SESSION-STATISTIK 
  sessionWrong++; 
  updateSessionStats();

  inputFalsch.value = '';
  save();
  renderStats();
}

// ------------------------------
// Wort auswählen
// ------------------------------
function selectWord(wort) {
  currentWord = wort;
  currentIndex = wortListe.indexOf(wort);
  renderCurrent();
  renderList();
}

// ------------------------------
// Aktionen
// ------------------------------
function markCorrect() {
  if (!currentWord) return;
  currentWord.richtigGeschrieben();
  console.log("anzRichtig:", currentWord.anzRichtig);
  console.log("Threshold:", autoDeleteThreshold);
  console.log("Enabled:", autoDeleteEnabled);

  // ------------------------------
  // Automatisches Löschen
  // ------------------------------
if (autoDeleteEnabled && currentWord.anzRichtig >= autoDeleteThreshold) {
    console.log("Wort automatisch gelöscht:", currentWord.text);

    // Wort aus der Liste entfernen
    wortListe.splice(currentIndex, 1);
    save();

    // Sofort weiter zum nächsten Wort
    nextWord();
    renderList();
    return; // WICHTIG: Rest der Funktion nicht mehr ausführen
  }

  save();
  sessionCorrect++;
  //sessionTotal++;
  updateSessionStats();
  nextWord();
  renderList();
}

function markWrong() {
  if (!currentWord) return;
  currentWord.falschGeschrieben('');
  save();
  sessionWrong++; 
  //sessionTotal++;
  updateSessionStats();
  nextWord();
  renderList();
}

function deleteCurrent() {
  if (!currentWord) return;

  wortListe.splice(currentIndex, 1);

  if (wortListe.length > 0) {

    // SESSION: neues Wort → Gesamtzähler +1
    //sessionTotal++; 
    updateSessionStats();

    currentWord = getNextWord(wortListe);
    currentIndex = wortListe.indexOf(currentWord);
  } else {
    currentWord = null;
    currentIndex = -1;
  }

  save();
  renderList();
  renderCurrent();
}

// ------------------------------
// Navigation
// ------------------------------
function prevWord() {
  if (!lastWord) return; // kein Zurück möglich

  currentWord = lastWord;
  currentIndex = lastIndex;

  renderCurrent();
  renderList();

  // Zurück nur einmal möglich → danach deaktivieren
  lastWord = null;
  lastIndex = -1;
}

function nextWord() {
  if (wortListe.length === 0) return;

  // letztes Wort merken für Zurück
lastWord = currentWord;
lastIndex = currentIndex;

  // SESSION: neues Wort → Gesamtzähler +1
  sessionTotal++; 
  updateSessionStats();

  currentWord = getNextWord(wortListe);
  currentIndex = wortListe.indexOf(currentWord);
  renderCurrent();
  renderList();
}

// ------------------------------
// Rendering
// ------------------------------
function renderList() {
  listEl.innerHTML = '';

  wortListe
    .sort((a, b) => a.text.localeCompare(b.text))
    .forEach(w => {
      const li = document.createElement('li');
      li.textContent = w.text;
      li.className = 'wordlist-item' + (w === currentWord ? ' active' : '');
      li.onclick = () => selectWord(w);
      listEl.appendChild(li);
      // if (w === currentWord) {
      // li.scrollIntoView({ behavior: "smooth", block: "center" });
      // }
    });
}

function renderCurrent() {
  if (!currentWord) {
    display.innerHTML = '<span>Bitte ein Wort auswählen oder eingeben.</span>';
    stats.textContent = 'Richtig: 0 | Falsch: 0';
    variants.innerHTML = '';
    return;
  }

  display.textContent = currentWord.text;
  renderStats();
}

function renderStats() {
  stats.textContent = `Richtig: ${currentWord.anzRichtig} | Falsch: ${currentWord.anzFalsch}`;

  const dict = currentWord.falscheVarianten;

  if (Object.keys(dict).length > 0) {
    variants.innerHTML =
      '<h4>Falsch geschriebene Varianten</h4><ul>' +
      Object.entries(dict)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `<li>${k} — ${v}</li>`)
        .join('') +
      '</ul>';
  } else {
    variants.innerHTML = '';
  }
}

  function updateSessionStats() {
  document.getElementById("session-correct").textContent = `Richtig: ${sessionCorrect}`;
  document.getElementById("session-wrong").textContent = `Falsch: ${sessionWrong}`;
  document.getElementById("session-total").textContent = `Gesamt: ${sessionTotal}`;
}


// ------------------------------
// Speicher
// ------------------------------
function save() {
  Storage.save(wortListe);
}

function load() {
  const raw = Storage.load();
  wortListe = raw.map(obj => Wort.fromJSON(obj));

  if (wortListe.length > 0) {
    currentWord = getNextWord(wortListe);
    currentIndex = wortListe.indexOf(currentWord);
  }

  renderList();
  renderCurrent();
}

// ------------------------------
// Gewichtete Auswahl (wie Blazor)
// ------------------------------
function getNextWord(list) {
  if (list.length === 0) return null;

  const zufallsQuote = 0.5;

  if (Math.random() < zufallsQuote) {
    const index = Math.floor(Math.random() * list.length);
    return list[index];
  }

  return getWeightedWord(list);
}

function getWeightedWord(list) {
  const weighted = list.flatMap(w => {
    const weight = Math.max(1, 1 + w.anzFalsch - Math.floor(w.anzRichtig / 2));
    return Array(weight).fill(w);
  });

  const index = Math.floor(Math.random() * weighted.length);
  return weighted[index];
}

// ------------------------------
// Start
// ------------------------------
load();
loadAutoDeleteSettings(); 
startTimer();

function startTimer() {
  timerInterval = setInterval(() => {
    sessionSeconds++;

    const minutes = Math.floor(sessionSeconds / 60);
    const seconds = sessionSeconds % 60;

    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");

    document.getElementById("session-timer").textContent = `Zeit: ${mm}:${ss}`;
  }, 1000);
}

function loadAutoDeleteSettings() {
  const saved = localStorage.getItem("settings");
  if (!saved) return;

  try {
    const settings = JSON.parse(saved);
    autoDeleteEnabled = !!settings.autoDeleteEnabled;
    autoDeleteThreshold = parseInt(settings.autoDeleteThreshold) || 10;
    console.log("AutoDelete Settings geladen:", {
      autoDeleteEnabled,
      autoDeleteThreshold
    });
  } catch (err) {
    console.warn("Konnte AutoDelete Settings nicht lesen:", err);
  }
}


