const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

function init() {
    if (!fs.existsSync(DB_PATH)) {
        const seed = {
            books: [
                {
                    id: "1",
                    title: "Operating System Concepts",
                    edition: "9th",
                    copyright: 2012,
                    language: "ENGLISH",
                    pages: 976,
                    authorId: "a1",
                    publisherId: "p1"
                }
            ],
            authors: [
                { id: "a1", name: "Abraham Silberschatz", country: "US" }
            ],
            publishers: [
                { id: "p1", name: "John Wiley & Sons", country: "US" }
            ]
        };
        fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2));
    }
}

function read() {
    init();
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function write(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { read, write };
