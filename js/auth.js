document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('loginForm');
    const cadastroForm = document.getElementById('cadastroForm');
    const errorMsg = document.getElementById('errorMsg');
    const cadastroMsg = document.getElementById('cadastroMsg');
    const showCadastro = document.getElementById('showCadastro');
    const showLogin = document.getElementById('showLogin');
    const loginSection = document.getElementById('loginSection');
    const cadastroSection = document.getElementById('cadastroSection');

    await Data.init();

    const usuario = Data.getUsuario();
    if (usuario) {
        window.location.href = 'app.html';
        return;
    }

    showCadastro.addEventListener('click', (e) => {
        e.preventDefault();
        loginSection.classList.add('hidden');
        cadastroSection.classList.remove('hidden');
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        cadastroSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('loginNome').value.trim();
        const pin = document.getElementById('loginPin').value;

        if (!nome) {
            Utils.showMsg(errorMsg, 'Por favor, insira seu nome.', 'error');
            return;
        }

        if (pin.length !== 4 || !/^\d+$/.test(pin)) {
            Utils.showMsg(errorMsg, 'O PIN deve conter 4 dígitos.', 'error');
            return;
        }

        if (Data.useAPI) {
            try {
                const response = await fetch(`${API_BASE}/auth`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, pin })
                });

                if (response.ok) {
                    const user = await response.json();
                    Data.setUsuario(user);
                    Data.setRegistros([]);
                    window.location.href = 'app.html';
                    return;
                }

                const data = await response.json();
                Utils.showMsg(errorMsg, data.error || 'Usuário ou PIN incorretos', 'error');
                return;
            } catch {
                Utils.showMsg(errorMsg, 'Erro de conexão', 'error');
                return;
            }
        }

        Data.setUsuario({ nome, pin });
        Data.setRegistros([]);
        window.location.href = 'app.html';
    });

    cadastroForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('cadastroNome').value.trim();
        const pin = document.getElementById('cadastroPin').value;
        const confirmarPin = document.getElementById('cadastroConfirmarPin').value;

        if (!nome) {
            Utils.showMsg(cadastroMsg, 'Por favor, insira seu nome.', 'error');
            return;
        }

        if (pin.length !== 4 || !/^\d+$/.test(pin)) {
            Utils.showMsg(cadastroMsg, 'O PIN deve conter 4 dígitos.', 'error');
            return;
        }

        if (pin !== confirmarPin) {
            Utils.showMsg(cadastroMsg, 'PINs não conferem.', 'error');
            return;
        }

        if (Data.useAPI) {
            try {
                const response = await fetch(`${API_BASE}/cadastro`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, pin })
                });

                if (response.ok) {
                    const user = await response.json();
                    Data.setUsuario(user);
                    Data.setRegistros([]);
                    window.location.href = 'app.html';
                    return;
                }

                const data = await response.json();
                Utils.showMsg(cadastroMsg, data.error || 'Erro ao criar conta', 'error');
                return;
            } catch {
                Utils.showMsg(cadastroMsg, 'Erro de conexão', 'error');
                return;
            }
        }

        Data.setUsuario({ nome, pin });
        Data.setRegistros([]);
        window.location.href = 'app.html';
    });
});
