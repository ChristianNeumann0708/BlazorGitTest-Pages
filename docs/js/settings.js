// ganz oben in js/settings.js
import { Storage } from "./storage.js"; // oder "./js/storage.js" je nach Ordnerstruktur

const WORDS_KEY = "words";

// ------------------------------
// Einstellungen laden
// ------------------------------
function loadSettings() {
  // Alle Settings aus dem gemeinsamen Speicher laden
  const settings = Storage.loadSettings();

  // ------------------------------
  // Sortier-Einstellung
  // ------------------------------
  const sortToggle = document.getElementById("sortByMistakes");
  if (sortToggle) {
    sortToggle.checked = settings.sortByMistakes ?? false;
  }

  // ------------------------------
  // AutoDelete-Einstellungen
  // ------------------------------
  const autoDeleteEnabledEl = document.getElementById("autoDeleteEnabled");
  const autoDeleteThresholdEl = document.getElementById("autoDeleteThreshold");

  if (autoDeleteEnabledEl) {
    autoDeleteEnabledEl.checked = settings.autoDeleteEnabled ?? false;
  }

  if (autoDeleteThresholdEl) {
    autoDeleteThresholdEl.value = settings.autoDeleteThreshold ?? 10;
  }

  // ------------------------------
  // Restore-Elemente
  // ------------------------------
  const restoreInput = document.getElementById("restoreFile");
  const restoreButton = document.getElementById("restoreButton");

  if (!restoreInput) {
    console.error("Restore-Input nicht gefunden!");
    return;
  }
  if (!restoreButton) {
    console.error("Restore-Button nicht gefunden!");
    return;
  }

  restoreInput.onchange = () => {
    const hasFile = restoreInput.files && restoreInput.files.length > 0;
    restoreButton.style.display = hasFile ? "block" : "none";
    console.log("Datei ausgewählt:", hasFile);
  };

  restoreButton.onclick = () => restoreBackup({ target: restoreInput });

  console.log("loadSettings() erfolgreich ausgeführt.");
}

// ------------------------------
// Einstellungen speichern
// ------------------------------
function saveSettings() {
  // Aktuelle Settings laden, damit nichts überschrieben wird
  const settings = Storage.loadSettings();

  // Neue Werte aus dem UI übernehmen
  const updated = {
    ...settings,
    autoDeleteEnabled: document.getElementById("autoDeleteEnabled").checked,
    autoDeleteThreshold: parseInt(document.getElementById("autoDeleteThreshold").value) || 10
  };

  // Persistieren
  Storage.saveSettings(updated);

  showStatus("Einstellungen gespeichert.");
}

// ------------------------------
// Backup herunterladen
// ------------------------------
export function downloadBackup() {
  const raw = localStorage.getItem(WORDS_KEY);
  if (!raw) {
    showStatus("Keine Wörter vorhanden.");
    return;
  }

  const blob = new Blob([raw], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "writeRight-backup.json";
  a.click();

  URL.revokeObjectURL(url);
  showStatus("Backup wurde heruntergeladen.");
}

// ------------------------------
// Backup wiederherstellen
// ------------------------------
export function restoreBackup(event) {
  const file = event.target.files[0];
  if (!file) {
    showStatus("Keine Datei ausgewählt.");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const json = reader.result;
      const oldList = JSON.parse(json);

      console.log("Restore gestartet. Gelesene Daten:", oldList);

      const newList = oldList.map(obj => {
        if (!obj) return null;

        const text = obj.text ?? obj.Text ?? obj.Name ?? null;
        if (!text) {
          console.warn("Ungültiger Eintrag:", obj);
          return null;
        }

        return {
          text,
          anzRichtig: obj.anzRichtig ?? obj.AnzRichtigGeschrieben ?? 0,
          anzFalsch: obj.anzFalsch ?? obj.AnzFalschGeschrieben ?? 0,
          falscheVarianten: obj.falscheVarianten ?? obj.DictFalscheWoerter ?? {}
        };
      }).filter(x => x !== null);

      localStorage.setItem(WORDS_KEY, JSON.stringify(newList));
      showStatus(`Backup wiederhergestellt. (${newList.length} Wörter)`);
    } catch (err) {
      console.error("Fehler beim Restore:", err);
      showStatus("Fehler beim Einlesen der Datei.");
    }
  };

  reader.readAsText(file);
}

// ------------------------------
// Statusmeldung anzeigen
// ------------------------------
function showStatus(msg) {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
}

// Buttons verbinden
document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("saveSettings");
  if (saveBtn) {
    saveBtn.onclick = () => saveSettings();
  }

  const downloadBtn = document.getElementById("downloadBackup");
  if (downloadBtn) {
    downloadBtn.onclick = () => downloadBackup();
  }

  loadSettings();
});

loadSettings();
