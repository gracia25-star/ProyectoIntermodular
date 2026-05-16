/* ===== JS ÓRDENES ADMIN ===== */

let _btnActivo  = null;
let _deptActual = 0;
// Mapa codeOrder → datos completos de la orden (evita poner texto en atributos HTML)
const ordenesMapa = {};

const svgPdf = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round" width="14" height="14" style="flex-shrink:0">
     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
     <polyline points="14 2 14 8 20 8"/>
     <line x1="16" y1="13" x2="8" y2="13"/>
     <line x1="16" y1="17" x2="8" y2="17"/>
     <line x1="10" y1="9" x2="8" y2="9"/>
</svg>`;

// ── Al cargar: poblar departamentos y cargar órdenes ──────────
document.addEventListener('DOMContentLoaded', () => {
    poblarDepartamentos();

    // Si viene ?depto=N desde el menú admin, preseleccionar por nombre
    const params = new URLSearchParams(window.location.search);
    const deptParam = params.get('depto');
    if (deptParam) window._deptPreselect = deptParam;
});

// ── Poblar select de departamentos desde el servidor ─────────
function poblarDepartamentos() {
    fetch('DepartmentServlet')
        .then(r => r.json())
        .then(depts => {
            const select = document.getElementById('filtro-depto');
            select.innerHTML = '<option value="0">Todos los departamentos</option>';
            depts.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.codeDept;
                opt.textContent = d.name;
                select.appendChild(opt);
            });

            if (window._deptPreselect) {
                for (const opt of select.options) {
                    if (opt.textContent.toLowerCase().includes(window._deptPreselect.toLowerCase())) {
                        select.value = opt.value;
                        break;
                    }
                }
                delete window._deptPreselect;
            }

            cargarOrdenes(parseInt(select.value) || 0);
        })
        .catch(() => cargarOrdenes(0));
}

// ── Filtrar por departamento ──────────────────────────────────
function filtrarDepto() {
    const select = document.getElementById('filtro-depto');
    _deptActual = parseInt(select.value) || 0;
    document.getElementById('tabla-titulo').textContent = _deptActual === 0
        ? 'Todas las Órdenes'
        : 'Órdenes — ' + select.options[select.selectedIndex].text;
    cargarOrdenes(_deptActual);
}

// ── Cargar órdenes desde el servidor ─────────────────────────
async function cargarOrdenes(deptCode) {
    const tbody = document.getElementById('ordenes-admin-tbody');
    tbody.innerHTML = '<tr><td colspan="8" class="tabla-vacia-admin">Cargando...</td></tr>';

    try {
        const url = deptCode > 0 ? `AdminOrderServlet?dept=${deptCode}` : 'AdminOrderServlet';
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const ordenes = await res.json();
        if (ordenes.error) throw new Error(ordenes.error);

        // Guardar en mapa para acceso seguro desde el modal
        ordenes.forEach(o => { ordenesMapa[o.codeOrder] = o; });

        if (!ordenes.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="tabla-vacia-admin">No hay órdenes para este departamento</td></tr>';
            document.getElementById('filtro-total').textContent = '0 órdenes';
            return;
        }

        tbody.innerHTML = ordenes.map(o => buildFila(o)).join('');
        document.getElementById('filtro-total').textContent =
            `${ordenes.length} orden${ordenes.length !== 1 ? 'es' : ''}`;

    } catch (err) {
        console.error('Error cargando órdenes:', err);
        tbody.innerHTML = `<tr><td colspan="8" class="tabla-vacia-admin">Error: ${err.message}</td></tr>`;
    }
}

// ── Clase CSS según estado ────────────────────────────────────
function claseEstado(status) {
    if (status === 'approved') return 'estado-green';
    if (status === 'rejected') return 'estado-red';
    return 'estado-orange';
}

// ── Construir fila HTML — datos complejos NO van en atributos ─
function buildFila(o) {
    const tieneNota   = o.comment && o.comment.trim().length > 0;
    const invCount    = o.invoiceCount || 0;
    const facturaCell = invCount > 0
        ? `<button class="inv-badge-btn" onclick="verFacturasAdmin(${o.codeOrder})"
                   title="Ver ${invCount} factura${invCount > 1 ? 's' : ''}">
               ${svgPdf} ${invCount}
           </button>`
        : '<span class="no-pdf">—</span>';

    return `
        <tr>
            <td class="ref-cell">${esc(o.orderReference)}</td>
            <td><span class="depto-badge">${esc(o.deptName)}</span></td>
            <td>${esc(o.date)}</td>
            <td>${esc(o.supplierName)}</td>
            <td class="importe-cell">${formatEuros(o.amount)}</td>
            <td>
                <select class="estado-select ${claseEstado(o.status)}"
                        data-code-order="${o.codeOrder}"
                        onchange="cambiarEstado(this)">
                    <option value="pending"  ${o.status === 'pending'  ? 'selected' : ''}>Pendiente</option>
                    <option value="approved" ${o.status === 'approved' ? 'selected' : ''}>Aprobada</option>
                    <option value="rejected" ${o.status === 'rejected' ? 'selected' : ''}>Rechazada</option>
                </select>
            </td>
            <td>${facturaCell}</td>
            <td>
                <button class="notas-btn ${tieneNota ? 'has-nota' : ''}"
                        onclick="abrirNotasAdmin(this)"
                        data-code-order="${o.codeOrder}">&#128172;</button>
            </td>
        </tr>`;
}

// ── Cambiar estado → guardar en BD inmediatamente ─────────────
async function cambiarEstado(select) {
    const codeOrder = select.getAttribute('data-code-order');
    const newStatus = select.value;

    select.className = 'estado-select ' + claseEstado(newStatus);

    try {
        const res  = await fetch('AdminOrderServlet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=status&codeOrder=${encodeURIComponent(codeOrder)}&value=${encodeURIComponent(newStatus)}`
        });
        const data = await res.json();
        if (!data.ok) console.error('Error actualizando estado:', data.error);
    } catch (err) {
        console.error('Error:', err);
    }
}

