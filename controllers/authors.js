'use strict';
const { read, write } = require('../db');

const getPathId = (req, names = ['id', 'authorId']) => {
    for (const n of names) {
        if (req.params?.[n]) return req.params[n];
        if (req.openapi?.pathParams?.[n]) return req.openapi.pathParams[n];
    }
    return undefined;
};


module.exports.listAuthors = (req, res) => {
    const db = read();
    res.json(db.authors);
};

// POST /authors
module.exports.createAuthor = (req, res) => {
    const db = read();

    const rawId =
        req.body?.id ??
        req.params?.id ??
        req.openapi?.pathParams?.id ??
        req.query?.id;

    if (!rawId) {
        return res.status(400).json({
            message: 'id requerido',
            debug: { params: req.params, pathParams: req.openapi?.pathParams }
        });
    }

    const id = String(rawId).trim();
    if (!id) return res.status(400).json({ message: 'id requerido (vacío)' });

    if (db.authors.some(a => String(a.id) === id)) {
        return res.status(409).json({ message: 'id duplicado' });
    }

    const toInt = (v) => {
        const n = parseInt(v, 10);
        return Number.isNaN(n) ? undefined : n;
    };

    const incoming = req.body || {};
    const author = {
        id,
        name: incoming.name ?? `Author ${id}`,
        biography: incoming.biography,
        birthYear: incoming.birthYear !== undefined ? toInt(incoming.birthYear) : undefined,
        nationality: incoming.nationality,
        country: incoming.country,
        genre: incoming.genre != null ? String(incoming.genre).toUpperCase() : undefined,
    };

    Object.keys(author).forEach(k => author[k] === undefined && delete author[k]);

    db.authors.push(author);
    write(db);
    res.status(201).location(`/authors/${encodeURIComponent(id)}`).json(author);
};

// GET /authors/{id}
module.exports.getAuthor = (req, res) => {
    const rawId =
        req.params?.id ??
        req.openapi?.pathParams?.id ??
        req.query?.id;

    if (!rawId) {
        return res.status(400).json({
            message: 'Falta id en path /authors/{id}',
            debug: { params: req.params, pathParams: req.openapi?.pathParams }
        });
    }
    console.log('rawId=', rawId);
    console.log('req.params=', req.params);
    console.log('req.openapi?.pathParams=', req.openapi?.pathParams);

    const id = String(rawId);
    const db = read();
    const author = db.authors.find(a => String(a.id) === id);
    if (!author) return res.sendStatus(404);

    const expand = new Set(String(req.query.expand || '').split(',').map(s => s.trim()).filter(Boolean));
    if (expand.has('books') || expand.has('*')) {
        const books = db.books.filter(b => String(b.authorId) === id);
        return res.json({ ...author, books });
    }

    res.json(author);
};


// PUT /authors/{id}
module.exports.updateAuthor = (req, res) => {
    const db = read();

    const rawId = req.params?.id ?? req.openapi?.pathParams?.id ?? req.query?.id;
    if (!rawId) {
        return res.status(400).json({
            message: 'Falta id en path /authors/{id}',
            debug: { params: req.params, pathParams: req.openapi?.pathParams }
        });
    }
    const id = String(rawId);

    const idx = db.authors.findIndex(a => String(a.id) === id);
    if (idx === -1) return res.sendStatus(404);

    const incoming = { ...req.body };
    delete incoming.id; // el id del path manda

    // normalizaciones opcionales
    if (incoming.birthYear !== undefined) {
        const n = parseInt(incoming.birthYear, 10);
        incoming.birthYear = Number.isNaN(n) ? undefined : n;
    }
    if (incoming.genre !== undefined && incoming.genre !== null) {
        incoming.genre = String(incoming.genre).toUpperCase();
    }

    db.authors[idx] = { ...db.authors[idx], ...incoming, id };
    write(db);
    res.json(db.authors[idx]);
};


// DELETE /authors/{id}
module.exports.deleteAuthor = (req, res) => {
    const db = read();

    const rawId =
        req.params?.id ??
        req.openapi?.pathParams?.id ??
        req.query?.id;

    if (!rawId) {
        return res.status(400).json({
            message: 'Falta id en path /authors/{id}',
            debug: { params: req.params, pathParams: req.openapi?.pathParams }
        });
    }

    const id = String(rawId);

    const exists = db.authors.some(a => String(a.id) === id);
    if (!exists) return res.sendStatus(404);

    const relatedCount = db.books.filter(b => String(b.authorId) === id).length;
    if (relatedCount > 0) {
        return res.status(409).json({ message: 'autor con libros asociados', count: relatedCount });
    }

    db.authors = db.authors.filter(a => String(a.id) !== id);
    write(db);
    res.sendStatus(204);
};

