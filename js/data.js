const CARGA_DEFAULT = {
    entrada: '08:00',
    idaIntervalo: '12:00',
    voltaIntervalo: '13:00',
    saida: '17:00'
};

const API_BASE = '/api';

const Data = {
    useAPI: false,
    syncPending: false,
    onSyncStatusChange: null,

    async init() {
        try {
            const response = await fetch(`${API_BASE}/registros?usuario_id=0`, {
                method: 'GET'
            });
            this.useAPI = response.ok || response.status === 400;
        } catch {
            this.useAPI = false;
        }

        window.addEventListener('online', () => this.syncAll());
        window.addEventListener('offline', () => this.notifySyncStatus());

        if (this.useAPI && navigator.onLine) {
            await this.syncAll();
        }
    },

    getUsuario() {
        if (this.useAPI) {
            const data = localStorage.getItem('usuario_api');
            return data ? JSON.parse(data) : null;
        }
        return JSON.parse(localStorage.getItem('usuario'));
    },

    setUsuario(usuario) {
        if (this.useAPI) {
            localStorage.setItem('usuario_api', JSON.stringify(usuario));
        } else {
            localStorage.setItem('usuario', JSON.stringify(usuario));
        }
    },

    getSyncQueue() {
        return JSON.parse(localStorage.getItem('sync_queue')) || [];
    },

    addToSyncQueue(action) {
        const queue = this.getSyncQueue();
        queue.push({ ...action, timestamp: Date.now() });
        localStorage.setItem('sync_queue', JSON.stringify(queue));
        this.notifySyncStatus();
    },

    clearSyncQueue() {
        localStorage.removeItem('sync_queue');
        this.notifySyncStatus();
    },

    notifySyncStatus() {
        const queue = this.getSyncQueue();
        this.syncPending = queue.length > 0 || !navigator.onLine;
        if (this.onSyncStatusChange) {
            this.onSyncStatusChange({
                pending: queue.length,
                online: navigator.onLine
            });
        }
    },

    async syncAll() {
        if (!this.useAPI || !navigator.onLine) return;

        const usuario = this.getUsuario();
        if (!usuario) return;

        const queue = this.getSyncQueue();
        if (queue.length === 0) {
            await this.pullFromServer();
            return;
        }

        for (const action of queue) {
            try {
                if (action.type === 'registro') {
                    await fetch(`${API_BASE}/registros`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            usuario_id: usuario.id,
                            data: action.data,
                            entrada: action.entrada,
                            ida_intervalo: action.idaIntervalo,
                            volta_intervalo: action.voltaIntervalo,
                            saida: action.saida
                        })
                    });
                } else if (action.type === 'carga') {
                    await fetch(`${API_BASE}/carga-horaria`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            usuario_id: usuario.id,
                            entrada: action.entrada,
                            ida_intervalo: action.idaIntervalo,
                            volta_intervalo: action.voltaIntervalo,
                            saida: action.saida
                        })
                    });
                }
            } catch {}
        }

        this.clearSyncQueue();
        await this.pullFromServer();
    },

    async pullFromServer() {
        if (!this.useAPI || !navigator.onLine) return;

        const usuario = this.getUsuario();
        if (!usuario) return;

        try {
            const response = await fetch(`${API_BASE}/registros?usuario_id=${usuario.id}`);
            if (response.ok) {
                const data = await response.json();
                const registros = data.map(r => ({
                    data: r.data,
                    entrada: r.entrada,
                    idaIntervalo: r.ida_intervalo,
                    voltaIntervalo: r.volta_intervalo,
                    saida: r.saida
                }));
                localStorage.setItem('registros_offline', JSON.stringify(registros));
            }
        } catch {}

        try {
            const response = await fetch(`${API_BASE}/carga-horaria?usuario_id=${usuario.id}`);
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('cargaHoraria_offline', JSON.stringify(data));
            }
        } catch {}
    },

    async getRegistros() {
        if (this.useAPI) {
            const usuario = this.getUsuario();
            if (!usuario) return [];

            if (navigator.onLine) {
                try {
                    const response = await fetch(`${API_BASE}/registros?usuario_id=${usuario.id}`);
                    const data = await response.json();
                    const registros = data.map(r => ({
                        data: r.data,
                        entrada: r.entrada,
                        idaIntervalo: r.ida_intervalo,
                        voltaIntervalo: r.volta_intervalo,
                        saida: r.saida
                    }));
                    localStorage.setItem('registros_offline', JSON.stringify(registros));
                    return registros;
                } catch {}
            }

            return JSON.parse(localStorage.getItem('registros_offline')) || [];
        }
        return JSON.parse(localStorage.getItem('registros')) || [];
    },

    setRegistros(registros) {
        if (this.useAPI) {
            localStorage.setItem('registros_offline', JSON.stringify(registros));
        } else {
            localStorage.setItem('registros', JSON.stringify(registros));
        }
    },

    async getRegistroHoje() {
        const hoje = new Date().toISOString().split('T')[0];
        const registros = await this.getRegistros();

        let registro = registros.find(r => r.data === hoje);

        if (!registro) {
            registro = {
                data: hoje,
                entrada: null,
                idaIntervalo: null,
                voltaIntervalo: null,
                saida: null
            };
            registros.push(registro);
            this.setRegistros(registros);

            if (this.useAPI) {
                const usuario = this.getUsuario();
                if (usuario && navigator.onLine) {
                    try {
                        await fetch(`${API_BASE}/registros`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                usuario_id: usuario.id,
                                data: hoje,
                                entrada: null,
                                ida_intervalo: null,
                                volta_intervalo: null,
                                saida: null
                            })
                        });
                    } catch {
                        this.addToSyncQueue({
                            type: 'registro',
                            ...registro
                        });
                    }
                } else if (usuario) {
                    this.addToSyncQueue({
                        type: 'registro',
                        ...registro
                    });
                }
            }
        }

        return registro;
    },

    async salvarRegistro(registro) {
        const registros = await this.getRegistros();
        const index = registros.findIndex(r => r.data === registro.data);
        if (index !== -1) {
            registros[index] = registro;
            this.setRegistros(registros);
        }

        if (this.useAPI) {
            const usuario = this.getUsuario();
            if (usuario && navigator.onLine) {
                try {
                    await fetch(`${API_BASE}/registros`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            usuario_id: usuario.id,
                            data: registro.data,
                            entrada: registro.entrada,
                            ida_intervalo: registro.idaIntervalo,
                            volta_intervalo: registro.voltaIntervalo,
                            saida: registro.saida
                        })
                    });
                    return;
                } catch {}
            }

            if (usuario) {
                this.addToSyncQueue({
                    type: 'registro',
                    ...registro
                });
            }
        }
    },

    async getCargaHoraria() {
        if (this.useAPI) {
            const usuario = this.getUsuario();
            if (usuario && navigator.onLine) {
                try {
                    const response = await fetch(`${API_BASE}/carga-horaria?usuario_id=${usuario.id}`);
                    if (response.ok) {
                        const data = await response.json();
                        localStorage.setItem('cargaHoraria_offline', JSON.stringify(data));
                        return data;
                    }
                } catch {}
            }
            return JSON.parse(localStorage.getItem('cargaHoraria_offline')) || { ...CARGA_DEFAULT };
        }
        return JSON.parse(localStorage.getItem('cargaHoraria')) || { ...CARGA_DEFAULT };
    },

    async setCargaHoraria(carga) {
        if (this.useAPI) {
            const usuario = this.getUsuario();
            localStorage.setItem('cargaHoraria_offline', JSON.stringify(carga));

            if (usuario && navigator.onLine) {
                try {
                    await fetch(`${API_BASE}/carga-horaria`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            usuario_id: usuario.id,
                            entrada: carga.entrada,
                            ida_intervalo: carga.idaIntervalo,
                            volta_intervalo: carga.voltaIntervalo,
                            saida: carga.saida
                        })
                    });
                    return;
                } catch {}
            }

            if (usuario) {
                this.addToSyncQueue({
                    type: 'carga',
                    ...carga
                });
            }
        } else {
            localStorage.setItem('cargaHoraria', JSON.stringify(carga));
        }
    },

    limparDados() {
        localStorage.removeItem('usuario');
        localStorage.removeItem('usuario_api');
        localStorage.removeItem('registros');
        localStorage.removeItem('registros_offline');
        localStorage.removeItem('cargaHoraria');
        localStorage.removeItem('cargaHoraria_offline');
        localStorage.removeItem('sync_queue');
    }
};
