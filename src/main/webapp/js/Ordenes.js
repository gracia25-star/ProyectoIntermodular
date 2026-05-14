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

// ── Formatear importe ────────────────────────────────────────
function formatImporte(val) {
    const num = parseFloat(val);
    if (isNaN(num)) return '—';
    return num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

// ── Cargar proveedores del usuario en el select ───────────────
async function cargarProveedores() {
    try {
        const res = await fetch('SupplierServlet');
        if (!res.ok) throw new Error();
        const suppliers = await res.json();

        const select = document.getElementById('orden-proveedor');
        select.innerHTML = '<option value="" disabled selected>Selecciona un proveedor…</option>';
        suppliers.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.idSupplier;
            opt.textContent = s.name;
            select.appendChild(opt);
        });
    } catch {
        // conserva las opciones de ejemplo del HTML
    }
}

// ── Cargar órdenes del usuario desde la BD ───────────────────
async function cargarOrdenes() {
    try {
        const res = await fetch('PurchaseOrderServlet');
        if (!res.ok) throw new Error();
        const orders = await res.json();
        renderOrdenes(orders);
    } catch {
        // conserva las filas de ejemplo del HTML
    }
}

function renderOrdenes(orders) {
    const tbody = document.getElementById('ordenes-tbody');
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:24px;">' +
            'No tienes órdenes de compra todavía.</td></tr>';
        return;
    }

    orders.forEach(o => {
        const statusCls = o.status === 'approved' ? 'status-green' : 'status-orange';
        const statusTxt = o.status === 'approved' ? 'Aprobada'    : 'Pendiente';

        const pdfCelda = o.hasInvoice
            ? `<a href="InvoiceServlet?order=${o.codeOrder}" target="_blank" class="pdf-link">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round" class="pdf-icon">
                       <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                       <polyline points="14 2 14 8 20 8"></polyline>
                   </svg>PDF</a>`
            : '<span class="no-pdf">—</span>';

        const hasNota = o.description || o.comment;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="ref-cell">${o.orderReference ?? '—'}</td>
            <td>${o.date}</td>
            <td>${o.supplierName}</td>
            <td class="importe-cell">${formatImporte(o.amount)}</td>
            <td><span class="status-badge ${statusCls}">${statusTxt}</span></td>
            <td>${pdfCelda}</td>
            <td><button class="notas-btn ${hasNota ? 'has-nota' : ''}"
                    onclick="abrirNotas(this)"
                    data-desc="${(o.description || '').replace(/"/g, '&quot;')}"
                    data-obs="${(o.comment || '').replace(/"/g, '&quot;')}">💬</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// ── Validar formulario principal ─────────────────────────────
function validarFormulario() {
    const provSelect = document.getElementById('orden-proveedor');
    const importe    = document.getElementById('orden-importe').value;
    const desc       = document.getElementById('orden-descripcion').value.trim();

    if (provSelect.value === '' || !importe || !desc) {
        alert('Por favor, completa Proveedor, Importe y Descripción antes de continuar.');
        return false;
    }
    return true;
}

// ── Botón principal: código → Plan Inversión / vacío → popup ─
function abrirTipoPopup() {
    if (!validarFormulario()) return;

    const codigo = document.getElementById('orden-codigo').value.trim();

    if (codigo !== '') {
        if (!/^\d{7}$/.test(codigo)) {
            alert('El código del Plan de Inversión debe tener exactamente 7 dígitos numéricos.');
            return;
        }
        crearOrden(null, true, codigo);
    } else {
        document.querySelectorAll('input[name="orden-tipo"]').forEach(r => r.checked = false);
        document.getElementById('tipo-overlay').style.display = 'flex';
    }
}

function cerrarTipoPopup(event) {
    if (event.target === document.getElementById('tipo-overlay')) {
        document.getElementById('tipo-overlay').style.display = 'none';
    }
}

function cerrarTipoPopupBtn() {
    document.getElementById('tipo-overlay').style.display = 'none';
}

function confirmarTipoYCrear() {
    const tipoRadio = document.querySelector('input[name="orden-tipo"]:checked');
    if (!tipoRadio) {
        alert('Selecciona si el artículo es Inventariable o Fungible.');
        return;
    }
    document.getElementById('tipo-overlay').style.display = 'none';
    crearOrden(tipoRadio.value, false, null);
}

// ── Crear orden → fetch POST al servlet ──────────────────────
// tipo:           '0' inventariable | '1' fungible | null si Plan Inversión
// esPlanInversion: true → codigoManual es el nº de orden
function crearOrden(tipo, esPlanInversion, codigoManual) {
    const provSelect  = document.getElementById('orden-proveedor');
    const importe     = document.getElementById('orden-importe').value;
    const descripcion = document.getElementById('orden-descripcion').value.trim();
    const archivo     = inputPdf.files[0] || null;

    const formData = new FormData();
    formData.append('idProveedor',    provSelect.value);
    formData.append('importe',        importe);
    formData.append('descripcion',    descripcion);
    formData.append('esPlanInversion', esPlanInversion ? 'true' : 'false');
    if (esPlanInversion) {
        formData.append('codigoManual', codigoManual);
    } else {
        formData.append('tipo', tipo);
    }
    if (archivo) {
        formData.append('factura', archivo);
    }

    // Bloquear botón mientras se guarda
    const btn = document.querySelector('[onclick="abrirTipoPopup()"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; }

    fetch('PurchaseOrderServlet', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(result => {
            if (result.ok) {
                limpiarFormulario();
                cargarOrdenes();
            } else {
                alert('Error al guardar la orden:\n' + result.error);
            }
        })
        .catch(() => alert('Error de conexión. Comprueba que el servidor está en marcha.'))
        .finally(() => {
            if (btn) { btn.disabled = false; btn.textContent = '+ Crear Orden de Compra'; }
        });
}

// ── Limpiar formulario tras crear ────────────────────────────
function limpiarFormulario() {
    document.getElementById('orden-codigo').value      = '';
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

    const tipoSec = document.getElementById('notas-tipo-seccion');
    if (tipoSec) tipoSec.style.display = 'none';

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
    if (e.key === 'Escape') {
        document.getElementById('notas-overlay').style.display = 'none';
        document.getElementById('tipo-overlay').style.display  = 'none';
    }
});

// ── Inicialización ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    cargarProveedores();
    cargarOrdenes();
});
