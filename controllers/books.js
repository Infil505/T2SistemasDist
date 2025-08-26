'use strict';
const { read, write } = require('../db');

// Función helper para normalizar idiomas (igual que en db.js)
const normalizeLanguageEnum = (val) => {
    if (val == null) return undefined;
    const n = String(val).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (['spanish', 'es', 'espanol'].includes(n)) return 'SPANISH';
    if (['english', 'en', 'ingles'].includes(n)) return 'ENGLISH';
    if (['french', 'fr', 'frances'].includes(n)) return 'FRENCH';
    if (['german', 'de', 'aleman'].includes(n)) return 'GERMAN';
    if (['italian', 'it', 'italiano'].includes(n)) return 'ITALIAN';
    if (['portuguese', 'pt', 'portugues'].includes(n)) return 'PORTUGUESE';
    // Si viene ya como enum u otro valor, lo dejamos en MAYÚSCULAS
    return String(val).toUpperCase();
};

// GET /books
module.exports.listBooks = (req, res) => {
    const db = read();

    // Llega tal cual del enum de Swagger (p. ej., "ENGLISH", "SPANISH")
    const selected = req.query.language;
    let results = db.books;

    // DEBUG: Agregar logs para ver qué está pasando
    console.log('=== DEBUG LANGUAGE FILTER ===');
    console.log('Selected language:', selected);
    console.log('Total books:', db.books.length);
    
    // Mostrar los idiomas de todos los libros
    db.books.forEach(book => {
        const raw = book.language ?? book.lang ?? book.idioma;
        const normalized = normalizeLanguageEnum(raw);
        console.log(`Book "${book.title}": raw="${raw}", normalized="${normalized}"`);
    });

    if (selected && selected !== '--') {
        // Normalizar el idioma seleccionado
        const normalizedSelected = normalizeLanguageEnum(selected);
        console.log('Normalized selected:', normalizedSelected);
        
        results = results.filter((b) => {
            const raw = b.language ?? b.lang ?? b.idioma;
            const values = Array.isArray(raw) ? raw : [raw];
            
            const match = values.some((v) => {
                const normalizedValue = normalizeLanguageEnum(v);
                const isMatch = normalizedValue === normalizedSelected;
                console.log(`  Checking "${b.title}": "${normalizedValue}" === "${normalizedSelected}" = ${isMatch}`);
                return isMatch;
            });
            
            return match;
        });
        
        console.log('Filtered results:', results.length);
    }
    
    console.log('=== END DEBUG ===');

    res.json(results);
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
    const rawId =
        req.params?.id ??
        req.openapi?.pathParams?.id ??
        req.query?.id;
    const book = db.books.find(b => b.id === rawId);
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
    const rawId = req.params?.id ?? req.openapi?.pathParams?.id ?? req.query?.id;
    const db = read();
    const exists = db.books.some(b => b.id === rawId);
    if (!exists) return res.sendStatus(404);
    db.books = db.books.filter(b => b.id !== rawId);
    write(db);
    res.sendStatus(204);
};