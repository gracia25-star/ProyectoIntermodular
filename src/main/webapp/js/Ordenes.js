/* ===== JS ÓRDENES DE COMPRA ===== */

// ── Caché de datos ───────────────────────────────────────────
let _suppliers     = [];
let _ordenes       = [];
let _editOrderCode = null;

// ── Mostrar nombre del archivo seleccionado (form principal) ─
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
        _suppliers = suppliers;

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
        const tbody = document.getElementById('ordenes-tbody');
        tbody.innerHTML =
            '<tr><td colspan="7" style="text-align:center;color:#c70303;padding:24px;">' +
            'Error al cargar las órdenes. Comprueba la conexión con el servidor.</td></tr>';
    }
}

function renderOrdenes(orders) {
    _ordenes = orders;
    const tbody = document.getElementById('ordenes-tbody');
    tbody.innerHTML = '';

    if (orders.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="7" style="text-align:center;color:#aaa;padding:24px;">' +
            'No tienes órdenes de compra todavía.</td></tr>';
        return;
    }

    const svgPdf = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round" width="14" height="14" style="flex-shrink:0">
         <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
         <polyline points="14 2 14 8 20 8"/>
         <line x1="16" y1="13" x2="8" y2="13"/>
         <line x1="16" y1="17" x2="8" y2="17"/>
         <line x1="10" y1="9" x2="8" y2="9"/>
    </svg>`;

    orders.forEach(o => {
        let statusCls, statusTxt;
        if (o.status === 'approved')       { statusCls = 'status-green';  statusTxt = 'Aprobada';  }
        else if (o.status === 'rejected')  { statusCls = 'status-red';    statusTxt = 'Rechazada'; }
        else                               { statusCls = 'status-orange'; statusTxt = 'Pendiente'; }

        const invCount = o.invoiceCount || 0;
        const facturasBadge = invCount > 0
            ? `<button class="inv-badge-btn" onclick="abrirEditModal(${o.codeOrder})"
                       title="Ver ${invCount} factura${invCount > 1 ? 's' : ''} adjunta${invCount > 1 ? 's' : ''}">
                   ${svgPdf} ${invCount}
               </button>`
            : '<span class="no-pdf">—</span>';

        const hasNota = o.description || o.comment;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="ref-cell">${o.orderReference ?? '—'}</td>
            <td>${o.date}</td>
            <td>${o.supplierName}</td>
            <td class="importe-cell">${formatImporte(o.amount)}</td>
            <td><span class="status-badge ${statusCls}">${statusTxt}</span></td>
            <td>${facturasBadge}</td>
            <td class="acciones-ord">
                <button class="notas-btn ${hasNota ? 'has-nota' : ''}"
                        onclick="abrirNotas(this)"
                        data-desc="${(o.description || '').replace(/"/g, '&quot;')}"
                        data-obs="${(o.comment || '').replace(/"/g, '&quot;')}"
                        title="Ver notas">&#128172;</button>
                <button class="edit-ord-btn" onclick="abrirEditModal(${o.codeOrder})">Editar</button>
            </td>
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
    if (event.target === document.getElementById('tipo-overlay'))
        document.getElementById('tipo-overlay').style.display = 'none';
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
function crearOrden(tipo, esPlanInversion, codigoManual) {
    const provSelect  = document.getElementById('orden-proveedor');
    const importe     = document.getElementById('orden-importe').value;
    const descripcion = document.getElementById('orden-descripcion').value.trim();
    const archivo     = inputPdf.files[0] || null;

    const formData = new FormData();
    formData.append('idProveedor',     provSelect.value);
    formData.append('importe',         importe);
    formData.append('descripcion',     descripcion);
    formData.append('esPlanInversion', esPlanInversion ? 'true' : 'false');
    if (esPlanInversion) {
        formData.append('codigoManual', codigoManual);
    } else {
        formData.append('tipo', tipo);
    }
    if (archivo) formData.append('factura', archivo);

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
    if (event.target === document.getElementById('notas-overlay'))
        document.getElementById('notas-overlay').style.display = 'none';
}

function cerrarNotasBtn() {
    document.getElementById('notas-overlay').style.display = 'none';
}

// ── Tecla Escape cierra todos los modales ────────────────────
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        ['notas-overlay', 'tipo-overlay', 'edit-overlay'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// ── Modal de editar orden (detalles + facturas) ──────────────
// ═══════════════════════════════════════════════════════════════

function abrirEditModal(codeOrder) {
    _editOrderCode = codeOrder;
    const o = _ordenes.find(x => x.codeOrder === codeOrder);
    if (!o) return;

    document.getElementById('edit-titulo').textContent =
        'Editar Orden · ' + (o.orderReference || '—');

    // Poblar select de proveedores con el actual preseleccionado
    const sel = document.getElementById('edit-proveedor');
    sel.innerHTML = '';
    _suppliers.forEach(s => {
        const opt = new Option(s.name, s.idSupplier);
        if (s.idSupplier == o.idSupplier) opt.selected = true;
        sel.appendChild(opt);
    });

    document.getElementById('edit-importe').value     = o.amount;
    document.getElementById('edit-descripcion').value = o.description || '';
    document.getElementById('edit-pdf-input').value   = '';
    document.getElementById('edit-file-label').textContent = 'Seleccionar PDF…';

    document.getElementById('edit-overlay').style.display = 'flex';
    cargarFacturasEnModal(codeOrder);
}

function cerrarEditModal(event) {
    if (event.target === document.getElementById('edit-overlay'))
        document.getElementById('edit-overlay').style.display = 'none';
}

function cerrarEditModalBtn() {
    document.getElementById('edit-overlay').style.display = 'none';
}

// ── Guardar cambios de la orden ──────────────────────────────
async function guardarEditOrden() {
    const btn = document.getElementById('edit-btn-guardar');
    btn.disabled = true;
    btn.textContent = 'Guardando…';

    const body = new URLSearchParams({
        action:      'update',
        codeOrder:   _editOrderCode,
        idProveedor: document.getElementById('edit-proveedor').value,
        importe:     document.getElementById('edit-importe').value,
        descripcion: document.getElementById('edit-descripcion').value.trim()
    });

    try {
        const res  = await fetch('PurchaseOrderServlet', { method: 'POST', body });
        const data = await res.json();
        if (data.ok) {
            document.getElementById('edit-overlay').style.display = 'none';
            cargarOrdenes();
        } else {
            alert('Error al guardar: ' + (data.error || 'Error desconocido'));
        }
    } catch {
        alert('Error de conexión.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar cambios';
    }
}

// ── Cargar lista de facturas en el modal ─────────────────────
async function cargarFacturasEnModal(codeOrder) {
    const lista = document.getElementById('edit-facturas-lista');
    const label = document.getElementById('edit-facturas-label');
    lista.innerHTML = '<li class="facturas-empty">Cargando…</li>';
    try {
        const res = await fetch(`InvoiceServlet?order=${codeOrder}`);
        if (!res.ok) throw new Error();
        const invoices = await res.json();
        label.textContent = `Facturas (${invoices.length})`;
        if (!invoices.length) {
            lista.innerHTML = '<li class="facturas-empty">Sin facturas adjuntas.</li>';
            return;
        }
        lista.innerHTML = '';
        invoices.forEach((inv, idx) => {
            const li = document.createElement('li');
            li.className = 'facturas-item';
            li.id = `fact-item-${inv.codeInvoice}`;
            li.innerHTML = `
                <a href="InvoiceServlet?invoice=${inv.codeInvoice}" target="_blank" class="pdf-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round" class="pdf-icon">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>Factura ${idx + 1}
                </a>
                <div class="fact-item-actions">
                    <span class="facturas-date">${inv.date}</span>
                    <button class="btn-del-fact" onclick="eliminarFactura(${inv.codeInvoice})">Eliminar</button>
                </div>`;
            lista.appendChild(li);
        });
    } catch {
        lista.innerHTML = '<li class="facturas-empty">Error al cargar facturas.</li>';
    }
}

// ── Eliminar una factura ─────────────────────────────────────
async function eliminarFactura(codeInvoice) {
    if (!confirm('¿Eliminar esta factura? Esta acción no se puede deshacer.')) return;
    try {
        const res  = await fetch(`InvoiceServlet?codeInvoice=${codeInvoice}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.ok) {
            const item = document.getElementById(`fact-item-${codeInvoice}`);
            if (item) item.remove();
            const lista     = document.getElementById('edit-facturas-lista');
            const label     = document.getElementById('edit-facturas-label');
            const remaining = lista.querySelectorAll('.facturas-item').length;
            label.textContent = `Facturas (${remaining})`;
            if (remaining === 0)
                lista.innerHTML = '<li class="facturas-empty">Sin facturas adjuntas.</li>';
            cargarOrdenes();
        } else {
            alert('Error al eliminar la factura.');
        }
    } catch {
        alert('Error de conexión.');
    }
}

