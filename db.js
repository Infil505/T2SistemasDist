const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml'); // npm install js-yaml

const DB_PATH = path.join(__dirname, 'data.json');
const OPENAPI_PATH = path.join(__dirname, '..', 'api', 'openapi.yaml');

function loadOpenAPIExamples() {
    try {
        const openApiContent = fs.readFileSync(OPENAPI_PATH, 'utf8');
        const openApiSpec = yaml.load(openApiContent);
        
        // Extraer ejemplos de libros
        const booksExample = openApiSpec.paths['/books'].get.responses['200'].content['application/json'].examples.libros_variados.value;
        
        // Extraer ejemplos de autores
        const authorsExample = openApiSpec.paths['/authors'].get.responses['200'].content['application/json'].examples.autores_variados.value;
        
        // Extraer ejemplos de editoriales
        const publishersExample = openApiSpec.paths['/publishers'].get.responses['200'].content['application/json'].examples.editoriales_variadas.value;
        
        return {
            books: booksExample || [],
            authors: authorsExample || [],
            publishers: publishersExample || []
        };
    } catch (error) {
        console.error('Error loading OpenAPI examples:', error.message);
        // Fallback a datos mínimos si falla
        return getMinimalSeed();
    }
}

function getMinimalSeed() {
    return {
        books: [
            {
                id: "1",
                title: "Operating System Concepts",
                edition: "9th",
                copyright: 2012,
                language: "ENGLISH",
                pages: 976,
                category: "SCIENCE",
                authorId: "a1",
                publisherId: "p1"
            }
        ],
        authors: [
            { 
                id: "a1", 
                name: "Abraham Silberschatz", 
                biography: "Computer scientist and professor",
                birthYear: 1952,
                nationality: "American",
                country: "US",
                genre: "SCIENCE"
            }
        ],
        publishers: [
            { 
                id: "p1", 
                name: "John Wiley & Sons", 
                description: "Editorial académica y profesional",
                foundedYear: 1807,
                country: "US",
                headquarters: "Hoboken, NJ",
                website: "https://www.wiley.com"
            }
        ]
    };
}

function init() {
    if (!fs.existsSync(DB_PATH)) {
        console.log('Initializing database from OpenAPI examples...');
        
        // Intentar cargar desde OpenAPI primero
        const seed = loadOpenAPIExamples();
        
        console.log(`Loaded ${seed.books.length} books, ${seed.authors.length} authors, ${seed.publishers.length} publishers from OpenAPI`);
        
        fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2));
    }
}

function read() {
    init();
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function write(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Función útil para resetear la base de datos con datos frescos del OpenAPI
function resetFromOpenAPI() {
    console.log('Resetting database from OpenAPI examples...');
    if (fs.existsSync(DB_PATH)) {
        fs.unlinkSync(DB_PATH);
    }
    init();
    return read();
}

module.exports = { read, write, resetFromOpenAPI };