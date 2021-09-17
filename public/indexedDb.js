let db;
const request = indexedDB.open("budget", 1); //db called budget, and version 1

request.onupgradeneeded = function(event) {
  const db = event.target.result;
  db.createObjectStore("pending_transaction", { keyPath: "_id", autoIncrement:true });
};

request.onsuccess = function(event) {
  db = event.target.result;
  if (navigator.online) {
    checkDatabase();
  }
};

request.onerror = function(event)  {
  console.log(event.target.error);
};

//While offline
function saveRecord(record) {
  const transaction = db.transaction("pending_transaction", "readwrite");
  const store = transaction.objectStore("pending_transaction");
  store.add(record);
  console.log("You are offline, and your record will be saved once you are back online :)")
}

// checks to see if the database is back online, and if it is it will upload the saved records that were created while off line
function checkDatabase() {
  const transaction = db.transaction("pending_transaction", "readwrite");
  const store = transaction.objectStore("pending_transaction");
  const getAll = store.getAll();

  getAll.onsuccess = () => {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then((response) => response.json())
        .then(() => {
          const transaction = db.transaction("pending_transaction", "readwrite");
          const store = transaction.objectStore("pending_transaction");
          console.log("All offline transactions have been stored!")
          store.clear(); //clears the stored pending_transactions
        })
        .catch(err =>
          console.log(err))
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);