function mostrarMensaje(texto, esError) {
    let msg = document.getElementById('mensaje-global');
    if (!msg) {
        msg = document.createElement('div');
        msg.id = 'mensaje-global';
        msg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);' +
            'padding:12px 32px 12px 24px;border-radius:8px;font-weight:bold;z-index:9999;' +
            'box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;';
        msg.title = 'Haz clic para cerrar';
        msg.addEventListener('click', function () { msg.style.display = 'none'; });
        document.body.appendChild(msg);
    }
    msg.textContent = texto;
    msg.style.background = esError ? '#e74c3c' : '#27ae60';
    msg.style.color = '#fff';
    msg.style.display = 'block';
}

const DEPARTAMENTOS_FALLBACK = [
    { codeDept: 1,  name: 'Informática' },
    { codeDept: 2,  name: 'Mecánica' },
    { codeDept: 3,  name: 'Electricidad' },
    { codeDept: 4,  name: 'Automoción' },
    { codeDept: 5,  name: 'Grado Básico' },
    { codeDept: 6,  name: 'Telecomunicaciones' },
    { codeDept: 7,  name: 'Robótica' },
    { codeDept: 8,  name: 'Primaria' },
    { codeDept: 9,  name: 'Infantil' },
    { codeDept: 10, name: 'Secundaria' },
    { codeDept: 11, name: 'Bachillerato' },
    { codeDept: 12, name: 'SAT' },
    { codeDept: 13, name: 'Mantenimiento' },
    { codeDept: 14, name: 'Premio Don Bosco' },
    { codeDept: 15, name: 'Formación' },
    { codeDept: 16, name: 'Administración' }
];

const usuariosCache = {};

function rellenarDepartamentos(depts) {
    ['dept-optgroup', 'edit-dept-optgroup'].forEach(groupId => {
        const group = document.getElementById(groupId);
        if (!group) return;
        group.innerHTML = '';
        depts.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.codeDept;
            opt.textContent = d.name;
            group.appendChild(opt);
        });
    });
}

async function cargarDepartamentos() {
    try {
        const res = await fetch('DepartmentServlet');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const depts = await res.json();
        rellenarDepartamentos(depts);
    } catch (err) {
        console.warn('DepartmentServlet no disponible, usando lista local:', err);
        rellenarDepartamentos(DEPARTAMENTOS_FALLBACK);
    }
}

async function cargarUsuarios() {
    const tbody = document.getElementById('tbody-usuarios');
    if (!tbody) return; // Only run on viewAdminUsuarios

    try {
        const res = await fetch('UsuariosServlet');
        if (!res.ok) throw new Error('Error al cargar usuarios');
        const usuarios = await res.json();
        
        if (!usuarios || usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 1rem;">No hay usuarios registrados</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        usuarios.forEach(u => {
            usuariosCache[u.id] = u;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">${u.nombre}</td>
                <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">${u.email}</td>
                <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">${u.departamento !== '—' ? u.departamento : '—'}</td>
                <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">${u.rol !== '—' ? u.rol : '—'}</td>
                <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">
                    <button class="submit-btn" style="padding: 0.4rem 1rem;" onclick="editarUsuario(${u.id})">Editar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error:', err);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 1rem; color: #e74c3c;">Error al cargar la lista de usuarios.</td></tr>';
    }
}

function editarUsuario(id) {
    const u = usuariosCache[id];
    if (!u) return;
    document.getElementById('edit-id').value = u.id;
    document.getElementById('edit-nombre').value = u.nombre;
    document.getElementById('edit-email').value = u.email;
    const select = document.getElementById('edit-rol');
    if (u.codeRole === 1) select.value = 'admin';
    else if (u.codeRole === 2) select.value = 'accountant';
    else if (u.codeRole === 3 && u.codeDept !== null) select.value = String(u.codeDept);
    document.getElementById('modal-editar').style.display = 'flex';
}

function cerrarModalEditar() {
    document.getElementById('modal-editar').style.display = 'none';
}

async function guardarEdicion() {
    const id     = document.getElementById('edit-id').value;
    const nombre = document.getElementById('edit-nombre').value.trim();
    const email  = document.getElementById('edit-email').value.trim();
    const rol    = document.getElementById('edit-rol').value;

    if (!nombre || !email || !rol) {
        mostrarMensaje('Completa todos los campos.', true);
        return;
    }

    const params = new URLSearchParams({ id, nombre, email, rol });
    try {
        const res = await fetch('UsuariosServlet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        const data = await res.json();
        if (data.ok) {
            cerrarModalEditar();
            mostrarMensaje('Usuario actualizado correctamente.', false);
            cargarUsuarios();
        } else {
            mostrarMensaje('Error al actualizar: ' + (data.error || ''), true);
        }
    } catch (err) {
        mostrarMensaje('Error de conexión al actualizar.', true);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    cargarDepartamentos();
    cargarUsuarios();
    
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const registro = params.get('registro');

    if (registro === 'ok') {
        mostrarMensaje('Usuario registrado correctamente.', false);
        // Remove param from URL so refresh doesn't show popup again
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error === 'credenciales') {
        mostrarMensaje('Usuario o contraseña incorrectos.', true);
    } else if (error === 'email_existe') {
        mostrarMensaje('Ese correo ya está registrado.', true);
    } else if (error === 'rol_requerido') {
        mostrarMensaje('Debes seleccionar un rol o departamento.', true);
    } else if (error === 'rol_invalido') {
        mostrarMensaje('El rol o departamento seleccionado no es válido.', true);
    } else if (error === 'servidor') {
        mostrarMensaje('Error del servidor. Revisa la conexión con la base de datos.', true);
    }
});