// ── Adjuntar nueva factura desde el modal ────────────────────
async function editSubirFactura() {
    const input = document.getElementById('edit-pdf-input');
    if (!input.files || !input.files[0]) {
        alert('Selecciona un archivo PDF.');
        return;
    }
    const btn = document.getElementById('edit-btn-factura');
    btn.disabled = true;
    btn.textContent = 'Subiendo…';

    const formData = new FormData();
    formData.append('codeOrder',   _editOrderCode);
    formData.append('totalAmount', '0');
    formData.append('factura',     input.files[0]);

    try {
        const res  = await fetch('InvoiceServlet', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.ok) {
            input.value = '';
            document.getElementById('edit-file-label').textContent = 'Seleccionar PDF…';
            await cargarFacturasEnModal(_editOrderCode);
            cargarOrdenes();
        } else {
            alert('Error al adjuntar la factura.');
        }
    } catch {
        alert('Error de conexión.');
    } finally {
        btn.disabled = false;
        btn.textContent = '+ Adjuntar factura';
    }
}

// ── Inicialización ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    cargarProveedores();
    cargarOrdenes();

    document.getElementById('edit-pdf-input').addEventListener('change', function () {
        document.getElementById('edit-file-label').textContent =
            this.files && this.files[0] ? this.files[0].name : 'Seleccionar PDF…';
    });
});
