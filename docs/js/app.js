import { Storage } from './storage.js';
import { Wort } from './wort.js';

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
}

// ------------------------------
// Aktionen
// ------------------------------
function markCorrect() {
  if (!currentWord) return;
  currentWord.richtigGeschrieben();
  save();
  nextWord();
}

function markWrong() {
  if (!currentWord) return;
  currentWord.falschGeschrieben('');
  save();
  nextWord();
}

function deleteCurrent() {
  if (!currentWord) return;

  wortListe.splice(currentIndex, 1);

  if (wortListe.length > 0) {
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
  if (wortListe.length === 0) return;

  currentIndex = (currentIndex - 1 + wortListe.length) % wortListe.length;
  currentWord = wortListe[currentIndex];
  renderCurrent();
}

function nextWord() {
  if (wortListe.length === 0) return;

  currentWord = getNextWord(wortListe);
  currentIndex = wortListe.indexOf(currentWord);
  renderCurrent();
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
