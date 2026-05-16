/* ===== JS HISTÓRICO ===== */

// El rol viene del servidor (sesión HTTP), no de sessionStorage
let userRole = null;

// Marcar nav activo
document.querySelectorAll('.top-nav-btn').forEach(btn => {
    if (btn.textContent.trim() === 'Histórico') btn.classList.add('active-nav');
});

// Primero obtenemos el rol real desde la sesión del servidor
fetch('SesionServlet')
    .then(r => r.json())
    .then(d => {
        userRole = d.role;
        const rolEl = document.getElementById('rolUsuario');
        if (rolEl) rolEl.textContent = userRole || 'Usuario';
        if (userRole !== 'admin') {
            const presLink = document.querySelector('a[href="viewPresupuesto.html"]');
            if (presLink) presLink.remove();
        }
        if (userRole === 'admin' || userRole === 'accountant') {
            const menuLink = document.querySelector('a[href="viewMenu.html"]');
            if (menuLink) menuLink.href = 'viewMenuAdmin.html';
            const ordenesLink = document.querySelector('a[href="viewOrdenes.html"]');
            if (ordenesLink) ordenesLink.href = 'viewOrdenesAdmin.html';
        }
        if (userRole === 'admin') {
            document.querySelectorAll('.admin-only').forEach(el => el.style.display='inline-block');
        }
        inicializar();
    })
    .catch(() => inicializar());

// ── Inicialización según rol ──
function inicializar() {
    poblarAños();

    if (userRole === 'admin' || userRole === 'accountant') {
        mostrarDeptFilter();
        poblarDepartamentos();
        limpiarTablas();
    } else {
        // dept_manager: el servlet deduce su departamento de la sesión
        cargarDatos();
    }
}

// ── Poblar selector de años ──
function poblarAños() {
    const selectYear = document.getElementById('select-anio');
    const currentYear = new Date().getFullYear();
    selectYear.innerHTML = '';
    for (let y = currentYear; y >= currentYear - 5; y--) {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        if (y === currentYear) opt.selected = true;
        selectYear.appendChild(opt);
    }
    selectYear.addEventListener('change', () => {
        if (userRole === 'admin' || userRole === 'accountant') {
            poblarDepartamentos();
        }
        cargarDatos();
    });
}

// ── Mostrar filtro departamento (solo admin/contable) ──
function mostrarDeptFilter() {
    const container = document.getElementById('dept-filter-container');
    if (container) container.style.display = 'block';
    const deptSelect = document.getElementById('select-dept');
    if (deptSelect) deptSelect.addEventListener('change', cargarDatos);
}

// ── Poblar desplegable de departamentos ──
function poblarDepartamentos() {
    const year = parseInt(document.getElementById('select-anio').value) || new Date().getFullYear();
    fetch(`HistoricoServlet?year=${year}`)
        .then(res => res.json())
        .then(data => {
            const deptSelect = document.getElementById('select-dept');
            if (!data.availableDepts || data.availableDepts.length === 0) return;
            const currentVal = deptSelect.value;
            deptSelect.innerHTML = '<option value="">Seleccionar departamento...</option>';
            data.availableDepts.forEach(dept => {
                const opt = document.createElement('option');
                opt.value = dept.code;
                opt.textContent = dept.name;
                deptSelect.appendChild(opt);
            });
            // Mantener selección previa si existe
            if (currentVal) deptSelect.value = currentVal;
        })
        .catch(err => console.error('Error cargando departamentos:', err));
}

// ── Cargar datos desde el servlet ──
async function cargarDatos() {
    const year = parseInt(document.getElementById('select-anio').value) || new Date().getFullYear();
    let url = `HistoricoServlet?year=${year}`;

    if (userRole === 'admin' || userRole === 'accountant') {
        const deptSelect = document.getElementById('select-dept');
        if (!deptSelect || !deptSelect.value) {
            limpiarTablas();
            return;
        }
        url += `&dept=${deptSelect.value}`;
    }

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Error en respuesta');
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const deptName = data.deptName || '';
        actualizarInfoBanner(deptName, year);
        renderPresupuestos(data.presupuestos || [], deptName);
        renderPlanes(data.planes || [], deptName);
        renderOrdenes(data.ordenes || []);
    } catch (error) {
        console.error('Error:', error);
        limpiarTablas();
    }
}

