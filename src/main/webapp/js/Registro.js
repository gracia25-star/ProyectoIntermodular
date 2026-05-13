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

document.addEventListener('DOMContentLoaded', function () {
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
    } else if (error === 'servidor') {
        mostrarMensaje('Error del servidor. Revisa la conexión con la base de datos.', true);
    }
});
