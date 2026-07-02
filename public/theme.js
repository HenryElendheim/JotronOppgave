// Light/dark theme switching. The active theme is a data attribute on
// <html>; style.css swaps its color variables based on it. The choice is
// saved in localStorage so it survives reloads.

const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);

function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
}

document.querySelector("#theme-toggle").addEventListener("click", toggleTheme);
