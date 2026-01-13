// wwwroot/js/indexedBackup.js
(function () {
  function openDb(dbName, storeName) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName, 3);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

async function save(dbName, storeName, json) {
  try {
    const db = await openDb(dbName, storeName);
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);

      const req = store.put(json, "backup");
      req.onsuccess = () => {
        const metaTx = db.transaction(storeName, "readwrite");
        const metaStore = metaTx.objectStore(storeName);
        metaStore.put(Date.now().toString(), "backup_ts");
        resolve();
      };
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error("indexedBackup.save error", err);
    throw err;
  }
}

  async function load(dbName, storeName) {
    try {
      const db = await openDb(dbName, storeName);
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.get("backup");
        req.onsuccess = (e) => {
          const val = e.target.result;
          resolve(val || "");
        };
        req.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.error("indexedBackup.load error", err);
      return "";
    }
  }

  window.indexedBackup = {
    save: save,
    load: load
  };
})();
