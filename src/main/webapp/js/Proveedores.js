/* ===== JS PROVEEDORES ===== */

let userRole = null;
let todosLosDepts = [];  // caché de departamentos para el selector de asignación

// ── Marcar nav activo ────────────────────────────────────────
document.querySelectorAll('.top-nav-btn').forEach(btn => {
    if (btn.textContent.trim() === 'Proveedores') btn.classList.add('active-nav');
});

// ── Inicialización: obtener sesión y montar la vista ─────────
fetch('SesionServlet')
    .then(r => r.json())
    .then(d => {
        userRole = d.role;
        if (window.initUserInfo) initUserInfo(d);
        ajustarNav();
        initSegunRol();
    })
    .catch(() => {
        document.body.style.visibility = 'visible';
        document.getElementById('seccion-jefe').style.display = 'block';
    });

// ── Ajustar enlaces del nav según rol ───────────────────────
function ajustarNav() {
    if (userRole === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display='inline-block');
    }
    if (userRole === 'admin' || userRole === 'accountant') {
        const m = document.getElementById('nav-menu');
        const o = document.getElementById('nav-ordenes');
        if (m) m.href = 'viewMenuAdmin.html';
        if (o) o.href = 'viewOrdenesAdmin.html';
        if (userRole !== 'admin') {
            const p = document.getElementById('nav-presupuesto');
            if (p) p.remove();
        }
    }
}

// ── Mostrar sección correcta según rol ───────────────────────
function initSegunRol() {
    document.body.style.visibility = 'visible';
    if (userRole === 'admin') {
        document.getElementById('seccion-admin').style.display = 'block';
        cargarDepartamentos('admin');
        cargarProveedoresAdmin();
        document.getElementById('form-proveedor').addEventListener('submit', guardarProveedor);
    } else if (userRole === 'accountant') {
        document.getElementById('seccion-contable').style.display = 'block';
        cargarDepartamentos('cont');
        cargarProveedoresCont();
    } else {
        document.getElementById('seccion-jefe').style.display = 'block';
        cargarProveedoresJefe();
    }
}

// ── Tab switching (solo admin) ────────────────────────────────
function cambiarTab(panelId, btn) {
    document.querySelectorAll('#seccion-admin .tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(panelId).classList.add('active');
    btn.classList.add('active');
}

// ── Cargar departamentos en selects ──────────────────────────
function cargarDepartamentos(destino) {
    fetch('DepartmentServlet')
        .then(r => r.json())
        .then(depts => {
            todosLosDepts = depts;
            if (destino === 'admin') {
                const filtro = document.getElementById('admin-filtro-dept');
                const form   = document.getElementById('prov-departamento');
                depts.forEach(d => {
                    filtro.appendChild(new Option(d.name, d.codeDept));
                    form.appendChild(new Option(d.name, d.codeDept));
                });
            } else {
                const filtro = document.getElementById('cont-filtro-dept');
                depts.forEach(d => filtro.appendChild(new Option(d.name, d.codeDept)));
            }
        })
        .catch(() => console.error('No se cargaron departamentos'));
}

// ── ADMIN: cargar todos los proveedores ──────────────────────
function cargarProveedoresAdmin(codeDept) {
    const url = codeDept ? `SupplierServlet?codeDept=${codeDept}` : 'SupplierServlet';
    fetch(url)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(data => pintarTablaAdmin(data))
        .catch(() => {
            document.getElementById('tbody-admin-prov').innerHTML =
                '<tr><td colspan="7" class="tabla-vacia">Error al cargar proveedores</td></tr>';
        });
}

function pintarTablaAdmin(proveedores) {
    const tbody = document.getElementById('tbody-admin-prov');
    if (!proveedores.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="tabla-vacia">Sin proveedores registrados</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    proveedores.forEach(p => {
        const deptOpts = todosLosDepts.map(d =>
            `<option value="${d.codeDept}">${d.name}</option>`).join('');
        const tr = document.createElement('tr');
        tr.dataset.id = p.idSupplier;
        tr.innerHTML = `
            <td>${p.name}</td>
            <td class="cif-cell">${p.cif}</td>
            <td>${p.mail}</td>
            <td>${p.phone}</td>
            <td>${p.address || '—'}</td>
            <td id="depts-${p.idSupplier}">${p.deptNames || 'Sin asignar'}</td>
            <td>
                <div class="acciones-cell">
                    <select class="input-select sel-asignar" id="dsel-${p.idSupplier}"
                            style="min-width:130px;padding:5px 10px;font-size:12px;">
                        <option value="">Asignar a dpto…</option>
                        ${deptOpts}
                    </select>
                    <button class="btn-edit"
                            onclick="asignarDept(${p.idSupplier})">Asignar</button>
                    <button class="btn-danger"
                            onclick="eliminarProveedor(${p.idSupplier}, this)">Eliminar</button>
                </div>
            </td>`;
        tbody.appendChild(tr);
    });
}

// ── CONTABLE: cargar proveedores (todos o por dept) ──────────
function cargarProveedoresCont(codeDept) {
    const url = codeDept ? `SupplierServlet?codeDept=${codeDept}` : 'SupplierServlet';
    fetch(url)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(data => pintarTablaCont(data))
        .catch(() => {
            document.getElementById('tbody-cont-prov').innerHTML =
                '<tr><td colspan="5" class="tabla-vacia">Error al cargar proveedores</td></tr>';
        });
}

function pintarTablaCont(proveedores) {
    const tbody = document.getElementById('tbody-cont-prov');
    if (!proveedores.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="tabla-vacia">Sin proveedores para este filtro</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    proveedores.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.name}</td>
            <td class="cif-cell">${p.cif}</td>
            <td>${p.mail}</td>
            <td>${p.phone}</td>
            <td>${p.address || '—'}</td>`;
        tbody.appendChild(tr);
    });
}

// ── JEFE DE DEPARTAMENTO: sus proveedores ────────────────────
function cargarProveedoresJefe() {
    fetch('SupplierServlet')
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(data => pintarTablaJefe(data))
        .catch(() => {
            document.getElementById('tbody-jefe-prov').innerHTML =
                '<tr><td colspan="5" class="tabla-vacia">Error al cargar proveedores</td></tr>';
        });
}

function pintarTablaJefe(proveedores) {
    const tbody = document.getElementById('tbody-jefe-prov');
    if (!proveedores.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="tabla-vacia">No tienes proveedores asignados</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    proveedores.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.name}</td>
            <td class="cif-cell">${p.cif}</td>
            <td>${p.mail}</td>
            <td>${p.phone}</td>
            <td>${p.address || '—'}</td>`;
        tbody.appendChild(tr);
    });
}

