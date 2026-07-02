const express = require("express");
const multer = require("multer");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = 4949;

// Let the server read form fields and serve files from /public
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Configure where uploaded files are saved and how they're named
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads"),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    },
});
const upload = multer({ storage });

// Handle the upload form submission
app.post("/upload", upload.single("file"), (req, res) => {
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

// Return certificates as JSON, optionally filtered by number and/or type.
app.get("/api/certificates", (req, res) => {
    const { number, type } = req.query;

    let sql = "SELECT * FROM certificates WHERE 1=1";
    const params = [];

    if (number) {
        sql += " AND number LIKE ?";
        params.push(`%${number}%`);
    }

    if (type) {
        sql += " AND type = ?";
        params.push(type);
    }

    sql += " ORDER BY id DESC";

    const rows = db.prepare(sql).all(...params);
    res.json(rows);
});

// Lets you download the specific file that you press download on.
app.get("/download/:id", (req, res) => {
    const cert = db.prepare("SELECT * FROM certificates WHERE id = ?").get(req.params.id);

    if (!cert) {
        return res.status(404).send("Certificate not found.");
    }

    const filePath = path.join(__dirname, "uploads", cert.file_name);
    res.download(filePath, cert.original_name);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});