/* Rellena el nombre y rol del usuario en el dropdown de cabecera.
   Llamar con el objeto devuelto por SesionServlet: initUserInfo(d) */
window.initUserInfo = function(d) {
    var nameEl = document.getElementById('user-name');
    var roleEl = document.getElementById('user-role');
    if (nameEl) nameEl.textContent = d.nombre || 'Usuario';
    if (roleEl) {
        if (d.role === 'dept_manager') {
            roleEl.textContent = d.deptName ? 'Jefe de ' + d.deptName : 'Jefe de Departamento';
        } else if (d.role === 'admin') {
            roleEl.textContent = 'Administrador';
        } else if (d.role === 'accountant') {
            roleEl.textContent = 'Contable';
        }
    }
};
