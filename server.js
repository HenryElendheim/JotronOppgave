const express = require("express");
const multer = require("multer");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = 4949;

// Parse form fields and serve the front end from /public.
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Uploaded files are stored in /uploads under a timestamped name so two
// uploads with the same filename never collide. The original name is kept
// in the database for downloads.
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads"),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    },
});

const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"];

// Rejects any file type not on the allowlist before it reaches disk.
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowedExtensions.includes(ext));
    },
});

// Save an uploaded certificate: file to /uploads, metadata to the database.
app.post("/upload", upload.single("file"), (req, res) => {
    // req.file is missing when no file was sent or the type was rejected.
    if (!req.file) {
        return res.status(400).send("Invalid or missing file. Allowed: PDF, PNG, JPG, DOC, DOCX.");
    }

    const { type, number, notified_body, date_of_issue, expiry_date } = req.body;

    db.prepare(`
        INSERT INTO certificates
          (type, number, notified_body, date_of_issue, expiry_date, file_name, original_name, uploaded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        type,
        number,
        notified_body,
        date_of_issue,
        expiry_date,
        req.file.filename,
        req.file.originalname,
        new Date().toISOString()
    );

    res.redirect("/");
});

// List certificates as JSON. Optional query parameters:
//   search      - substring match on number, notified body, and both dates
//   type        - exact match on certificate type
//   hideExpired - when set, only certificates that are still valid
//   sort, dir   - sort column and direction
app.get("/api/certificates", (req, res) => {
    const { search, type } = req.query;

    // WHERE 1=1 is always true; it lets every filter below be appended
    // as "AND ..." without tracking which condition comes first.
    let sql = "SELECT * FROM certificates WHERE 1=1";
    const params = [];

    if (search) {
        sql += " AND (number LIKE ? OR notified_body LIKE ? OR date_of_issue LIKE ? OR expiry_date LIKE ?)";
        const term = `%${search}%`;
        params.push(term, term, term, term);
    }

    if (type) {
        sql += " AND type = ?";
        params.push(type);
    }

    if (req.query.hideExpired) {
        // A certificate with no expiry date is unknown, not expired, so it stays visible.
        sql += " AND (expiry_date >= ? OR expiry_date IS NULL)";
        params.push(new Date().toISOString().slice(0, 10));
    }

    // Placeholders (?) only work for values, not column names, so the sort
    // column is looked up from a fixed whitelist instead. Unknown input
    // falls back to the default and never reaches the SQL string.
    const sortColumns = { date_of_issue: "date_of_issue", expiry_date: "expiry_date" };
    const sortColumn = sortColumns[req.query.sort] || "date_of_issue";
    const sortDir = req.query.dir === "asc" ? "ASC" : "DESC";
    sql += ` ORDER BY ${sortColumn} ${sortDir}`;

    const rows = db.prepare(sql).all(...params);
    res.json(rows);
});

// One certificate's metadata as JSON, for the detail view.
app.get("/api/certificates/:id", (req, res) => {
    const cert = db.prepare("SELECT * FROM certificates WHERE id = ?").get(req.params.id);
    if (!cert) {
        return res.status(404).json({ error: "Certificate not found." });
    }
    res.json(cert);
});

// Download the stored file, renamed back to its original filename.
app.get("/download/:id", (req, res) => {
    const cert = db.prepare("SELECT * FROM certificates WHERE id = ?").get(req.params.id);
    if (!cert) {
        return res.status(404).send("Certificate not found.");
    }

    const filePath = path.join(__dirname, "uploads", cert.file_name);
    res.download(filePath, cert.original_name);
});

// Serve the file inline so the browser renders it (PDFs and images open
// in the tab) instead of forcing a download.
app.get("/view/:id", (req, res) => {
    const cert = db.prepare("SELECT * FROM certificates WHERE id = ?").get(req.params.id);
    if (!cert) {
        return res.status(404).send("Certificate not found.");
    }
    res.sendFile(path.join(__dirname, "uploads", cert.file_name));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
