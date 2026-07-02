const view = document.querySelector("#view");
const tooltip = document.querySelector("#row-tooltip");

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

function isRowTruncated(row) {
    const cells = row.querySelectorAll("td");
    return [...cells].some((td) => td.scrollWidth > td.clientWidth);
}

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
            <input type="number" name="number" required />

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

function renderList() {
    view.innerHTML = `
        <h1>All certificates</h1>
        <div id="controls">
            <input type="text" id="search-number" placeholder="Search by number" />
            <select id="filter-type">
                <option value="">All types</option>
                <option value="Declaration of conformity">Declaration of conformity</option>
                <option value="Green passport">Green passport</option>
                <option value="Type approval">Type approval</option>
                <option value="Product certificate">Product certificate</option>
            </select>
        </div>
        <table id="cert-table">
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Number</th>
                    <th>Notified body</th>
                    <th>Date of issue</th>
                    <th>Expiry date</th>
                    <th>File</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;

    document.querySelector("#search-number").addEventListener("input", loadCertificates);
    document.querySelector("#filter-type").addEventListener("change", loadCertificates);

    loadCertificates();
}

async function loadCertificates() {
    const number = document.querySelector("#search-number").value;
    const type = document.querySelector("#filter-type").value;

    const params = new URLSearchParams();
    if (number) params.set("number", number);
    if (type) params.set("type", type);

    const res = await fetch("/api/certificates?" + params.toString());
    const certs = await res.json();

    const tbody = document.querySelector("#cert-table tbody");
    tbody.innerHTML = "";

    for (const c of certs) {
        const row = document.createElement("tr");
        row.innerHTML = `
        <td>${c.type}</td>
        <td>${c.number}</td>
        <td>${c.notified_body ?? ""}</td>
        <td>${c.date_of_issue ?? ""}</td>
        <td>${c.expiry_date ?? ""}</td>
        <td><a href="/download/${c.id}">Download</a></td>
    `;

        row.addEventListener("mouseenter", () => {
            if (isRowTruncated(row)) showTooltip(c);
        });
        row.addEventListener("mousemove", moveTooltip);
        row.addEventListener("mouseleave", hideTooltip);

        // Viewing each certificate on their own
        row.addEventListener("click", () => {
            location.hash = "#certificate/" + c.id;
        });
        row.querySelector("a").addEventListener("click", (event) => event.stopPropagation());

        tbody.appendChild(row);
    }
}

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

function setActiveNav(route) {
    document.querySelectorAll("#topbar nav a").forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === route);
    });
}

window.addEventListener("hashchange", router);
router();