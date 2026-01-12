const STORAGE_KEY = "words";

export const Storage = {
  load() {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return [];

    try {
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  save(words) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  }
};