// ── Banner que muestra qué departamento/año se está viendo ──
function actualizarInfoBanner(deptName, year) {
    const el = document.getElementById('info-vista');
    if (!el) return;
    if (deptName) {
        el.textContent = `${deptName} — ${year}`;
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

// ── Renderizar tabla presupuestos ──
function renderPresupuestos(presupuestos, deptName) {
    const tbody = document.getElementById('tabla-presupuestos');
    if (!presupuestos || presupuestos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="tabla-vacia">No hay presupuestos para este período</td></tr>';
        return;
    }
    tbody.innerHTML = presupuestos.map(p => `
        <tr>
            <td><strong>${esc(deptName)}</strong></td>
            <td>${formatEuros(p.asignado)}</td>
            <td>${formatEuros(p.gastado)}</td>
            <td class="${parseFloat(p.restante) < 0 ? 'importe-negativo' : ''}">${formatEuros(p.restante)}</td>
        </tr>
    `).join('');
}

// ── Renderizar tabla planes de inversión ──
function renderPlanes(planes, deptName) {
    const tbody = document.getElementById('tabla-planes');
    if (!planes || planes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="tabla-vacia">No hay planes de inversión para este período</td></tr>';
        return;
    }
    tbody.innerHTML = planes.map(p => `
        <tr>
            <td><strong>${esc(deptName)}</strong></td>
            <td>${formatEuros(p.asignado)}</td>
            <td>${formatEuros(p.gastado)}</td>
            <td class="${parseFloat(p.restante) < 0 ? 'importe-negativo' : ''}">${formatEuros(p.restante)}</td>
        </tr>
    `).join('');
}

// ── Renderizar tabla órdenes de compra ──
function renderOrdenes(ordenes) {
    const tbody = document.getElementById('tabla-ordenes');
    if (!ordenes || ordenes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="tabla-vacia">No hay órdenes de compra para este período</td></tr>';
        return;
    }
    tbody.innerHTML = ordenes.map(o => {
        const statusClass = o.status === 'Aprobada' ? 'estado-aprobada' : 'estado-pendiente';
        return `
            <tr>
                <td><strong>#${o.codeOrder}</strong></td>
                <td>${esc(o.reference)}</td>
                <td>${esc(o.description)}</td>
                <td>${formatFecha(o.date)}</td>
                <td>${formatEuros(o.amount)}</td>
                <td><span class="estado-badge ${statusClass}">${o.status}</span></td>
            </tr>
        `;
    }).join('');
}

// ── Limpiar tablas ──
function limpiarTablas() {
    const msg = userRole === 'admin' || userRole === 'accountant'
        ? 'Selecciona año y departamento'
        : 'Sin datos para este período';
    document.getElementById('tabla-presupuestos').innerHTML =
        `<tr><td colspan="4" class="tabla-vacia">${msg}</td></tr>`;
    document.getElementById('tabla-planes').innerHTML =
        `<tr><td colspan="4" class="tabla-vacia">${msg}</td></tr>`;
    document.getElementById('tabla-ordenes').innerHTML =
        `<tr><td colspan="6" class="tabla-vacia">${msg}</td></tr>`;
    const el = document.getElementById('info-vista');
    if (el) el.style.display = 'none';
}

// ── Utilidades ──
function formatEuros(valor) {
    const num = parseFloat(valor) || 0;
    return new Intl.NumberFormat('es-ES', {
        style: 'currency', currency: 'EUR',
        minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(num);
}

function formatFecha(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function esc(s) {
    if (!s) return '—';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}
