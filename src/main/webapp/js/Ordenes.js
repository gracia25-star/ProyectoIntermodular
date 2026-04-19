/* ===== JS ÓRDENES DE COMPRA ===== */

// ── Mostrar nombre del archivo seleccionado ──────────────────
const inputPdf     = document.getElementById('orden-pdf');
const fileLabel    = document.querySelector('.file-label');
const fileLabelTxt = document.getElementById('file-name-label');

inputPdf.addEventListener('change', function () {
    if (this.files && this.files.length > 0) {
        fileLabelTxt.textContent = this.files[0].name;
        fileLabel.classList.add('has-file');
    } else {
        fileLabelTxt.textContent = 'Seleccionar archivo…';
        fileLabel.classList.remove('has-file');
    }
});

// ── Generar número de referencia correlativo ─────────────────
function generarReferencia() {
    const filas = document.querySelectorAll('#ordenes-tbody tr').length;
    const num   = String(filas + 1).padStart(3, '0');
    const anyo  = new Date().getFullYear();
    return `ORD-${anyo}-${num}`;
}

// ── Formatear fecha de yyyy-mm-dd a dd/mm/yyyy ───────────────
function formatFecha(val) {
    if (!val) return '—';
    const [y, m, d] = val.split('-');
    return `${d}/${m}/${y}`;
}

// ── Formatear importe ────────────────────────────────────────
function formatImporte(val) {
    const num = parseFloat(val);
    if (isNaN(num)) return '—';
    return num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

// ── Crear orden ──────────────────────────────────────────────
function crearOrden() {
    const fecha       = document.getElementById('orden-fecha').value;
    const provSelect  = document.getElementById('orden-proveedor');
    const proveedor   = provSelect.options[provSelect.selectedIndex]?.text || '';
    const importe     = document.getElementById('orden-importe').value;
    const descripcion = document.getElementById('orden-descripcion').value.trim();
    const archivo     = inputPdf.files[0] || null;

    // Validación básica
    if (!fecha || !proveedor || provSelect.value === '' || !importe || !descripcion) {
        alert('Por favor, completa todos los campos obligatorios.');
        return;
    }

    // Celda PDF
    let pdfCelda = `<span class="no-pdf">—</span>`;
    if (archivo) {
        const url = URL.createObjectURL(archivo);
        pdfCelda = `
            <a href="${url}" target="_blank" class="pdf-link" title="${archivo.name}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" class="pdf-icon">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>PDF
            </a>`;
    }

    // Construir fila
    const tbody = document.getElementById('ordenes-tbody');
    const tr    = document.createElement('tr');
    tr.innerHTML = `
        <td class="ref-cell">${generarReferencia()}</td>
        <td>${formatFecha(fecha)}</td>
        <td>${proveedor}</td>
        <td class="importe-cell">${formatImporte(importe)}</td>
        <td><span class="status-badge status-orange">Pendiente</span></td>
        <td>${pdfCelda}</td>
        <td><button class="notas-btn has-nota" onclick="abrirNotas(this)"
            data-desc="${descripcion.replace(/"/g, '&quot;')}"
            data-obs="">💬</button></td>
    `;

    tbody.prepend(tr);

    // Limpiar formulario
    document.getElementById('orden-fecha').value       = '';
    document.getElementById('orden-proveedor').value   = '';
    document.getElementById('orden-importe').value     = '';
    document.getElementById('orden-descripcion').value = '';
    inputPdf.value = '';
    fileLabelTxt.textContent = 'Seleccionar archivo…';
    fileLabel.classList.remove('has-file');
}

// ── Popup de notas (solo lectura para el jefe) ───────────────
function abrirNotas(btn) {
    const desc = btn.getAttribute('data-desc') || '(Sin descripción)';
    const obs  = btn.getAttribute('data-obs')  || '';

    document.getElementById('notas-desc').textContent = desc;
    const obsEl = document.getElementById('notas-obs');
    obsEl.textContent = obs || '(Sin observaciones del administrador)';
    obsEl.classList.toggle('notas-obs-vacia', !obs);

    document.getElementById('notas-overlay').style.display = 'flex';
}

function cerrarNotas(event) {
    if (event.target === document.getElementById('notas-overlay')) {
        document.getElementById('notas-overlay').style.display = 'none';
    }
}

function cerrarNotasBtn() {
    document.getElementById('notas-overlay').style.display = 'none';
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.getElementById('notas-overlay').style.display = 'none';
});
