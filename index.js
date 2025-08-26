'use strict';

const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const oas3Tools = require('oas3-tools');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const serverPort = process.env.PORT || 8080;

// 1) Carga tu OpenAPI
const openapiPath = path.join(__dirname, 'api/openapi.yaml');
const openapiDoc = YAML.load(openapiPath);

// 2) App generado por oas3-tools (rutas de la API)
const oasApp = oas3Tools
    .expressAppConfig(openapiPath, {
        routing: { controllers: path.join(__dirname, './controllers') },
    })
    .getApp();

// 3) App “padre” para controlar el orden
const app = express();
app.set('trust proxy', 1);
app.use(cors());

// 4) Redirección raíz → /docs (ANTES de montar nada más)
app.get('/', (req, res) => res.redirect(302, '/docs'));

// 5) Sirve Swagger UI en /docs (independiente de oas3-tools)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc, { explorer: true }));

// 6) Monta el app de oas3-tools (todas las rutas de la API)
app.use(oasApp);

// 7) 404 final (por si algo se escapa)
app.use((req, res) => {
    res.status(404).json({ message: 'not found', errors: [{ path: req.path, message: 'not found' }] });
});

// 8) Arranque
http.createServer(app).listen(serverPort, () => {
    console.log(`Server listening on http://localhost:${serverPort}`);
    console.log(`Swagger UI: http://localhost:${serverPort}/docs`);
});
