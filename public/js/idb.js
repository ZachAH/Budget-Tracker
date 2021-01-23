

const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;

// create variable to hold and connect to indexed db called budget and the 1 is the version
let db;
const request = indexedDB.open("budget", 1);

//will create an object store that will hold the data locally and we set the increments to auto for each new set of data inserted
request.onupgradeneeded = ({ target }) => {
    let db = target.result;
    db.createObjectStore("working", { autoIncrement: true });
};

//on successful connection save reference to variable
request.onsuccess = ({ target }) => {
    db = target.result;
    //check in app is online then run checkDatabase and send all local db to api
    if (navigator.onLine) {
        testConnection();
    }
};
//will inform us if anything goes wrong with the database
request.onerror = function (event) {
    console.log("Something Went Wrong" + event.target.errorCode);
};
//this function will run if we submit budget data and there is no internet connection
function saveRecord(record) {
    //opens transaction with read and write permissions
    const transaction = db.transaction(["money"], "readwrite");
    //access the object store for money
    const store = transaction.objectStore("money");
    //adds record to the store 
    store.add(record);
}

function testConnection() {
    //opens a transaction accesses and gets all records  and then sets it to the variable
    const transaction = db.transaction(["money"], "readwrite");
    const store = transaction.objectStore("money");
    const getAll = store.getAll();
    //upon successful getAll this function will run
    getAll.onsuccess = function () {
        //if data is stored it will send it to the api server 
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content=Type": "application/json"
                }
            })
                //opens one more transaction access the money object store and then clears all items
                .then(response => {
                    return response.json();
                })
                .then(() => {
                    const transaction = db.transaction(["money"], "readwrite");
                    const store = transaction.objectStore("money");
                    store.clear();
                });
        }
    };
}
// listens for when the app is back online 
window.addEventListener("online", testConnection);


