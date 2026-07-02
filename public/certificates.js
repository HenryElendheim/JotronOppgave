async function loadCertificates() {
    // Filtering variables
    const number = document.querySelector("#search-number").value;
    const type = document.querySelector("#filter-type").value;

    // The URLSearchParams() is a built in helper function which does the URL stuff for me
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
        tbody.appendChild(row);
    }
}

document.querySelector("#search-number").addEventListener("input", loadCertificates);
document.querySelector("#filter-type").addEventListener("change", loadCertificates);

loadCertificates();