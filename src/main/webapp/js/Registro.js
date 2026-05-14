function switchTab(tab) {
    const container = document.getElementById('main-container');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');

    if (tab === 'login') {
        container.classList.remove('show-register');
        container.classList.add('show-login');
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    } else {
        container.classList.remove('show-login');
        container.classList.add('show-register');
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
    }
}

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

function rellenarDepartamentos(depts) {
    const group = document.getElementById('dept-optgroup');
    group.innerHTML = '';
    depts.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.codeDept;
        opt.textContent = d.name;
        group.appendChild(opt);
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

document.addEventListener('DOMContentLoaded', function () {
    cargarDepartamentos();
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const registro = params.get('registro');

    if (registro === 'ok') {
        mostrarMensaje('Cuenta creada correctamente. Ya puedes iniciar sesión.', false);
        switchTab('login');
    } else if (error === 'credenciales') {
        mostrarMensaje('Usuario o contraseña incorrectos.', true);
        switchTab('login');
    } else if (error === 'email_existe') {
        mostrarMensaje('Ese correo ya está registrado.', true);
        switchTab('register');
    } else if (error === 'rol_requerido') {
        mostrarMensaje('Debes seleccionar un rol o departamento.', true);
        switchTab('register');
    } else if (error === 'rol_invalido') {
        mostrarMensaje('El rol o departamento seleccionado no es válido.', true);
        switchTab('register');
    } else if (error === 'servidor') {
        mostrarMensaje('Error del servidor. Revisa la conexión con la base de datos.', true);
    }
});
