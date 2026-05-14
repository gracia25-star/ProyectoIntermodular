/* ===== JS PROVEEDORES ===== */

// ── Marcar nav activo ────────────────────────────────────────
document.querySelectorAll('.top-nav-btn').forEach(btn => {
    if (btn.textContent.trim() === 'Proveedores') {
        btn.classList.add('active-nav');
    }
});

// ── Rol del usuario ──────────────────────────────────────────
const rol = sessionStorage.getItem('rol');
const nombreEl = document.getElementById('rolUsuario');
if (nombreEl) nombreEl.textContent = rol || 'Usuario';

// ── ID del proveedor que se está editando ────────────────────
let editandoId = null;

// ── Cargar proveedores desde el servlet ─────────────────────
async function cargarProveedores() {
    try {
        const res = await fetch('SupplierServlet');
        if (!res.ok) throw new Error('sin servlet');
        const data = await res.json();
        renderTablaProveedores(data);
    } catch {
        // la tabla conserva los datos de ejemplo del HTML
    }
}

function renderTablaProveedores(proveedores) {
    const tbody = document.getElementById('proveedores-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (proveedores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="tabla-vacia">No hay proveedores registrados.</td></tr>';
        return;
    }

    proveedores.forEach(p => {
        const tr = document.createElement('tr');
        tr.dataset.id = p.idSupplier;
        tr.innerHTML = `
            <td>${p.name}</td>
            <td class="cif-cell">${p.cif}</td>
            <td>${p.mail}</td>
            <td>${p.phone}</td>
            <td>${p.address}</td>
            <td>
                <button class="btn-edit" onclick="editarProveedor(${p.idSupplier})">Editar</button>
                <button class="btn-danger" onclick="confirmarEliminar(${p.idSupplier})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ── Guardar proveedor (crear o actualizar) ───────────────────
function guardarProveedor(event) {
    if (event) event.preventDefault();

    const nombre   = document.getElementById('prov-nombre')?.value.trim();
    const cif      = document.getElementById('prov-cif')?.value.trim();
    const email    = document.getElementById('prov-email')?.value.trim();
    const telefono = document.getElementById('prov-telefono')?.value.trim();
    const dir      = document.getElementById('prov-direccion')?.value.trim();

    if (!nombre || !cif || !email || !telefono) {
        alert('Por favor, completa todos los campos obligatorios.');
        return;
    }

    const url    = editandoId ? `SupplierServlet?id=${editandoId}` : 'SupplierServlet';
    const method = editandoId ? 'PUT' : 'POST';
    const body   = JSON.stringify({ name: nombre, cif, mail: email, phone: telefono, address: dir });

    fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body
    })
    .then(r => r.ok ? (resetFormulario(), cargarProveedores()) : Promise.reject())
    .catch(() => alert('Error al guardar el proveedor.'));
}

// ── Editar: rellena el formulario con los datos del proveedor ─
function editarProveedor(id) {
    fetch(`SupplierServlet?id=${id}`)
        .then(r => r.json())
        .then(p => {
            setVal('prov-nombre',    p.name);
            setVal('prov-cif',       p.cif);
            setVal('prov-email',     p.mail);
            setVal('prov-telefono',  p.phone);
            setVal('prov-direccion', p.address);
            editandoId = id;
            document.getElementById('form-titulo')?.textContent && (
                document.getElementById('form-titulo').textContent = 'Editar Proveedor'
            );
        })
        .catch(() => alert('No se pudo cargar el proveedor.'));
}

// ── Eliminar con confirmación ────────────────────────────────
function confirmarEliminar(id) {
    if (!confirm('¿Seguro que quieres eliminar este proveedor?')) return;
    fetch(`SupplierServlet?id=${id}`, { method: 'DELETE' })
        .then(r => r.ok ? cargarProveedores() : Promise.reject())
        .catch(() => alert('Error al eliminar el proveedor.'));
}

// ── Resetear formulario ──────────────────────────────────────
function resetFormulario() {
    ['prov-nombre', 'prov-cif', 'prov-email', 'prov-telefono', 'prov-direccion']
        .forEach(id => setVal(id, ''));
    editandoId = null;
    const titulo = document.getElementById('form-titulo');
    if (titulo) titulo.textContent = 'Registrar / Editar Proveedor';
}

// ── Utilidades ───────────────────────────────────────────────
function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

// ── Transiciones suaves entre páginas ───────────────────────
document.addEventListener('DOMContentLoaded', () => {
    cargarProveedores();

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
