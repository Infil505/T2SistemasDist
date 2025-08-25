'use strict';
const { read, write } = require('../db');

// GET /books
module.exports.listBooks = (req, res) => {
    const db = read();
    res.json(db.books);
};

// POST /books
module.exports.createBook = (req, res) => {
    const db = read();
    const book = req.body;
    if (!book?.id) return res.status(400).json({ message: 'id requerido' });

    if (!db.authors.find(a => a.id === book.authorId)) {
        return res.status(400).json({ message: 'authorId no existe' });
    }
    if (!db.publishers.find(p => p.id === book.publisherId)) {
        return res.status(400).json({ message: 'publisherId no existe' });
    }
    if (db.books.find(b => b.id === book.id)) {
        return res.status(409).json({ message: 'id duplicado' });
    }
    db.books.push(book);
    write(db);
    res.status(201).json(book);
};

// GET /books/{id}
module.exports.getBook = (req, res) => {
    const db = read();
    const book = db.books.find(b => b.id === req.params.id);
    if (!book) return res.sendStatus(404);
    res.json(book);
};

// PUT /books/{id}
module.exports.updateBook = (req, res) => {
    const db = read();
    const idx = db.books.findIndex(b => b.id === req.params.id);
    if (idx === -1) return res.sendStatus(404);

    const incoming = req.body;
    if (incoming.authorId && !db.authors.find(a => a.id === incoming.authorId)) {
        return res.status(400).json({ message: 'authorId no existe' });
    }
    if (incoming.publisherId && !db.publishers.find(p => p.id === incoming.publisherId)) {
        return res.status(400).json({ message: 'publisherId no existe' });
    }

    db.books[idx] = { ...db.books[idx], ...incoming, id: req.params.id };
    write(db);
    res.json(db.books[idx]);
};

// DELETE /books/{id}
module.exports.deleteBook = (req, res) => {
    const db = read();
    const exists = db.books.some(b => b.id === req.params.id);
    if (!exists) return res.sendStatus(404);
    db.books = db.books.filter(b => b.id !== req.params.id);
    write(db);
    res.sendStatus(204);
};
