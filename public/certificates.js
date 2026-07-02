async function loadCertificates() {
    const res = await fetch("/api/certificates");
    const certs = await res.json();

    const tbody = document.querySelector("#cert-table tbody");

    for (const c of certs) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${c.type}</td>
            <td>${c.number}</td>
            <td>${c.notified_body}</td>
            <td>${c.date_of_issue}</td>
            <td>${c.expiry_date}</td>
            <td><a href="/download/${c.id}">Download</a></td>
        `;
        tbody.appendChild(row);
    }
}

loadCertificates();