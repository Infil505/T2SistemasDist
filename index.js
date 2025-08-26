'use strict';

const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const oas3Tools = require('oas3-tools');

const serverPort = process.env.PORT || 8080;

const options = {
    routing: {
        controllers: path.join(__dirname, './controllers'),
    },
};

// App generado por oas3-tools (con /docs incluido)
const expressAppConfig = oas3Tools.expressAppConfig(
    path.join(__dirname, 'api/openapi.yaml'),
    options
);
const oasApp = expressAppConfig.getApp();

// App “padre” para controlar el orden
const app = express();

// (Opcional) CORS: quítalo si no lo ocupas
app.use(cors());

// Por si estás detrás de proxy (Render/Heroku)
app.set('trust proxy', 1);

// ➜ que / vaya al Swagger UI (siempre antes de montar oasApp)
app.get('/', (req, res) => {
    // 302 para no cachear permanentemente; usa 308 si quieres método inmutable
    res.redirect(302, `${req.baseUrl || ''}/docs`);
});

// Monta el app generado por oas3-tools (incluye /docs y las rutas de la API)
app.use(oasApp);

// (Opcional) 404 JSON
app.use((req, res) => res.status(404).json({ message: 'Not found' }));

http.createServer(app).listen(serverPort, () => {
    console.log(`Server listening on http://localhost:${serverPort}`);
    console.log(`Swagger-UI: http://localhost:${serverPort}/docs`);
});
