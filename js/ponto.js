const Ponto = {
    registroCampos: ['entrada', 'idaIntervalo', 'voltaIntervalo', 'saida'],
    registroAtual: null,
    currentEditCampo: null,

    async init() {
        const usuario = Data.getUsuario();
        if (!usuario) {
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('userName').textContent = `Olá, ${Utils.escapeHtml(usuario.nome)}`;

        this.initSyncStatus();

        this.registroAtual = await Data.getRegistroHoje();
        this.render();
        this.initEvents();
    },

    initSyncStatus() {
        const syncEl = document.getElementById('syncStatus');
        if (!syncEl) return;

        const updateStatus = ({ pending, online }) => {
            if (!online) {
                syncEl.textContent = 'Offline';
                syncEl.className = 'sync-status offline';
            } else if (pending > 0) {
                syncEl.textContent = `Sync: ${pending}`;
                syncEl.className = 'sync-status syncing';
            } else {
                syncEl.textContent = 'Online';
                syncEl.className = 'sync-status online';
            }
        };

        Data.onSyncStatusChange = updateStatus;
        updateStatus({ pending: Data.getSyncQueue().length, online: navigator.onLine });
    },

    show(main) {
        this.render(main);
    },

    render(container) {
        const main = container || document.querySelector('.app-main');

        main.innerHTML = `
            <div class="ponto-btn-container">
                <button class="ponto-btn" id="pontoBtn">
                    Bater ponto
                </button>
            </div>

            <div class="registros">
                <div class="registro-card">
                    <span class="registro-label">Entrada</span>
                    <span class="registro-hora" id="entrada">--:--</span>
                    <div class="registro-actions">
                        <button class="btn-icon btn-edit" data-campo="entrada">✏️</button>
                        <button class="btn-icon btn-delete" data-campo="entrada">🗑️</button>
                    </div>
                </div>

                <div class="registro-card">
                    <span class="registro-label">Ida Intervalo</span>
                    <span class="registro-hora" id="idaIntervalo">--:--</span>
                    <div class="registro-actions">
                        <button class="btn-icon btn-edit" data-campo="idaIntervalo">✏️</button>
                        <button class="btn-icon btn-delete" data-campo="idaIntervalo">🗑️</button>
                    </div>
                </div>

                <div class="registro-card">
                    <span class="registro-label">Volta Intervalo</span>
                    <span class="registro-hora" id="voltaIntervalo">--:--</span>
                    <div class="registro-actions">
                        <button class="btn-icon btn-edit" data-campo="voltaIntervalo">✏️</button>
                        <button class="btn-icon btn-delete" data-campo="voltaIntervalo">🗑️</button>
                    </div>
                </div>

                <div class="registro-card">
                    <span class="registro-label">Saída</span>
                    <span class="registro-hora" id="saida">--:--</span>
                    <div class="registro-actions">
                        <button class="btn-icon btn-edit" data-campo="saida">✏️</button>
                        <button class="btn-icon btn-delete" data-campo="saida">🗑️</button>
                    </div>
                </div>
            </div>

            <div class="saldo-card hidden" id="previsaoContainer">
                <div class="saldo-label">Previsão de Saída</div>
                <div class="saldo-valor" id="previsaoSaida">--:--</div>
            </div>
        `;

        this.updateUI();

        if (container) {
            this.initEvents();
        }
    },

    initEvents() {
        document.getElementById('pontoBtn').addEventListener('click', () => this.baterPonto());

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const campo = btn.dataset.campo;
                const valorAtual = this.registroAtual[campo] || '';
                this.openEditModal(campo, valorAtual);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const campo = btn.dataset.campo;
                if (this.registroAtual[campo]) {
                    this.deleteRegistro(campo);
                }
            });
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            Data.limparDados();
            window.location.href = 'index.html';
        });
    },

    getProximoCampoVazio() {
        for (const campo of this.registroCampos) {
            if (!this.registroAtual[campo]) {
                return campo;
            }
        }
        return null;
    },

    async baterPonto() {
        const proximoCampo = this.getProximoCampoVazio();
        if (!proximoCampo) return;

        this.registroAtual[proximoCampo] = Utils.getCurrentTime();
        await Data.salvarRegistro(this.registroAtual);
        this.updateUI();
    },

    updateUI() {
        for (const campo of this.registroCampos) {
            const elemento = document.getElementById(campo);
            if (elemento) {
                elemento.textContent = this.registroAtual[campo] || '--:--';
            }
        }

        const proximoCampo = this.getProximoCampoVazio();
        const pontoBtn = document.getElementById('pontoBtn');

        if (pontoBtn) {
            if (!proximoCampo) {
                pontoBtn.disabled = true;
                pontoBtn.textContent = 'Ponto completo';
                pontoBtn.style.opacity = '0.6';
            } else {
                pontoBtn.disabled = false;
                pontoBtn.textContent = 'Bater ponto';
                pontoBtn.style.opacity = '1';
            }
        }

        this.updatePrevisaoSaida();
    },

    async calcularPrevisaoSaida() {
        const cargaHoraria = await Data.getCargaHoraria();

        if (!cargaHoraria || !this.registroAtual.entrada) {
            return null;
        }

        const entradaReal = Utils.timeToMinutes(this.registroAtual.entrada);
        const entradaPrevista = Utils.timeToMinutes(cargaHoraria.entrada);
        const diferenca = entradaReal - entradaPrevista;
        const saidaPrevista = Utils.timeToMinutes(cargaHoraria.saida) + diferenca;

        return Utils.minutesToTime(saidaPrevista);
    },

    async updatePrevisaoSaida() {
        const container = document.getElementById('previsaoContainer');
        const previsaoEl = document.getElementById('previsaoSaida');

        if (!container || !previsaoEl) return;

        if (this.registroAtual.entrada && !this.registroAtual.saida) {
            const previsao = await this.calcularPrevisaoSaida();
            if (previsao) {
                previsaoEl.textContent = previsao;
                container.classList.remove('hidden');
            } else {
                container.classList.add('hidden');
            }
        } else {
            container.classList.add('hidden');
        }
    },

    openEditModal(campo, valorAtual) {
        const nomes = {
            'entrada': 'Entrada',
            'idaIntervalo': 'Ida Intervalo',
            'voltaIntervalo': 'Volta Intervalo',
            'saida': 'Saída'
        };

        this.currentEditCampo = campo;

        Nav.openModal({
            title: `Editar ${nomes[campo]}`,
            body: `
                <div class="input-group">
                    <label for="editTime">Horário</label>
                    <input type="time" id="editTime" value="${valorAtual}">
                </div>
            `,
            footer: `
                <button class="btn btn-secondary" onclick="Nav.closeModal()">Cancelar</button>
                <button class="btn btn-primary" id="modalSave">Salvar</button>
            `
        });

        document.getElementById('modalSave').addEventListener('click', () => this.saveEdit());
    },

    async saveEdit() {
        const campo = this.currentEditCampo;
        const novoValor = document.getElementById('editTime').value;

        if (!novoValor) return;

        this.registroAtual[campo] = novoValor;
        await Data.salvarRegistro(this.registroAtual);

        Nav.closeModal();
        this.updateUI();
    },

    async deleteRegistro(campo) {
        this.registroAtual[campo] = null;
        await Data.salvarRegistro(this.registroAtual);
        this.updateUI();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Nav.init();
    Ponto.init();
});
