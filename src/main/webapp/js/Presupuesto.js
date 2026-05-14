/* ===== JS PRESUPUESTOS ===== */

// ── Marcar nav activo ────────────────────────────────────────
document.querySelectorAll('.top-nav-btn').forEach(btn => {
    if (btn.textContent.trim() === 'Presupuestos') {
        btn.classList.add('active-nav');
    }
});

// ── Rol del usuario ──────────────────────────────────────────
const rol = sessionStorage.getItem('rol');
const nombreEl = document.getElementById('rolUsuario');
if (nombreEl) nombreEl.textContent = rol || 'Usuario';

// ── Año actual ───────────────────────────────────────────────
const anioEl = document.getElementById('anioActual');
if (anioEl) anioEl.textContent = new Date().getFullYear();

// ── Bloquear botones si es contable ─────────────────────────
if (rol === 'accountant') {
    document.querySelectorAll('button').forEach(btn => btn.disabled = true);
}

// ── Cargar presupuestos del usuario (desde servlet) ──────────
async function cargarPresupuestos() {
    try {
        const res = await fetch('BudgetServlet');
        if (!res.ok) throw new Error('sin servlet');
        const data = await res.json();
        renderTablaPresupuestos(data);
        renderResumen(data);
    } catch {
        // datos de ejemplo mientras no hay servlet
    }
}

function renderTablaPresupuestos(presupuestos) {
    const tbody = document.getElementById('presupuestos-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    presupuestos.forEach(p => {
        const gastado = p.gastado ?? 0;
        const restante = p.totalAmount - gastado;
        const tipo = p.type === 1 ? '<span class="tipo-badge tipo-general">General</span>'
                                   : '<span class="tipo-badge tipo-inversion">Inversión</span>';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.idBudget}</td>
            <td>${p.deptName ?? '—'}</td>
            <td>${p.year}</td>
            <td>${tipo}</td>
            <td>${formatEuros(p.totalAmount)}</td>
            <td>${formatEuros(gastado)}</td>
            <td>${formatEuros(restante)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderResumen(presupuestos) {
    let totalAsignado = 0, totalGastado = 0;
    presupuestos.forEach(p => {
        totalAsignado += parseFloat(p.totalAmount ?? 0);
        totalGastado  += parseFloat(p.gastado ?? 0);
    });
    const restante = totalAsignado - totalGastado;
    setTexto('resumen-asignado', formatEuros(totalAsignado));
    setTexto('resumen-gastado', formatEuros(totalGastado));
    setTexto('resumen-restante', formatEuros(restante));
}

// ── Guardar presupuesto (Admin) ──────────────────────────────
function guardarPresupuesto(event) {
    if (event) event.preventDefault();
    const form = document.getElementById('form-presupuesto');
    if (!form) return;
    const data = new FormData(form);
    fetch('BudgetServlet', { method: 'POST', body: data })
        .then(r => r.ok ? cargarPresupuestos() : Promise.reject())
        .catch(() => alert('Error al guardar el presupuesto.'));
}

// ── Guardar plan de inversión ────────────────────────────────
function guardarPlanInversion(event) {
    if (event) event.preventDefault();
    const codigo = document.getElementById('plan-codigo')?.value?.trim();
    if (!codigo || !/^\d{7}$/.test(codigo)) {
        alert('El código del Plan de Inversión debe tener exactamente 7 dígitos.');
        return;
    }
    const form = document.getElementById('form-plan');
    if (!form) return;
    const data = new FormData(form);
    fetch('PlanInversionServlet', { method: 'POST', body: data })
        .then(r => r.ok ? cargarPresupuestos() : Promise.reject())
        .catch(() => alert('Error al guardar el plan de inversión.'));
}

// ── Utilidades ───────────────────────────────────────────────
function formatEuros(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return '—';
    return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

function setTexto(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
}

// ── Transiciones suaves entre páginas ───────────────────────
document.addEventListener('DOMContentLoaded', () => {
    cargarPresupuestos();

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
