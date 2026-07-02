# Certificate Management System

A web application for managing certificates: upload them with their metadata, browse and search them, and view or download the stored files. Built as a developer challenge for Jotron.

## Features

- **Upload** a certificate file (PDF, PNG, JPG, DOC or DOCX) with its type, number, notified body, date of issue and expiry date.
- **View** all certificates in a sortable table, or click a row for a detail page with all fields.
- **View or download** the stored file. PDFs and images open directly in the browser.
- **Search** across certificate number, notified body and dates (partial match).
- **Filter** by certificate type, and optionally hide expired certificates. All filters and search can be combined.
- **Sort** by date of issue or expiry date by clicking the column header; clicking again flips the direction.
- Expired certificates are highlighted in the list.
- Light and dark theme, remembered between visits.

## Tech stack

| Concern          | Choice                                   |
|------------------|------------------------------------------|
| Language         | JavaScript (Node.js)                     |
| Web server / API | Express                                  |
| Database         | SQLite via `better-sqlite3` (single file, zero setup) |
| File uploads     | Multer (with a file type allowlist)      |
| Front end        | Plain HTML, CSS and JavaScript, no framework. Single page, hash-based routing |
| File storage     | Files saved to the `uploads/` folder; metadata stored in the database |

## How to run

Requires [Node.js](https://nodejs.org/) installed.

```bash
npm install       # install dependencies (first time only)
node server.js    # start the server
```

Then open **http://localhost:4949** in a browser.

## Project structure

```
JotronOppgave/
├─ public/
│  ├─ index.html          page shell: top bar, nav and the view container
│  ├─ app.js              hash router, views and API calls
│  ├─ theme.js            light/dark theme toggle
│  └─ style.css           styling for both themes
├─ uploads/               uploaded files (not committed)
├─ db.js                  database connection and table schema
├─ server.js              Express server: routes, API and business logic
├─ certificates.db        SQLite database (auto-created, not committed)
└─ package.json
```

## API endpoints

| Method | Route                   | Purpose                                         |
|--------|-------------------------|-------------------------------------------------|
| POST   | `/upload`               | Save an uploaded file and its metadata          |
| GET    | `/api/certificates`     | Certificates as JSON. Query parameters: `search`, `type`, `hideExpired`, `sort`, `dir` |
| GET    | `/api/certificates/:id` | One certificate's metadata, for the detail view |
| GET    | `/view/:id`             | Serve the stored file inline in the browser     |
| GET    | `/download/:id`         | Download the stored file with its original name |

The front end and back end are separate: all filtering, sorting and business logic runs in the back end, and the front end fetches JSON from the API and renders it.

## Assumptions and notes

- **Single-user, local app.** No authentication or user management — out of scope for a short challenge.
- **Files are stored on local disk** under `uploads/`, with only the filename and metadata in the database. In a production setup these would go to blob storage (for example Azure Blob Storage) instead.
- **SQLite** was chosen for zero-config simplicity. The schema maps directly to a server database such as PostgreSQL or SQL Server if the app grew.
- **Certificate numbers are free text**, since real certificate numbers contain letters and dashes.
- **Dates are stored as ISO strings** (yyyy-mm-dd), which sort and compare correctly as text. A certificate counts as expired when its expiry date is before today; certificates without an expiry date are never hidden as expired.
- **Search** is a substring match across number, notified body and both dates. The type filter is an exact match. Certificate type is deliberately not part of the text search since the dropdown already covers it.
- **SQL injection** is prevented with parameterised queries for values and a whitelist for sort columns.
- **Validation is light**: fields are required in the form and uploads are checked against a file type allowlist on the server, but there is no strict server-side validation of field contents yet.

## Possible improvements

- Server-side validation of field contents, and HTML-escaping of stored values in the front end (fine for a single-user local tool, required in a multi-user app).
- Automated tests for the upload, list and download flow.
- Editing and deleting certificates.
- Formatted dates and an empty-state message when no certificates match.
