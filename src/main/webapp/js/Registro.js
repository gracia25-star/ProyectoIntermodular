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
