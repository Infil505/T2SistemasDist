'use strict';
const { read, write } = require('../db');

module.exports.listPublishers = (req, res) => {
    const db = read();
    res.json(db.publishers);
};

module.exports.createPublisher = (req, res) => {
    const db = read();
    const pub = req.body;
    if (!pub?.id) return res.status(400).json({ message: 'id requerido' });
    if (db.publishers.find(p => p.id === pub.id)) {
        return res.status(409).json({ message: 'id duplicado' });
    }
    db.publishers.push(pub);
    write(db);
    res.status(201).json(pub);
};

module.exports.getPublisher = (req, res) => {
    const db = read();
    const pub = db.publishers.find(p => p.id === req.params.id);
    if (!pub) return res.sendStatus(404);
    res.json(pub);
};

module.exports.updatePublisher = (req, res) => {
    const db = read();
    const idx = db.publishers.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.sendStatus(404);
    db.publishers[idx] = { ...db.publishers[idx], ...req.body, id: req.params.id };
    write(db);
    res.json(db.publishers[idx]);
};

module.exports.deletePublisher = (req, res) => {
    const db = read();
    const rawId = req.params?.id ?? req.openapi?.pathParams?.id ?? req.query?.id;
    const exists = db.publishers.some(p => p.id === rawId);
    if (!exists) return res.sendStatus(404);

    const hasBooks = read().books.some(b => b.publisherId === rawId);
    if (hasBooks) return res.status(409).json({ message: 'editorial con libros asociados' });

    db.publishers = db.publishers.filter(p => p.id !== rawId);
    write(db);
    res.sendStatus(204);
};
