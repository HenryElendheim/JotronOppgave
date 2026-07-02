const Database = require("better-sqlite3");

// Opens (or creates on first run) the SQLite database file.
const db = new Database("certificates.db");

// Dates are stored as ISO strings (yyyy-mm-dd) so they sort and compare
// correctly as plain text. file_name is the unique name on disk;
// original_name is what the user uploaded, kept for nicer downloads.
db.exec(`
  CREATE TABLE IF NOT EXISTS certificates (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    type          TEXT NOT NULL,
    number        TEXT NOT NULL,
    notified_body TEXT,
    date_of_issue TEXT,
    expiry_date   TEXT,
    file_name     TEXT NOT NULL,
    original_name TEXT NOT NULL,
    uploaded_at   TEXT NOT NULL
  )
`);

module.exports = db;
