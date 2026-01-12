const WORDS_KEY = "words";

// ------------------------------
// Einstellungen laden
// ------------------------------
export function loadSettings() {
  const saved = localStorage.getItem("settings");
  if (!saved) return;

  try {
    const settings = JSON.parse(saved);
    document.getElementById("autoDeleteEnabled").checked = settings.autoDeleteEnabled ?? false;
    document.getElementById("autoDeleteThreshold").value = settings.autoDeleteThreshold ?? 10;
  } catch {
    console.warn("Fehler beim Laden der Einstellungen.");
  }

  // Restore-Event binden
  const restoreInput = document.getElementById("restoreFile");
  if (restoreInput) {
    restoreInput.onchange = restoreBackup;
  } else {
    console.error("Restore-Input nicht gefunden!");
  }
}

// ------------------------------
// Einstellungen speichern
// ------------------------------
export function saveSettings() {
  const settings = {
    autoDeleteEnabled: document.getElementById("autoDeleteEnabled").checked,
    autoDeleteThreshold: parseInt(document.getElementById("autoDeleteThreshold").value) || 10
  };

  localStorage.setItem("settings", JSON.stringify(settings));
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
