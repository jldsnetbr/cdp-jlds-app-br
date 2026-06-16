const Banco = {
    async show(main) {
        const registros = await Data.getRegistros();
        const cargaHoraria = await Data.getCargaHoraria();
        const cargaDiaria = Utils.calcularCarga(cargaHoraria);
        const cargaDiariaMin = Utils.timeToMinutes(cargaDiaria);

        let totalGeral = 0;
        registros.forEach(reg => {
            if (reg.entrada && reg.saida) {
                const diff = this.calcularDiffDia(reg, cargaDiariaMin);
                totalGeral += diff;
            }
        });

        const sinal = totalGeral >= 0 ? '+' : '';
        const horas = Math.floor(Math.abs(totalGeral) / 60);
        const minutos = Math.abs(totalGeral) % 60;
        const totalClass = totalGeral >= 0 ? 'diff-positivo' : 'diff-negativo';

        main.innerHTML = `
            <div class="saldo-card">
                <div class="saldo-label">Banco de Horas Total</div>
                <div class="saldo-valor ${totalClass}">${sinal}${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}</div>
            </div>
            <div class="registros" id="historicoRegistros">
                ${registros.slice().reverse().map(reg => {
                    let diffText = '--:--';
                    let diffClass = '';

                    if (reg.entrada && reg.saida) {
                        const diff = this.calcularDiffDia(reg, cargaDiariaMin);
                        const s = diff >= 0 ? '+' : '';
                        diffText = s + Utils.minutesToTime(diff);
                        diffClass = diff >= 0 ? 'diff-positivo' : 'diff-negativo';
                    }

                    return `
                        <div class="registro-card registro-card-click" data-date="${reg.data}">
                            <span class="registro-label">${Utils.formatDate(reg.data)}</span>
                            <span class="registro-hora ${diffClass}">${diffText}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        main.querySelectorAll('.registro-card-click').forEach(card => {
            card.addEventListener('click', () => {
                const date = card.dataset.date;
                const reg = registros.find(r => r.data === date);
                if (reg) this.openDiaModal(reg);
            });
        });
    },

    calcularDiffDia(reg, cargaDiariaMin) {
        const entrada = Utils.timeToMinutes(reg.entrada);
        const saida = Utils.timeToMinutes(reg.saida);
        let intervalo = 0;
        if (reg.idaIntervalo && reg.voltaIntervalo) {
            intervalo = Utils.timeToMinutes(reg.voltaIntervalo) - Utils.timeToMinutes(reg.idaIntervalo);
        }
        const trabalhado = (saida - entrada) - intervalo;
        return Utils.calcularDiff(trabalhado, cargaDiariaMin);
    },

    openDiaModal(registro) {
        Nav.openModal({
            title: Utils.formatDate(registro.data),
            body: `
                <div class="dia-detalhes">
                    <div class="dia-detalhe-item">
                        <span class="dia-detalhe-label">Entrada</span>
                        <span class="dia-detalhe-valor">${registro.entrada || '--:--'}</span>
                    </div>
                    <div class="dia-detalhe-item">
                        <span class="dia-detalhe-label">Ida Intervalo</span>
                        <span class="dia-detalhe-valor">${registro.idaIntervalo || '--:--'}</span>
                    </div>
                    <div class="dia-detalhe-item">
                        <span class="dia-detalhe-label">Volta Intervalo</span>
                        <span class="dia-detalhe-valor">${registro.voltaIntervalo || '--:--'}</span>
                    </div>
                    <div class="dia-detalhe-item">
                        <span class="dia-detalhe-label">Saída</span>
                        <span class="dia-detalhe-valor">${registro.saida || '--:--'}</span>
                    </div>
                </div>
            `,
            footer: '<button class="btn btn-primary" onclick="Nav.closeModal()">Fechar</button>'
        });
    }
};
