import { Wort } from './wort.js';

let wortListe = [];
let currentWord = null;
let currentIndex = -1;

const listEl = document.getElementById('word-list');
const inputNeu = document.getElementById('input-new');
const inputFalsch = document.getElementById('input-falsch');
const display = document.getElementById('word-display');
const controls = document.getElementById('trainer-controls');
const stats = document.getElementById('stats');
const variants = document.getElementById('wrong-variants');

document.getElementById('btn-correct').onclick = markCorrect;
document.getElementById('btn-wrong').onclick = markWrong;
document.getElementById('btn-delete').onclick = deleteCurrent;
document.getElementById('btn-prev').onclick = prevWord;
document.getElementById('btn-next').onclick = nextWord;

inputNeu.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleAdd();
});
inputFalsch.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleFalsch();
});

function handleAdd() {
  const text = inputNeu.value.trim();
  if (!text) return;

  let existing = wortListe.find(w => w.text.toLowerCase() === text.toLowerCase());
  if (existing) {
    selectWord(existing);
  } else {
    const neu = new Wort(text);
    wortListe.push(neu);
    selectWord(neu);
    save();
  }

  inputNeu.value = '';
  renderList();
}

function handleFalsch() {
  if (!currentWord) return;
  const falsch = inputFalsch.value.trim();
  if (!falsch) return;

  currentWord.falschGeschrieben(falsch);
  inputFalsch.value = '';
  save();
  renderStats();
}

function selectWord(wort) {
  currentWord = wort;
  currentIndex = wortListe.indexOf(wort);
  renderCurrent();
}

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
    currentWord = wortListe[0];
    currentIndex = 0;
  } else {
    currentWord = null;
    currentIndex = -1;
  }
  save();
  renderList();
  renderCurrent();
}

function prevWord() {
  if (wortListe.length === 0) return;
  currentIndex = (currentIndex - 1 + wortListe.length) % wortListe.length;
  currentWord = wortListe[currentIndex];
  renderCurrent();
}

function nextWord() {
  if (wortListe.length === 0) return;
  currentIndex = (currentIndex + 1) % wortListe.length;
  currentWord = wortListe[currentIndex];
  renderCurrent();
}

function renderList() {
  listEl.innerHTML = '';
  wortListe.sort((a, b) => a.text.localeCompare(b.text)).forEach(w => {
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
    controls.style.display = 'none';
    return;
  }

  display.textContent = currentWord.text;
  controls.style.display = 'block';
  renderStats();
}

function renderStats() {
  stats.textContent = `Richtig: ${currentWord.anzRichtig} | Falsch: ${currentWord.anzFalsch}`;

  const dict = currentWord.falscheVarianten;
  if (Object.keys(dict).length > 0) {
    variants.innerHTML = '<h4>Falsch geschriebene Varianten</h4><ul>' +
      Object.entries(dict)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `<li>${k} — ${v}</li>`)
        .join('') + '</ul>';
  } else {
    variants.innerHTML = '';
  }
}

function save() {
  localStorage.setItem('wortListe', JSON.stringify(wortListe));
}

function load() {
  const raw = localStorage.getItem('wortListe');
  if (raw) {
    wortListe = JSON.parse(raw).map(obj => Wort.fromJSON(obj));
    if (wortListe.length > 0) {
      currentWord = wortListe[0];
      currentIndex = 0;
    }
  }
  renderList();
  renderCurrent();
}

load();
