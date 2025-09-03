const http = require("http");
const fs = require("fs");
const path = require("path");
const handleItemsRoutes = require("./routes/items");

const PORT = 3000;
const PUBLIC_PATH = path.join(__dirname, "..", "public");

const server = http.createServer((req, res) => {
    // Imprimir peticiones
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // Rutas API (items.js)
    if (handleItemsRoutes(req, res)) return;

    // Archivos estáticos
    let filePath = req.url === "/" ? "index.html" : req.url;
    const extname = path.extname(filePath);
    const mimeTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "text/javascript",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpg",
        ".gif": "image/gif"
    };

    const fullPath = path.join(PUBLIC_PATH, filePath);

    let contentType = mimeTypes[extname] || "text/plain";

    fs.readFile(fullPath, (err, content) => {
        if (err) {
            if (err.code === "ENOENT") {
                res.writeHead(404);
                res.end("404 Not Found");
            } else {
                res.writeHead(500);
                res.end(`Error del servidor: ${err.code}`);
            }
        } else {
            res.writeHead(200, { "Content-Type": contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});