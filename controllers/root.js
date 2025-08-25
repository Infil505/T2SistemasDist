'use strict';
module.exports.home = (req, res) => {
    // O devuelve JSON…
    // res.json({ message: 'Library API up' });

    // …o redirige al Swagger UI
    res.redirect('/docs');
};