// ── Filtros ──────────────────────────────────────────────────
function adminFiltrarDept() {
    const codeDept = document.getElementById('admin-filtro-dept').value;
    cargarProveedoresAdmin(codeDept || null);
}

function contFiltrarDept() {
    const codeDept = document.getElementById('cont-filtro-dept').value;
    cargarProveedoresCont(codeDept || null);
}

// ── Guardar nuevo proveedor (admin) ──────────────────────────
function guardarProveedor(e) {
    e.preventDefault();
    const body = new URLSearchParams({
        name:     document.getElementById('prov-nombre').value.trim(),
        cif:      document.getElementById('prov-cif').value.trim(),
        mail:     document.getElementById('prov-email').value.trim(),
        phone:    document.getElementById('prov-telefono').value.trim(),
        address:  document.getElementById('prov-direccion').value.trim(),
        codeDept: document.getElementById('prov-departamento').value
    });

    fetch('SupplierServlet', { method: 'POST', body })
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(p => {
            document.getElementById('form-proveedor').reset();
            // Añadir fila al principio de la tabla admin
            const tbody = document.getElementById('tbody-admin-prov');
            if (tbody.querySelector('[colspan]')) tbody.innerHTML = '';
            const deptOpts = todosLosDepts.map(d =>
                `<option value="${d.codeDept}">${d.name}</option>`).join('');
            const tr = document.createElement('tr');
            tr.dataset.id = p.idSupplier;
            tr.innerHTML = `
                <td>${p.name}</td>
                <td class="cif-cell">${p.cif}</td>
                <td>${p.mail}</td>
                <td>${p.phone}</td>
                <td>${p.address || '—'}</td>
                <td id="depts-${p.idSupplier}">${p.deptNames || 'Sin asignar'}</td>
                <td>
                    <div class="acciones-cell">
                        <select class="input-select sel-asignar" id="dsel-${p.idSupplier}"
                                style="min-width:130px;padding:5px 10px;font-size:12px;">
                            <option value="">Asignar a dpto…</option>
                            ${deptOpts}
                        </select>
                        <button class="btn-edit"
                                onclick="asignarDept(${p.idSupplier})">Asignar</button>
                        <button class="btn-danger"
                                onclick="eliminarProveedor(${p.idSupplier}, this)">Eliminar</button>
                    </div>
                </td>`;
            tbody.insertBefore(tr, tbody.firstChild);
            // Volver a la pestaña Lista
            document.querySelector('.tab-btn').click();
        })
        .catch(() => alert('Error al guardar el proveedor. Comprueba que el CIF no esté duplicado.'));
}

// ── Asignar proveedor a un departamento adicional (admin) ────
function asignarDept(idSupplier) {
    const sel = document.getElementById('dsel-' + idSupplier);
    const codeDept = sel ? sel.value : '';
    if (!codeDept) { alert('Selecciona un departamento.'); return; }

    const body = new URLSearchParams({ codeDept, idSupplier, action: 'assign' });
    fetch('DeptSupplierServlet', { method: 'POST', body })
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(d => {
            if (d.ok) {
                // Refrescar la celda de departamentos de esa fila
                fetch(`SupplierServlet`)
                    .then(r => r.json())
                    .then(all => {
                        const prov = all.find(p => p.idSupplier === idSupplier);
                        if (prov) {
                            const cell = document.getElementById('depts-' + idSupplier);
                            if (cell) cell.textContent = prov.deptNames || 'Sin asignar';
                        }
                    });
                sel.value = '';
            }
        })
        .catch(() => alert('Error al asignar el departamento.'));
}

// ── Eliminar proveedor (admin) ────────────────────────────────
function eliminarProveedor(id, btn) {
    if (!confirm('¿Eliminar este proveedor? Se desvinculará de todos los departamentos.')) return;
    fetch(`SupplierServlet?id=${id}`, { method: 'DELETE' })
        .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(() => btn.closest('tr').remove())
        .catch(() => alert('Error al eliminar. Puede que tenga órdenes asociadas.'));
}

// ── Transiciones suaves ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
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
