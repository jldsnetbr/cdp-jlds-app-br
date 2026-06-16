const Perfil = {
    async show(main) {
        const usuario = Data.getUsuario();
        const cargaHoraria = await Data.getCargaHoraria();

        main.innerHTML = `
            <div class="perfil-card">
                <div class="perfil-card-header">Editar Perfil</div>

                <div class="input-group">
                    <label for="editNome">Nome</label>
                    <input type="text" id="editNome" value="${Utils.escapeHtml(usuario.nome)}" placeholder="Seu nome">
                </div>

                <div class="input-row">
                    <div class="input-group">
                        <label for="pinAtual">PIN Atual</label>
                        <input type="password" id="pinAtual" placeholder="****" maxlength="4">
                    </div>
                    <div class="input-group">
                        <label for="novoPin">Novo PIN</label>
                        <input type="password" id="novoPin" placeholder="****" maxlength="4">
                    </div>
                    <div class="input-group">
                        <label for="confirmarPin">Confirmar</label>
                        <input type="password" id="confirmarPin" placeholder="****" maxlength="4">
                    </div>
                </div>

                <button class="btn btn-primary btn-sm" id="salvarPerfil">Salvar</button>
                <div id="perfilMsg" class="hidden"></div>
            </div>

            <div class="perfil-card">
                <div class="perfil-card-header">Carga Horária</div>

                <div class="input-row">
                    <div class="input-group">
                        <label for="cargaEntrada">Entrada</label>
                        <input type="time" id="cargaEntrada" value="${cargaHoraria.entrada}">
                    </div>
                    <div class="input-group">
                        <label for="cargaIdaIntervalo">Ida</label>
                        <input type="time" id="cargaIdaIntervalo" value="${cargaHoraria.idaIntervalo}">
                    </div>
                </div>

                <div class="input-row">
                    <div class="input-group">
                        <label for="cargaVoltaIntervalo">Volta</label>
                        <input type="time" id="cargaVoltaIntervalo" value="${cargaHoraria.voltaIntervalo}">
                    </div>
                    <div class="input-group">
                        <label for="cargaSaida">Saída</label>
                        <input type="time" id="cargaSaida" value="${cargaHoraria.saida}">
                    </div>
                </div>

                <div class="carga-total-row">
                    <span class="carga-total-label">Total:</span>
                    <span class="carga-total-valor" id="cargaTotal">${Utils.calcularCarga(cargaHoraria)}</span>
                </div>

                <button class="btn btn-primary btn-sm" id="salvarCarga">Salvar</button>
                <div id="cargaMsg" class="hidden"></div>
            </div>
        `;

        this.initEvents(usuario);
    },

    initEvents(usuario) {
        document.getElementById('cargaEntrada').addEventListener('change', () => this.atualizarSaidaPrevista());
        document.getElementById('cargaIdaIntervalo').addEventListener('change', () => this.atualizarSaidaPrevista());
        document.getElementById('cargaVoltaIntervalo').addEventListener('change', () => this.atualizarSaidaPrevista());
        document.getElementById('cargaSaida').addEventListener('change', () => this.atualizarCargaTotal());

        document.getElementById('salvarPerfil').addEventListener('click', () => this.salvarPerfil(usuario));
        document.getElementById('salvarCarga').addEventListener('click', () => this.salvarCarga());
    },

    atualizarSaidaPrevista() {
        const entrada = document.getElementById('cargaEntrada').value;
        const idaIntervalo = document.getElementById('cargaIdaIntervalo').value;
        const voltaIntervalo = document.getElementById('cargaVoltaIntervalo').value;

        if (entrada && idaIntervalo && voltaIntervalo) {
            const entradaMin = Utils.timeToMinutes(entrada);
            const idaMin = Utils.timeToMinutes(idaIntervalo);
            const voltaMin = Utils.timeToMinutes(voltaIntervalo);

            const intervalo = voltaMin - idaMin;
            const saidaMin = entradaMin + 480 + intervalo;

            document.getElementById('cargaSaida').value = Utils.minutesToTime(saidaMin);
            this.atualizarCargaTotal();
        }
    },

    atualizarCargaTotal() {
        const carga = {
            entrada: document.getElementById('cargaEntrada').value,
            idaIntervalo: document.getElementById('cargaIdaIntervalo').value,
            voltaIntervalo: document.getElementById('cargaVoltaIntervalo').value,
            saida: document.getElementById('cargaSaida').value
        };

        if (carga.entrada && carga.idaIntervalo && carga.voltaIntervalo && carga.saida) {
            document.getElementById('cargaTotal').textContent = Utils.calcularCarga(carga);
        }
    },

    salvarPerfil(usuario) {
        const novoNome = document.getElementById('editNome').value.trim();
        const pinAtual = document.getElementById('pinAtual').value;
        const novoPin = document.getElementById('novoPin').value;
        const confirmarPin = document.getElementById('confirmarPin').value;
        const msgEl = document.getElementById('perfilMsg');

        if (!novoNome) {
            Utils.showMsg(msgEl, 'Insira um nome válido.', 'error');
            return;
        }

        if (novoPin || confirmarPin) {
            if (pinAtual !== usuario.pin) {
                Utils.showMsg(msgEl, 'PIN atual incorreto.', 'error');
                return;
            }
            if (novoPin.length !== 4 || !/^\d+$/.test(novoPin)) {
                Utils.showMsg(msgEl, 'Novo PIN deve ter 4 dígitos.', 'error');
                return;
            }
            if (novoPin !== confirmarPin) {
                Utils.showMsg(msgEl, 'PINs não conferem.', 'error');
                return;
            }
            usuario.pin = novoPin;
        }

        usuario.nome = novoNome;
        Data.setUsuario(usuario);

        document.getElementById('userName').textContent = `Olá, ${usuario.nome}`;

        Utils.showMsg(msgEl, 'Perfil salvo com sucesso!', 'success');

        document.getElementById('pinAtual').value = '';
        document.getElementById('novoPin').value = '';
        document.getElementById('confirmarPin').value = '';
    },

    async salvarCarga() {
        const carga = {
            entrada: document.getElementById('cargaEntrada').value,
            idaIntervalo: document.getElementById('cargaIdaIntervalo').value,
            voltaIntervalo: document.getElementById('cargaVoltaIntervalo').value,
            saida: document.getElementById('cargaSaida').value
        };

        if (!carga.entrada || !carga.idaIntervalo || !carga.voltaIntervalo) {
            Utils.showMsg(document.getElementById('cargaMsg'), 'Preencha todos os horários.', 'error');
            return;
        }

        await Data.setCargaHoraria(carga);
        Utils.showMsg(document.getElementById('cargaMsg'), 'Carga horária salva!', 'success');
    }
};
