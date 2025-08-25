'use strict';
const { read, write } = require('../db');

module.exports.listAuthors = (req, res) => {
    const db = read();
    res.json(db.authors);
};

module.exports.createAuthor = (req, res) => {
    const db = read();
    const author = req.body;
    if (!author?.id) return res.status(400).json({ message: 'id requerido' });
    if (db.authors.find(a => a.id === author.id)) {
        return res.status(409).json({ message: 'id duplicado' });
    }
    db.authors.push(author);
    write(db);
    res.status(201).json(author);
};

module.exports.getAuthor = (req, res) => {
    const db = read();
    const author = db.authors.find(a => a.id === req.params.id);
    if (!author) return res.sendStatus(404);
    res.json(author);
};

module.exports.updateAuthor = (req, res) => {
    const db = read();
    const idx = db.authors.findIndex(a => a.id === req.params.id);
    if (idx === -1) return res.sendStatus(404);
    db.authors[idx] = { ...db.authors[idx], ...req.body, id: req.params.id };
    write(db);
    res.json(db.authors[idx]);
};

module.exports.deleteAuthor = (req, res) => {
    const db = read();
    const exists = db.authors.some(a => a.id === req.params.id);
    if (!exists) return res.sendStatus(404);


    const hasBooks = read().books.some(b => b.authorId === req.params.id);
    if (hasBooks) return res.status(409).json({ message: 'autor con libros asociados' });

    db.authors = db.authors.filter(a => a.id !== req.params.id);
    write(db);
    res.sendStatus(204);
};
