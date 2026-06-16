const Utils = {
    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    },

    minutesToTime(totalMinutes) {
        const abs = Math.abs(totalMinutes);
        const h = Math.floor(abs / 60);
        const m = abs % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    },

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    },

    formatDate(dateStr) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    },

    calcularCarga(carga) {
        const entrada = this.timeToMinutes(carga.entrada);
        const saida = this.timeToMinutes(carga.saida);
        const ida = this.timeToMinutes(carga.idaIntervalo);
        const volta = this.timeToMinutes(carga.voltaIntervalo);
        const total = (saida - entrada) - (volta - ida);
        return this.minutesToTime(total);
    },

    calcularDiff(trabalhado, cargaMin) {
        return trabalhado - cargaMin;
    },

    showMsg(el, msg, type) {
        el.textContent = msg;
        el.className = type === 'error' ? 'error-msg' : 'success-msg';
        setTimeout(() => { el.className = 'hidden'; }, 3000);
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};
