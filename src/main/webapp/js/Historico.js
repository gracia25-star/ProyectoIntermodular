/* ===== JS HISTÓRICO ===== */

// ── Marcar nav activo ────────────────────────────────────────
document.querySelectorAll('.top-nav-btn').forEach(btn => {
    if (btn.textContent.trim() === 'Histórico') {
        btn.classList.add('active-nav');
    }
});

// ── Rol del usuario ──────────────────────────────────────────
const rol = sessionStorage.getItem('rol');
const nombreEl = document.getElementById('rolUsuario');
if (nombreEl) nombreEl.textContent = rol || 'Usuario';

// ── Poblar selector de años (5 años atrás hasta el actual) ──
function poblarSelectorAños() {
    const select = document.getElementById('select-anio');
    if (!select) return;
    const actual = new Date().getFullYear();
    select.innerHTML = '';
    for (let y = actual; y >= actual - 5; y--) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        select.appendChild(opt);
    }
    select.addEventListener('change', () => cargarHistorico(parseInt(select.value)));
    cargarHistorico(actual);
}

// ── Cargar histórico de un año ───────────────────────────────
async function cargarHistorico(year) {
    try {
        const res = await fetch(`HistoricoServlet?year=${year}`);
        if (!res.ok) throw new Error('sin servlet');
        const data = await res.json();
        renderResumen(data.resumen ?? {});
        renderTablaPresupuestos(data.presupuestos ?? []);
        renderTablaOrdenes(data.ordenes ?? []);
        renderTablaPlanesInversion(data.planes ?? []);
    } catch {
        // la tabla conserva los datos de ejemplo del HTML
    }
}

// ── Resumen del año ──────────────────────────────────────────
function renderResumen(r) {
    setTexto('hist-asignado', formatEuros(r.totalAsignado));
    setTexto('hist-gastado',  formatEuros(r.totalGastado));
    setTexto('hist-restante', formatEuros((r.totalAsignado ?? 0) - (r.totalGastado ?? 0)));
}

// ── Tabla de presupuestos históricos ─────────────────────────
function renderTablaPresupuestos(lista) {
    const tbody = document.getElementById('hist-presupuestos-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="tabla-vacia">Sin datos para este año.</td></tr>';
        return;
    }

    lista.forEach(p => {
        const restante = p.totalAmount - (p.gastado ?? 0);
        const estadoCls = restante > 0 ? 'estado-abierto' : 'estado-cerrado';
        const estadoTxt = restante > 0 ? 'Abierto' : 'Cerrado';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.deptName ?? '—'}</td>
            <td>${formatEuros(p.totalAmount)}</td>
            <td>${formatEuros(p.gastado ?? 0)}</td>
            <td>${formatEuros(restante)}</td>
            <td class="${estadoCls}">${estadoTxt}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ── Tabla de órdenes históricas ──────────────────────────────
function renderTablaOrdenes(lista) {
    const tbody = document.getElementById('hist-ordenes-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="tabla-vacia">Sin órdenes para este año.</td></tr>';
        return;
    }

    lista.forEach(o => {
        const estadoCls = o.status === 'approved' ? 'aprobada' : 'pendiente';
        const estadoTxt = o.status === 'approved' ? 'Aprobada' : 'Pendiente';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="ref-cell">${o.codeOrder}</td>
            <td>${formatFecha(o.date)}</td>
            <td>${o.supplierName ?? '—'}</td>
            <td>${formatEuros(o.amount)}</td>
            <td><span class="status-badge ${estadoCls}">${estadoTxt}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// ── Tabla de planes de inversión históricos ───────────────────
function renderTablaPlanesInversion(lista) {
    const tbody = document.getElementById('hist-planes-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="tabla-vacia">Sin planes de inversión para este año.</td></tr>';
        return;
    }

    lista.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="ref-cell">${p.idBudget}</td>
            <td>${p.deptName ?? '—'}</td>
            <td>${formatEuros(p.totalAmount)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ── Utilidades ───────────────────────────────────────────────
function formatEuros(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return '—';
    return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function formatFecha(val) {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString('es-ES');
}

function setTexto(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
}

// ── Transiciones suaves entre páginas ───────────────────────
document.addEventListener('DOMContentLoaded', () => {
    poblarSelectorAños();

    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', e => {
            if (link.target === '_blank' || e.ctrlKey || e.metaKey) return;
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
            e.preventDefault();
            document.body.classList.add('fade-out');
            setTimeout(() => { window.location.href = link.href; }, 300);
        });
    });
});
