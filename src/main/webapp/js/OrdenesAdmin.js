/* ===== JS ÓRDENES ADMIN ===== */

// ── Leer parámetro ?depto=XXX de la URL y aplicar filtro ─────
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const depto  = params.get('depto');
    if (depto) {
        const select = document.getElementById('filtro-depto');
        if (select) {
            select.value = depto;
            filtrarDepto(); // aplica el filtro automáticamente
        }
    }
});

// ── Referencia al botón y fila activos ────────────────────────
let _btnActivo  = null;
let _filaActiva = null;

// ── Filtro por departamento ───────────────────────────────────
function filtrarDepto() {
    const val    = document.getElementById('filtro-depto').value;
    const filas  = document.querySelectorAll('#ordenes-admin-tbody tr');
    const titulo = document.getElementById('tabla-titulo');
    const total  = document.getElementById('filtro-total');
    let visibles = 0;

    filas.forEach(tr => {
        const depto = tr.getAttribute('data-depto');
        if (val === 'todos' || depto === val) {
            tr.classList.remove('oculta');
            visibles++;
        } else {
            tr.classList.add('oculta');
        }
    });

    if (val === 'todos') {
        titulo.textContent = 'Todas las Órdenes';
        total.textContent  = `Mostrando todas las órdenes (${visibles})`;
    } else {
        const texto = document.getElementById('filtro-depto').options[
            document.getElementById('filtro-depto').selectedIndex
        ].text;
        titulo.textContent = `Órdenes — ${texto}`;
        total.textContent  = `${visibles} orden${visibles !== 1 ? 'es' : ''}`;
    }
}

// ── Cambiar color del select según estado ─────────────────────
function cambiarEstado(select) {
    select.classList.remove('estado-green', 'estado-orange', 'estado-red');
    const map = { aprobada: 'estado-green', pendiente: 'estado-orange', rechazada: 'estado-red' };
    select.classList.add(map[select.value] || 'estado-orange');
    // En producción: PATCH /api/ordenes/{ref}/estado
}

// ── Abrir modal ───────────────────────────────────────────────
function abrirNotasAdmin(btn) {
    _btnActivo  = btn;
    _filaActiva = btn.closest('tr');

    const desc = btn.getAttribute('data-desc') || '(Sin descripción)';
    const obs  = btn.getAttribute('data-obs')  || '';
    const ref  = _filaActiva?.querySelector('.ref-cell')?.textContent || '';

    document.getElementById('modal-ref').textContent  = ref;
    document.getElementById('modal-desc').textContent = desc;
    document.getElementById('modal-obs').value        = obs;

    // Renderizar zona PDF según si la fila ya tiene enlace o no
    renderizarZonaPdf();

    document.getElementById('modal-overlay').classList.add('visible');
    document.getElementById('modal-obs').focus();
}

// ── Renderizar la zona PDF del modal ──────────────────────────
function renderizarZonaPdf() {
    const zona = document.getElementById('modal-pdf-zona');
    if (!_filaActiva) return;

    const pdfLink = _filaActiva.querySelector('.pdf-link');

    if (pdfLink) {
        // Hay PDF: mostrar enlace + botón eliminar
        zona.innerHTML = `
            <div class="pdf-admin-row">
                <a href="${pdfLink.href}" target="_blank" class="pdf-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round" class="pdf-icon">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    ${pdfLink.title || 'Ver factura'}
                </a>
                <button class="pdf-quitar-btn" onclick="quitarPdf()" title="Eliminar PDF">✕ Quitar</button>
            </div>`;
    } else {
        // No hay PDF: mostrar botón de subir
        zona.innerHTML = `
            <label class="file-label pdf-subir-label" for="modal-pdf-input">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" class="file-icon">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Subir factura PDF…
            </label>`;
        // Limpiar el input por si había archivo anterior
        document.getElementById('modal-pdf-input').value = '';
    }
}

// ── Subir PDF desde el modal ──────────────────────────────────
function subirPdfAdmin(input) {
    if (!input.files || !input.files[0] || !_filaActiva) return;
    const archivo = input.files[0];
    const url     = URL.createObjectURL(archivo);

    // Actualizar la celda de Factura en la fila de la tabla
    const celdaFactura = _filaActiva.querySelector('td:nth-child(7)');
    if (celdaFactura) {
        celdaFactura.innerHTML = `
            <a href="${url}" target="_blank" class="pdf-link" title="${archivo.name}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" class="pdf-icon">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>PDF
            </a>`;
    }

    // Refrescar la zona del modal
    renderizarZonaPdf();

    // En producción: subir el archivo al back con FormData
    // const fd = new FormData(); fd.append('factura', archivo);
    // await fetch('/api/ordenes/{ref}/factura', { method: 'POST', body: fd });
}

// ── Quitar PDF ────────────────────────────────────────────────
function quitarPdf() {
    if (!_filaActiva) return;

    if (!confirm('¿Seguro que quieres eliminar la factura de esta orden?')) return;

    // Limpiar la celda de Factura en la tabla
    const celdaFactura = _filaActiva.querySelector('td:nth-child(7)');
    if (celdaFactura) {
        celdaFactura.innerHTML = `<span class="no-pdf">—</span>`;
    }

    // Refrescar zona modal
    renderizarZonaPdf();

    // En producción: DELETE /api/ordenes/{ref}/factura
}

// ── Guardar observaciones ─────────────────────────────────────
function guardarObservaciones() {
    if (!_btnActivo) return;

    const nuevaObs = document.getElementById('modal-obs').value.trim();
    _btnActivo.setAttribute('data-obs', nuevaObs);

    const btn = document.querySelector('.modal-footer .submit-btn');
    const textoOriginal = btn.textContent;
    btn.textContent = '✓ Guardado';
    btn.style.background = '#16a34a';
    setTimeout(() => {
        btn.textContent = textoOriginal;
        btn.style.background = '';
        _cerrarModal();
    }, 900);

    // En producción: PATCH /api/ordenes/{ref}/observaciones
}

// ── Cerrar modal ──────────────────────────────────────────────
function cerrarModalAdmin(event) {
    if (event.target === document.getElementById('modal-overlay')) _cerrarModal();
}

function cerrarModalBtn() { _cerrarModal(); }

function _cerrarModal() {
    document.getElementById('modal-overlay').classList.remove('visible');
    _btnActivo  = null;
    _filaActiva = null;
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') _cerrarModal(); });
