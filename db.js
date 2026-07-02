const Database = require("better-sqlite3");

// Creates a database file called certificates.db
const db = new Database("certificates.db");

// Create the certificates table if it doesn't already exist
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