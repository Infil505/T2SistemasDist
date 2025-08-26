'use strict';

const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const oas3Tools = require('oas3-tools');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const serverPort = process.env.PORT || 8080;
const openapiPath = path.join(__dirname, 'api/openapi.yaml');
const openapiDoc = YAML.load(openapiPath);
const oasApp = oas3Tools
    .expressAppConfig(openapiPath, {
        routing: { controllers: path.join(__dirname, './controllers') },
    })
    .getApp();
const app = express();
app.set('trust proxy', 1);
app.use(cors());

app.get('/', (req, res) => res.redirect(302, '/docs'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc, { explorer: true }));
app.use(oasApp);
app.use((req, res) => {
    res.status(404).json({ message: 'not found', errors: [{ path: req.path, message: 'not found' }] });
});

http.createServer(app).listen(serverPort, () => {
    console.log(`Server listening on http://localhost:${serverPort}`);
    console.log(`Swagger UI: http://localhost:${serverPort}/docs`);
});