// ── Abrir modal — lee datos del mapa, no de atributos HTML ────
function abrirNotasAdmin(btn) {
    _btnActivo = btn;
    const codeOrder = btn.getAttribute('data-code-order');
    const o = ordenesMapa[codeOrder] || {};

    document.getElementById('modal-ref').textContent  = o.orderReference || '';
    document.getElementById('modal-desc').textContent = o.description    || '(Sin descripción)';
    document.getElementById('modal-obs').value        = o.comment        || '';
    document.getElementById('modal-overlay').classList.add('visible');
    document.getElementById('modal-obs').focus();
}

// ── Guardar observaciones → BD ────────────────────────────────
async function guardarObservaciones() {
    if (!_btnActivo) return;
    const codeOrder = _btnActivo.getAttribute('data-code-order');
    const comment   = document.getElementById('modal-obs').value.trim();

    try {
        const res  = await fetch('AdminOrderServlet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=comment&codeOrder=${encodeURIComponent(codeOrder)}&value=${encodeURIComponent(comment)}`
        });
        const data = await res.json();

        if (data.ok) {
            // Actualizar mapa en memoria
            if (ordenesMapa[codeOrder]) ordenesMapa[codeOrder].comment = comment;
            // Actualizar apariencia del botón
            _btnActivo.classList.toggle('has-nota', comment.length > 0);

            const btn = document.querySelector('.modal-footer .submit-btn');
            const orig = btn.textContent;
            btn.textContent = '✓ Guardado';
            btn.style.background = '#16a34a';
            setTimeout(() => {
                btn.textContent = orig;
                btn.style.background = '';
                _cerrarModal();
            }, 900);
        } else {
            alert('Error al guardar: ' + (data.error || 'Error desconocido'));
        }
    } catch (err) {
        console.error('Error guardando observaciones:', err);
        alert('Error de conexión al guardar.');
    }
}

// ── Ver facturas de una orden (popup solo lectura) ────────────
async function verFacturasAdmin(codeOrder) {
    const o = ordenesMapa[codeOrder] || {};
    document.getElementById('facturas-ref').textContent = o.orderReference || '';
    const lista = document.getElementById('facturas-admin-lista');
    lista.innerHTML = '<li class="facturas-empty">Cargando...</li>';
    document.getElementById('facturas-overlay').classList.add('visible');

    try {
        const res = await fetch(`InvoiceServlet?order=${codeOrder}`);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const invoices = await res.json();

        if (!invoices.length) {
            lista.innerHTML = '<li class="facturas-empty">Sin facturas adjuntas.</li>';
            return;
        }
        lista.innerHTML = invoices.map((inv, i) => `
            <li class="facturas-item">
                <a href="InvoiceServlet?invoice=${inv.codeInvoice}" target="_blank" class="pdf-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round" class="pdf-icon">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>Factura ${i + 1}
                </a>
                <span class="facturas-date">${inv.date}</span>
            </li>`).join('');
    } catch {
        lista.innerHTML = '<li class="facturas-empty" style="color:#c70303;">Error al cargar las facturas.</li>';
    }
}

function cerrarFacturasAdmin() {
    document.getElementById('facturas-overlay').classList.remove('visible');
}

// ── Cerrar modal ──────────────────────────────────────────────
function cerrarModalAdmin(event) {
    if (event.target === document.getElementById('modal-overlay')) _cerrarModal();
}
function cerrarModalBtn() { _cerrarModal(); }
function _cerrarModal() {
    document.getElementById('modal-overlay').classList.remove('visible');
    _btnActivo = null;
}
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        _cerrarModal();
        cerrarFacturasAdmin();
    }
});

// ── Utilidades ────────────────────────────────────────────────
function formatEuros(valor) {
    const num = parseFloat(valor) || 0;
    return new Intl.NumberFormat('es-ES', {
        style: 'currency', currency: 'EUR',
        minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(num);
}

function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}
