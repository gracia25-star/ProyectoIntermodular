/* ===== JS ÓRDENES ADMIN ===== */

let _btnActivo  = null;
let _deptActual = 0;
// Mapa codeOrder → datos completos de la orden (evita poner texto en atributos HTML)
const ordenesMapa = {};

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
    tbody.innerHTML = '<tr><td colspan="7" class="tabla-vacia-admin">Cargando...</td></tr>';

    try {
        const url = deptCode > 0 ? `AdminOrderServlet?dept=${deptCode}` : 'AdminOrderServlet';
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const ordenes = await res.json();
        if (ordenes.error) throw new Error(ordenes.error);

        // Guardar en mapa para acceso seguro desde el modal
        ordenes.forEach(o => { ordenesMapa[o.codeOrder] = o; });

        if (!ordenes.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="tabla-vacia-admin">No hay órdenes para este departamento</td></tr>';
            document.getElementById('filtro-total').textContent = '0 órdenes';
            return;
        }

        tbody.innerHTML = ordenes.map(o => buildFila(o)).join('');
        document.getElementById('filtro-total').textContent =
            `${ordenes.length} orden${ordenes.length !== 1 ? 'es' : ''}`;

    } catch (err) {
        console.error('Error cargando órdenes:', err);
        tbody.innerHTML = `<tr><td colspan="7" class="tabla-vacia-admin">Error: ${err.message}</td></tr>`;
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
    const tieneNota = o.comment && o.comment.trim().length > 0;

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
            <td>
                <button class="notas-btn ${tieneNota ? 'has-nota' : ''}"
                        onclick="abrirNotasAdmin(this)"
                        data-code-order="${o.codeOrder}">💬</button>
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

// ── Cerrar modal ──────────────────────────────────────────────
function cerrarModalAdmin(event) {
    if (event.target === document.getElementById('modal-overlay')) _cerrarModal();
}
function cerrarModalBtn() { _cerrarModal(); }
function _cerrarModal() {
    document.getElementById('modal-overlay').classList.remove('visible');
    _btnActivo = null;
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') _cerrarModal(); });

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
