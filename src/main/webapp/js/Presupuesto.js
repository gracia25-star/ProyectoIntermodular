/* ===== JS PRESUPUESTOS (admin) ===== */

const ANIO = new Date().getFullYear();
document.getElementById('anio-pres').textContent = ANIO;
document.getElementById('anio-plan').textContent = ANIO;

// Marcar nav activo
document.querySelectorAll('.top-nav-btn').forEach(btn => {
    if (btn.textContent.trim() === 'Presupuestos') btn.classList.add('active-nav');
});

// ── Cargar departamentos en ambos selects ────────────────────
function cargarDepartamentos() {
    return fetch('DepartmentServlet')
        .then(r => r.json())
        .then(depts => {
            ['pres-departamento', 'plan-departamento'].forEach(id => {
                const sel = document.getElementById(id);
                depts.forEach(d => {
                    const opt = document.createElement('option');
                    opt.value = d.codeDept;
                    opt.textContent = d.name;
                    sel.appendChild(opt);
                });
            });
        })
        .catch(() => console.error('No se pudieron cargar los departamentos'));
}

// ── Cargar y pintar tablas ───────────────────────────────────
function cargarTablas() {
    fetch('BudgetServlet')
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(data => {
            pintarTabla('tbody-presupuestos', data.filter(b => b.type === 1));
            pintarTabla('tbody-planes',       data.filter(b => b.type === 2));
        })
        .catch(err => {
            ['tbody-presupuestos', 'tbody-planes'].forEach(id => {
                const tbody = document.getElementById(id);
                if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="tabla-vacia">Error al cargar datos</td></tr>';
            });
            console.error('Error cargando presupuestos:', err);
        });
}

function pintarTabla(tbodyId, items) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="tabla-vacia">Sin registros</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    items.forEach(b => {
        const tr = document.createElement('tr');
        tr.dataset.id = b.idBudget;
        tr.innerHTML = `
            <td>${b.deptName}</td>
            <td>${b.year}</td>
            <td class="importe-cell">${fmt(b.totalAmount)}</td>
            <td>
                <button class="submit-btn btn-eliminar" style="background:#e74c3c;padding:6px 14px;"
                        onclick="eliminar(${b.idBudget}, this)">Eliminar</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

// ── Añadir fila directamente en la tabla tras guardar ────────
function añadirFila(tbodyId, b) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    if (tbody.querySelector('[colspan]')) tbody.innerHTML = '';
    const tr = document.createElement('tr');
    tr.dataset.id = b.idBudget;
    tr.innerHTML = `
        <td>${b.deptName}</td>
        <td>${b.year}</td>
        <td class="importe-cell">${fmt(b.totalAmount)}</td>
        <td>
            <button class="submit-btn btn-eliminar" style="background:#e74c3c;padding:6px 14px;"
                    onclick="eliminar(${b.idBudget}, this)">Eliminar</button>
        </td>`;
    tbody.appendChild(tr);
}

// ── Guardar presupuesto (type=1) ─────────────────────────────
document.getElementById('form-presupuesto').addEventListener('submit', e => {
    e.preventDefault();
    const codeDept   = document.getElementById('pres-departamento').value;
    const totalAmount = document.getElementById('pres-monto').value;
    if (!codeDept || !totalAmount) return;

    const body = new URLSearchParams({ codeDept, totalAmount, type: 1 });
    fetch('BudgetServlet', { method: 'POST', body })
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(b => {
            añadirFila('tbody-presupuestos', b);
            document.getElementById('form-presupuesto').reset();
        })
        .catch(() => alert('Error al guardar el presupuesto.'));
});

// ── Guardar plan de inversión (type=2) ───────────────────────
document.getElementById('form-plan').addEventListener('submit', e => {
    e.preventDefault();
    const codeDept    = document.getElementById('plan-departamento').value;
    const totalAmount = document.getElementById('plan-monto').value;
    if (!codeDept || !totalAmount) return;

    const body = new URLSearchParams({ codeDept, totalAmount, type: 2 });
    fetch('BudgetServlet', { method: 'POST', body })
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(b => {
            añadirFila('tbody-planes', b);
            document.getElementById('form-plan').reset();
        })
        .catch(() => alert('Error al guardar el plan de inversión.'));
});

// ── Eliminar ─────────────────────────────────────────────────
function eliminar(id, btn) {
    if (!confirm('¿Eliminar este registro?')) return;
    fetch('BudgetServlet?id=' + id, { method: 'DELETE' })
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(data => {
            if (data.ok) btn.closest('tr').remove();
        })
        .catch(() => alert('Error al eliminar.'));
}

// ── Formatear euros ──────────────────────────────────────────
function fmt(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return '—';
    return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

// ── Transiciones suaves ──────────────────────────────────────
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

// ── Init ─────────────────────────────────────────────────────
cargarDepartamentos().then(() => cargarTablas());
