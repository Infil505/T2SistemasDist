const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml'); // npm i js-yaml

const DB_PATH = path.join(__dirname, 'data.json');
const OPENAPI_PATH = path.join(__dirname, '..', 'api', 'openapi.yaml');

// === Helpers ===
const asArray = (v) => (Array.isArray(v) ? v : v != null ? [v] : []);
const toInt = (v) => (v === '' || v == null || isNaN(v) ? undefined : parseInt(v, 10));
const dedupeBy = (arr, key) => {
    const seen = new Set();
    return arr.filter((x) => {
        const k = x?.[key];
        if (k == null || seen.has(k)) return k != null && !seen.has(k) && (seen.add(k), false);
        seen.add(k);
        return true;
    });
};

// Normaliza idiomas a tus enums (para que coincidan EXACTO con el combo de Swagger)
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

// Resuelve un example que puede venir como { value }, un $ref, o el valor directo
function resolveExample(openApiSpec, exNode) {
    if (!exNode) return undefined;
    if (exNode.$ref) {
        const id = exNode.$ref.split('/').pop();
        return openApiSpec?.components?.examples?.[id]?.value;
    }
    if (typeof exNode === 'object' && 'value' in exNode) return exNode.value;
    return exNode;
}

// Extrae un arreglo desde /path {method} 200 application/json
function extractArrayFrom(openApiSpec, route, method = 'get', status = '200', preferName) {
    const content =
        openApiSpec?.paths?.[route]?.[method]?.responses?.[status]?.content?.['application/json'];

    if (!content) return [];

    // 1) Si nos pasaste un nombre (libros_variados, etc.) y existe en examples.<nombre>
    if (preferName && content.examples && content.examples[preferName]) {
        const v = resolveExample(openApiSpec, content.examples[preferName]);
        return asArray(v);
    }

    // 2) Cualquier example nombrado dentro de "examples"
    if (content.examples) {
        for (const ex of Object.values(content.examples)) {
            const v = resolveExample(openApiSpec, ex);
            if (v != null) return asArray(v);
        }
    }

    // 3) "example" directo en content
    if (content.example != null) return asArray(content.example);

    // 4) "schema.example" o "schema.items.example"
    const schema = content.schema;
    if (schema?.example != null) return asArray(schema.example);
    if (schema?.items?.example != null) return asArray(schema.items.example);

    return [];
}

// Saneamos y alineamos los datos a tu modelo
function sanitizeSeed(raw) {
    let authors = asArray(raw.authors).map((a) => ({
        ...a,
        id: String(a.id),
        name: a.name ?? 'Unknown Author',
        birthYear: toInt(a.birthYear),
        genre: a.genre ? String(a.genre).toUpperCase() : a.genre,
    }));
    authors = dedupeBy(authors, 'id');

    let publishers = asArray(raw.publishers).map((p) => ({
        ...p,
        id: String(p.id),
        foundedYear: toInt(p.foundedYear),
    }));
    publishers = dedupeBy(publishers, 'id');

    let books = asArray(raw.books).map((b) => ({
        ...b,
        id: String(b.id),
        title: b.title ?? 'Untitled',
        copyright: toInt(b.copyright),
        pages: toInt(b.pages),
        category: b.category ? String(b.category).toUpperCase() : b.category,
        language: normalizeLanguageEnum(b.language ?? b.lang ?? b.idioma),
        authorId: b.authorId != null ? String(b.authorId) : undefined,
        publisherId: b.publisherId != null ? String(b.publisherId) : undefined,
    }));
    books = dedupeBy(books, 'id');

    // Asegurar integridad referencial mínima: si un book referencia un autor/editorial inexistente, creamos placeholder
    const haveAuthor = new Set(authors.map((a) => a.id));
    const havePublisher = new Set(publishers.map((p) => p.id));

    for (const b of books) {
        if (b.authorId && !haveAuthor.has(b.authorId)) {
            authors.push({ id: b.authorId, name: `Unknown Author ${b.authorId}` });
            haveAuthor.add(b.authorId);
        }
        if (b.publisherId && !havePublisher.has(b.publisherId)) {
            publishers.push({ id: b.publisherId, name: `Unknown Publisher ${b.publisherId}` });
            havePublisher.add(b.publisherId);
        }
    }

    return { books, authors, publishers };
}

function loadOpenAPIExamples() {
    try {
        const openApiContent = fs.readFileSync(OPENAPI_PATH, 'utf8');
        const spec = yaml.load(openApiContent);
        console.log('=== RAW EXTRACTION FROM OPENAPI ===');
        console.log('Books extracted:', booksRaw.length);
        booksRaw.forEach((book, i) => {
            console.log(`  Book ${i+1}: id="${book.id}", title="${book.title}", language="${book.language}"`);
        });

        const seed = {
            books: booksRaw,
            authors: authorsRaw,
            publishers: publishersRaw,
        };

        const clean = sanitizeSeed(seed);
        
        clean.books.forEach((book, i) => {
            console.log(`  Final Book ${i+1}: id="${book.id}", title="${book.title}", language="${book.language}"`);
        });

        return clean;
    } catch (err) {
        console.error('Error loading OpenAPI examples:', err.message);
        return getMinimalSeed();
    }
}

function getMinimalSeed() {
    return sanitizeSeed({
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
    });
}


function init() {
    if (!fs.existsSync(DB_PATH)) {
        console.log('Initializing database from OpenAPI examples...');
        const seed = loadOpenAPIExamples();
        console.log(
            `Loaded ${seed.books.length} books, ${seed.authors.length} authors, ${seed.publishers.length} publishers from OpenAPI`
        );
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

function resetFromOpenAPI() {
    console.log('Resetting database from OpenAPI examples...');
    if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
    init();
    return read();
}

module.exports = { read, write, resetFromOpenAPI };
