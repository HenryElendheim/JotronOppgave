// Front-end logic for the single-page app. The router reads the URL hash
// and renders the matching view into <main id="view">; all data comes from
// the JSON API in server.js.

const view = document.querySelector("#view");
const tooltip = document.querySelector("#row-tooltip");

// Current sort state for the certificates table. Lives at module level so
// it survives re-renders of the list view.
let sortColumn = "date_of_issue";
let sortDir = "desc";

// Tooltip that shows a row's full details when its text is cut off.

function showTooltip(c) {
    tooltip.innerHTML = `
        <div><strong>Type:</strong> ${c.type}</div>
        <div><strong>Number:</strong> ${c.number}</div>
        <div><strong>Notified body:</strong> ${c.notified_body ?? "-"}</div>
        <div><strong>Date of issue:</strong> ${c.date_of_issue ?? "-"}</div>
        <div><strong>Expiry date:</strong> ${c.expiry_date ?? "-"}</div>
    `;
    tooltip.style.display = "block";
}

function moveTooltip(event) {
    tooltip.style.left = (event.clientX + 16) + "px";
    tooltip.style.top = (event.clientY + 16) + "px";
}

function hideTooltip() {
    tooltip.style.display = "none";
}

// True when any cell's content is wider than its visible box, meaning the
// CSS ellipsis has cut something off.
function isRowTruncated(row) {
    const cells = row.querySelectorAll("td");
    return [...cells].some((td) => td.scrollWidth > td.clientWidth);
}

// Upload view: the certificate form. Submits via fetch so the page never
// reloads, then switches to the list view.
function renderUpload() {
    view.innerHTML = `
        <h1>Upload a certificate</h1>
        <form id="upload-form">
            <label>Certificate type</label>
            <select name="type" required>
                <option value="">Not selected</option>
                <option value="Declaration of conformity">Declaration of conformity</option>
                <option value="Green passport">Green passport</option>
                <option value="Type approval">Type approval</option>
                <option value="Product certificate">Product certificate</option>
            </select>

            <label>Certificate number</label>
            <input type="text" name="number" required />

            <label>Notified body</label>
            <input type="text" name="notified_body" required />

            <label>Date of issue</label>
            <input type="date" name="date_of_issue" required />

            <label>Expiry date</label>
            <input type="date" name="expiry_date" required />

            <label>Certificate file</label>
            <input type="file" name="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" required />

            <button type="submit">Upload</button>
        </form>
    `;

    const form = document.querySelector("#upload-form");
    form.addEventListener("submit", async (event) => {
        // Stop the browser's default full-page form submission.
        event.preventDefault();

        const data = new FormData(form);
        const res = await fetch("/upload", { method: "POST", body: data });
        if (!res.ok) {
            alert("Upload failed. Allowed file types: PDF, PNG, JPG, DOC, DOCX.");
            return;
        }
        location.hash = "#certificates";
    });
}

