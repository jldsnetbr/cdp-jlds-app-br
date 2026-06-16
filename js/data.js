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
            const response = await fetch(`${API_BASE}/registros`, {
                method: 'GET',
                headers: { 'Authorization': 'Bearer test' }
            });
            this.useAPI = response.status === 401 || response.ok;
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

    getToken() {
        return localStorage.getItem('auth_token');
    },

    setToken(token) {
        localStorage.setItem('auth_token', token);
    },

    clearToken() {
        localStorage.removeItem('auth_token');
    },

    getAuthHeaders() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
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
                        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
                        body: JSON.stringify({
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
                        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
                        body: JSON.stringify({
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

        try {
            const response = await fetch(`${API_BASE}/registros`, {
                headers: this.getAuthHeaders()
            });
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
            const response = await fetch(`${API_BASE}/carga-horaria`, {
                headers: this.getAuthHeaders()
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('cargaHoraria_offline', JSON.stringify(data));
            }
        } catch {}
    },

    async getRegistros() {
        if (this.useAPI) {
            if (navigator.onLine) {
                try {
                    const response = await fetch(`${API_BASE}/registros`, {
                        headers: this.getAuthHeaders()
                    });
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
                        return registros;
                    }
                    if (response.status === 401) {
                        this.clearToken();
                        window.location.href = 'index.html';
                        return [];
                    }
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

            if (this.useAPI && navigator.onLine) {
                try {
                    await fetch(`${API_BASE}/registros`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
                        body: JSON.stringify({
                            data: hoje,
                            entrada: null,
                            ida_intervalo: null,
                            volta_intervalo: null,
                            saida: null
                        })
                    });
                } catch {
                    this.addToSyncQueue({ type: 'registro', ...registro });
                }
            } else if (this.useAPI) {
                this.addToSyncQueue({ type: 'registro', ...registro });
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

        if (this.useAPI && navigator.onLine) {
            try {
                const response = await fetch(`${API_BASE}/registros`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
                    body: JSON.stringify({
                        data: registro.data,
                        entrada: registro.entrada,
                        ida_intervalo: registro.idaIntervalo,
                        volta_intervalo: registro.voltaIntervalo,
                        saida: registro.saida
                    })
                });
                if (response.ok) return;
                if (response.status === 401) {
                    this.clearToken();
                    window.location.href = 'index.html';
                    return;
                }
            } catch {}
        }

        if (this.useAPI) {
            this.addToSyncQueue({ type: 'registro', ...registro });
        }
    },

    async getCargaHoraria() {
        if (this.useAPI) {
            if (navigator.onLine) {
                try {
                    const response = await fetch(`${API_BASE}/carga-horaria`, {
                        headers: this.getAuthHeaders()
                    });
                    if (response.ok) {
                        const data = await response.json();
                        localStorage.setItem('cargaHoraria_offline', JSON.stringify(data));
                        return data;
                    }
                    if (response.status === 401) {
                        this.clearToken();
                        window.location.href = 'index.html';
                        return { ...CARGA_DEFAULT };
                    }
                } catch {}
            }
            return JSON.parse(localStorage.getItem('cargaHoraria_offline')) || { ...CARGA_DEFAULT };
        }
        return JSON.parse(localStorage.getItem('cargaHoraria')) || { ...CARGA_DEFAULT };
    },

    async setCargaHoraria(carga) {
        if (this.useAPI) {
            localStorage.setItem('cargaHoraria_offline', JSON.stringify(carga));

            if (navigator.onLine) {
                try {
                    const response = await fetch(`${API_BASE}/carga-horaria`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
                        body: JSON.stringify({
                            entrada: carga.entrada,
                            ida_intervalo: carga.idaIntervalo,
                            volta_intervalo: carga.voltaIntervalo,
                            saida: carga.saida
                        })
                    });
                    if (response.ok) return;
                    if (response.status === 401) {
                        this.clearToken();
                        window.location.href = 'index.html';
                        return;
                    }
                } catch {}
            }

            this.addToSyncQueue({ type: 'carga', ...carga });
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
        localStorage.removeItem('auth_token');
    }
};
