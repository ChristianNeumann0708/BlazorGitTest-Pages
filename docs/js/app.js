console.log('writeRight app gestartet');

const appRoot = document.getElementById('app');

if (appRoot) {
    appRoot.innerHTML = `
        <main class="wr-main">
            <h1>writeRight</h1>
            <p>Vanilla JS Version – Grundgerüst ist da.</p>
        </main>
    `;
} else {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Fehler: #app Container nicht gefunden.';
    }
}