// List view: search box, type filter, hide-expired toggle, and the table.
function renderList() {
    view.innerHTML = `
        <h1>All certificates</h1>
        <div id="controls">
            <input type="text" id="search-box" placeholder="Search by number, notified body, or date (yyyy.mm.dd)" />
            <select id="filter-type">
                <option value="">All types</option>
                <option value="Declaration of conformity">Declaration of conformity</option>
                <option value="Green passport">Green passport</option>
                <option value="Type approval">Type approval</option>
                <option value="Product certificate">Product certificate</option>
            </select>
            <label id="hide-expired-label">
                <input type="checkbox" id="hide-expired" /> Hide expired
            </label>
        </div>
        <table id="cert-table">
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Number</th>
                    <th>Notified body</th>
                    <th class="sortable" data-sort="date_of_issue" data-label="Date of issue">Date of issue</th>
                    <th class="sortable" data-sort="expiry_date" data-label="Expiry date">Expiry date</th>
                    <th>File</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;

    document.querySelector("#search-box").addEventListener("input", loadCertificates);
    document.querySelector("#filter-type").addEventListener("change", loadCertificates);
    document.querySelector("#hide-expired").addEventListener("change", loadCertificates);

    // Clicking a date header sorts by it; clicking it again flips the direction.
    document.querySelectorAll("#cert-table th.sortable").forEach((th) => {
        th.addEventListener("click", () => {
            const column = th.dataset.sort;
            if (sortColumn === column) {
                sortDir = sortDir === "desc" ? "asc" : "desc";
            } else {
                sortColumn = column;
                sortDir = "desc";
            }
            loadCertificates();
        });
    });

    loadCertificates();
}

// Marks the active sort column with an up or down arrow.
function updateSortArrows() {
    document.querySelectorAll("#cert-table th.sortable").forEach((th) => {
        const isActive = th.dataset.sort === sortColumn;
        th.textContent = th.dataset.label + (isActive ? (sortDir === "desc" ? " ↓" : " ↑") : "");
    });
}

// Fetches certificates matching the current controls and rebuilds the table.
async function loadCertificates() {
    const search = document.querySelector("#search-box").value;
    const type = document.querySelector("#filter-type").value;
    const hideExpired = document.querySelector("#hide-expired").checked;

    // The full query has to be built before the request is sent.
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (type) params.set("type", type);
    if (hideExpired) params.set("hideExpired", "1");
    params.set("sort", sortColumn);
    params.set("dir", sortDir);

    updateSortArrows();

    const res = await fetch("/api/certificates?" + params.toString());
    const certs = await res.json();

    const tbody = document.querySelector("#cert-table tbody");
    tbody.innerHTML = "";

    // ISO dates compare correctly as strings, so expired means the stored
    // date is smaller than today's.
    const today = new Date().toISOString().slice(0, 10);

    for (const c of certs) {
        const row = document.createElement("tr");
        const isExpired = c.expiry_date && c.expiry_date < today;
        if (isExpired) row.classList.add("expired");

        row.innerHTML = `
            <td>${c.type}</td>
            <td>${c.number}</td>
            <td>${c.notified_body ?? ""}</td>
            <td>${c.date_of_issue ?? ""}</td>
            <td>${isExpired ? `${c.expiry_date} (expired)` : c.expiry_date ?? ""}</td>
            <td><a href="/download/${c.id}">Download</a></td>
        `;

        // Show the full-details tooltip only when something is truncated.
        row.addEventListener("mouseenter", () => {
            if (isRowTruncated(row)) showTooltip(c);
        });
        row.addEventListener("mousemove", moveTooltip);
        row.addEventListener("mouseleave", hideTooltip);

        // Clicking a row opens its detail view. The download link sits inside
        // the row, so its clicks must not bubble up and trigger navigation.
        row.addEventListener("click", () => {
            location.hash = "#certificate/" + c.id;
        });
        row.querySelector("a").addEventListener("click", (event) => event.stopPropagation());

        tbody.appendChild(row);
    }
}

// Detail view: all fields for one certificate, with view and download links.
async function renderDetail(id) {
    const res = await fetch("/api/certificates/" + id);
    if (!res.ok) {
        view.innerHTML = `<h1>Certificate not found</h1><a href="#certificates">Back to certificates</a>`;
        return;
    }

    const c = await res.json();
    view.innerHTML = `
        <h1>Certificate details</h1>
        <div class="detail-card">
            <div class="detail-row"><span>Type</span><span>${c.type}</span></div>
            <div class="detail-row"><span>Number</span><span>${c.number}</span></div>
            <div class="detail-row"><span>Notified body</span><span>${c.notified_body ?? "-"}</span></div>
            <div class="detail-row"><span>Date of issue</span><span>${c.date_of_issue ?? "-"}</span></div>
            <div class="detail-row"><span>Expiry date</span><span>${c.expiry_date ?? "-"}</span></div>
            <div class="detail-row"><span>File</span><span>${c.original_name}</span></div>
            <div class="detail-actions">
                <a href="/view/${c.id}" target="_blank">View file</a>
                <a href="/download/${c.id}">Download</a>
            </div>
            <a href="#certificates" class="back">&larr; Back to certificates</a>
        </div>
    `;
}

// Picks a view based on the URL hash. Runs on load and on every hash change.
function router() {
    hideTooltip();
    const hash = location.hash;

    if (hash.startsWith("#certificate/")) {
        renderDetail(hash.split("/")[1]);
        setActiveNav("#certificates");
    } else if (hash === "#certificates") {
        renderList();
        setActiveNav("#certificates");
    } else {
        renderUpload();
        setActiveNav("#upload");
    }
}

// Highlights the nav link for the view currently shown.
function setActiveNav(route) {
    document.querySelectorAll("#topbar nav a").forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === route);
    });
}

window.addEventListener("hashchange", router);
router();
