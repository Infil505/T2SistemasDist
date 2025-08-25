'use strict';

const path = require('path');
const http = require('http');
const cors = require('cors');
const oas3Tools = require('oas3-tools');

const serverPort = process.env.PORT || 8080;

const options = {
    routing: {
        controllers: path.join(__dirname, './controllers')
    }
};

const expressAppConfig = oas3Tools.expressAppConfig(
    path.join(__dirname, 'api/openapi.yaml'),
    options
);

const app = expressAppConfig.getApp();
app.use(cors());

// ➜ que / vaya al Swagger UI
app.get('/', (req, res) => res.redirect('/docs'));
http.createServer(app).listen(serverPort, () => {
    console.log(`Server listening on http://localhost:${serverPort}`);
    console.log(`Swagger-UI: http://localhost:${serverPort}/docs`);
});
