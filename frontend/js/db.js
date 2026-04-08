/* ─────────────────────────────────────────
   js/db.js  —  IndexedDB database helpers
   ───────────────────────────────────────── */

const DB_NAME  = "SmiloCAD_DB";
const DB_STORE = "invoices";
const DB_VER   = 1;

let _db = null;   // holds the open IDBDatabase instance

/* Open (or create) the database */
function dbOpen() {
  return new Promise(function(resolve, reject) {
    const request = indexedDB.open(DB_NAME, DB_VER);

    request.onupgradeneeded = function(e) {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = function(e) {
      _db = e.target.result;
      resolve(_db);
    };

    request.onerror = function(e) {
      reject(e);
    };
  });
}

/* Save (insert or update) one invoice record */
function dbSave(data) {
  return new Promise(function(resolve, reject) {
    const tx      = _db.transaction(DB_STORE, "readwrite");
    const store   = tx.objectStore(DB_STORE);
    const request = data.id ? store.put(data) : store.add(data);

    request.onsuccess = function(e) { resolve(e.target.result); };
    request.onerror   = reject;
  });
}

/* Load all invoice records */
function dbAll() {
  return new Promise(function(resolve, reject) {
    const request = _db.transaction(DB_STORE, "readonly")
                       .objectStore(DB_STORE)
                       .getAll();

    request.onsuccess = function(e) { resolve(e.target.result); };
    request.onerror   = reject;
  });
}

/* Delete one invoice by id */
function dbDelete(id) {
  return new Promise(function(resolve, reject) {
    const request = _db.transaction(DB_STORE, "readwrite")
                       .objectStore(DB_STORE)
                       .delete(id);

    request.onsuccess = resolve;
    request.onerror   = reject;
  });
}
