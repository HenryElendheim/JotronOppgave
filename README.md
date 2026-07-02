# Certificate Management System

A simple web application for managing certificates: upload them with their metadata, view them in a searchable list, and download the stored files. Built as a developer challenge for Jotron.

## Features

- **Upload** a certificate (PDF) together with its type, number, notified body, date of issue and expiry date.
- **View** all certificates in a table showing every field.
- **Download** the original file for any certificate.
- **Search** certificates by certificate number (partial match).
- **Filter** certificates by type. Search and filter can be combined.

## Tech stack

| Concern          | Choice                                   |
|------------------|------------------------------------------|
| Language         | JavaScript (Node.js)                     |
| Web server / API | Express                                  |
| Database         | SQLite via `better-sqlite3` (single file, zero setup) |
| File uploads     | Multer                                    |
| Front end        | Plain HTML, CSS and JavaScript (no framework) |
| File storage     | PDFs saved to the `uploads/` folder; metadata stored in the database |

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
│  ├─ index.html          upload form
│  ├─ style.css           styling
│  ├─ certificates.html   list / search / filter page
│  └─ certificates.js     fetches the API and renders the table
├─ uploads/               uploaded PDFs (not committed)
├─ db.js                  database connection and table schema
├─ server.js              Express server: routes, API and business logic
├─ certificates.db        SQLite database (auto-created, not committed)
└─ package.json
```

## API endpoints

| Method | Route                | Purpose                                            |
|--------|----------------------|----------------------------------------------------|
| GET    | `/`                  | Upload page (static)                               |
| POST   | `/upload`            | Save an uploaded PDF and its metadata              |
| GET    | `/certificates.html` | List / search page (static)                        |
| GET    | `/api/certificates`  | All certificates as JSON; supports `?number=` and `?type=` filters |
| GET    | `/download/:id`      | Download the stored PDF for one certificate        |

The front end and back end are kept separate: the back end serves data over the API, and the front end (plain JavaScript) fetches that data and renders it.

## Assumptions and notes

- **Single-user, local app.** There is no authentication or user management — out of scope for a short challenge.
- **Files are stored on local disk** under `uploads/`, with only the file path and metadata kept in the database. In a production/cloud setup these would go to blob storage (for example Azure Blob Storage).
- **SQLite** was chosen for zero-config simplicity. The same schema maps cleanly to a server database such as PostgreSQL or SQL Server if the app grew.
- **Dates and notified body** are stored as text (ISO date strings). Validation is light: fields are marked required in the form, and the file input accepts PDFs only, but there is no strict server-side validation yet.
- **Search** is a partial (substring) match on the certificate number; **filter** is an exact match on type. Both can be combined.
- **SQL injection** is prevented by using parameterised queries throughout.

## Possible improvements

- Server-side validation and escaping (the list currently trusts stored values, which is fine for a single-user local tool but would need escaping in a multi-user app).
- Automated tests for the upload / list / download flow.
- Nicer presentation: formatted dates, highlighting expired certificates, an empty-state message.
- Editing and deleting certificates.
