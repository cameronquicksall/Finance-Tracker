// declare variable for db connection
let db;
// establish IndexedDB connection
const request = indexedDB.open('finance_tracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    // create a table in the database called new_transaction with autoIncrement set to true
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode);
};
// Function to submit new transaction while offline
function saveRecord(record) {
    // opens a new transaction with db using readwrite permission
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    // accesses object store for new_transaction
    const transactionObjectStore = transaction.objectStore('new_transaction');
// creates a record of the input with add method
    transactionObjectStore.add(record);
};

function uploadTransaction() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    // access object store / new_transaction table
    const transactionObjectStore = transaction.objectStore('new_transaction');
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if(serverResponse.message) {
                    throw new Error(serverResponse);
                }
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                const transactionObjectStore = transaction.objectStore('new_transaction');
                transactionObjectStore.clear();

                alert('All saved transaction have been submitted');
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
};

window.addEventListener('online', uploadTransaction);