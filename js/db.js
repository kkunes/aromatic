/**
 * Database Layer for Aromatic POS
 * Handles Firestore communication or falls back to LocalStorage for demo
 */

const db = {
    firestore: typeof firebase !== 'undefined' ? firebase.firestore() : null,
    isMock: false,
    _localDB: null,

    async initLocalDB() {
        if (this._localDB) return this._localDB;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('AromaticLocalDB', 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('collections')) {
                    db.createObjectStore('collections');
                }
            };
            request.onsuccess = (e) => {
                this._localDB = e.target.result;
                resolve(this._localDB);
            };
            request.onerror = (e) => reject(e);
        });
    },

    async getLocalCollection(name) {
        const db = await this.initLocalDB();
        return new Promise((resolve) => {
            const transaction = db.transaction(['collections'], 'readonly');
            const store = transaction.objectStore('collections');
            const request = store.get(name);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => resolve([]);
        });
    },

    async setLocalCollection(name, data) {
        const db = await this.initLocalDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['collections'], 'readwrite');
            const store = transaction.objectStore('collections');
            const request = store.put(data, name);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e);
        });
    },

    async getCollection(name) {
        const settings = this.getSettings();
        if (settings.databaseConfig?.modoLocal || !this.firestore) return this.getLocalCollection(name);
        try {
            const snapshot = await this.firestore.collection(name).get();
            return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        } catch (e) {
            console.warn(`Firestore fail, falling back to mock for ${name}`);
            return this.getMockData(name);
        }
    },

    async getActivePromotions() {
        const settings = this.getSettings();
        if (!settings.promociones?.activo) return [];

        const allPromos = await this.getCollection('promociones');
        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(); // e.g. monday
        const currentTime = now.getHours() * 100 + now.getMinutes();

        return allPromos.filter(p => {
            if (!p.activo) return false;

            // Day check
            if (!p.dias.includes(currentDay) && !p.dias.includes('todos')) return false;

            // Time check (HHMM format)
            const start = parseInt(p.horaInicio.replace(':', ''));
            const end = parseInt(p.horaFin.replace(':', ''));
            if (currentTime < start || currentTime > end) return false;

            return true;
        });
    },


    async exportAllData() {
        const collections = ['productos', 'insumos', 'categorias', 'ventas', 'clientes', 'mesas', 'mermas', 'usuarios', 'audit_logs'];
        const data = {};
        for (const col of collections) {
            data[col] = await this.getCollection(col);
        }
        data.settings = this.getSettings();
        return JSON.stringify(data, null, 2);
    },

    async importAllData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            for (const key in data) {
                if (key === 'settings') {
                    this.saveSettings(data[key]);
                } else {
                    this.saveMockData(key, data[key]);
                }
            }
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    },

    async uploadToCloud(dataUrl) {
        const settings = this.getSettings();
        if (!settings.imgbb_api_key) return null;

        const formData = new FormData();
        formData.append('image', dataUrl.split(',')[1]); // Base64 part

        try {
            const response = await fetch(`https://api.imgbb.com/1/upload?key=${settings.imgbb_api_key}`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            return result.data.url;
        } catch (e) {
            console.error('Cloud upload failed:', e);
            return null;
        }
    },


    async addDocument(collection, data) {
        const settings = this.getSettings();
        if (settings.databaseConfig?.modoLocal || !this.firestore) {
            const current = await this.getLocalCollection(collection);
            const newItem = { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() };
            current.push(newItem);
            await this.setLocalCollection(collection, current);
            return newItem;
        }
        return this.firestore.collection(collection).add({
            ...data,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    async setDocument(collection, id, data) {
        const settings = this.getSettings();
        if (settings.databaseConfig?.modoLocal || !this.firestore) {
            const current = await this.getLocalCollection(collection);
            const index = current.findIndex(i => i.id === id);
            if (index >= 0) {
                current[index] = { ...data, id };
            } else {
                current.push({ ...data, id, createdAt: new Date().toISOString() });
            }
            await this.setLocalCollection(collection, current);
            return;
        }
        return this.firestore.collection(collection).doc(id).set({
            ...data,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    },

    async updateDocument(collection, id, data) {
        const settings = this.getSettings();
        if (settings.databaseConfig?.modoLocal || !this.firestore) {
            const current = await this.getLocalCollection(collection);
            const index = current.findIndex(item => item.id === id);
            if (index !== -1) {
                current[index] = { ...current[index], ...data };
                await this.setLocalCollection(collection, current);
            }
            return;
        }
        return this.firestore.collection(collection).doc(id).update(data);
    },

    async deleteDocument(collection, id) {
        const settings = this.getSettings();
        if (settings.databaseConfig?.modoLocal || !this.firestore) {
            const current = await this.getLocalCollection(collection);
            const filtered = current.filter(item => item.id !== id);
            await this.setLocalCollection(collection, filtered);
            return;
        }
        return this.firestore.collection(collection).doc(id).delete();
    },

    async initializeDatabase() {
        if (!this.firestore) return;

        console.log("Checking database status...");
        const snapshot = await this.firestore.collection('productos').limit(1).get();

        if (snapshot.empty) {
            console.log("Empty database detected. Seeding initial data...");

            const defaults = this.getDefaults();

            // Seed Productos
            for (const p of defaults.productos) {
                const { id, ...data } = p;
                await this.firestore.collection('productos').add({
                    ...data,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            // Seed Insumos
            for (const i of defaults.insumos) {
                const { id, ...data } = i;
                await this.firestore.collection('insumos').add({
                    ...data,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            // Seed Mesas
            for (const m of defaults.mesas) {
                const { id, ...data } = m;
                // Usamos set con el ID específico para mantener identificadores legibles (M1, T1...)
                await this.firestore.collection('mesas').doc(m.id).set({
                    ...data,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            console.log("Database seeded successfully!");
            return true;
        }
        return false;
    },

    getDefaults() {
        return {
            categorias: [
                { nombre: 'Café', icono: 'coffee' },
                { nombre: 'Repostería', icono: 'pie-chart' },
                { nombre: 'Especiales', icono: 'star' },
                { nombre: 'Bebidas Frías', icono: 'droplet' }
            ],
            productos: [
                { nombre: 'Espresso', precio: 45, categoria: 'Café', imagen: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=200&h=200&fit=crop' },
                { nombre: 'Cappuccino', precio: 55, categoria: 'Café', imagen: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=200&h=200&fit=crop', insumos: [{ idInsumo: '2', cantidad: 0.2 }] },
                { nombre: 'Latte Art', precio: 65, categoria: 'Café', imagen: 'https://images.unsplash.com/photo-1534706936160-d5ee67737049?w=200&h=200&fit=crop' },
                { nombre: 'Muffin Arándano', precio: 40, categoria: 'Repostería', imagen: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=200&h=200&fit=crop' },
                { nombre: 'Croissant', precio: 48, categoria: 'Repostería', imagen: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&h=200&fit=crop' },
                { nombre: 'Matcha Latte', precio: 75, categoria: 'Especiales', imagen: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=200&h=200&fit=crop' },
            ],
            insumos: [
                { id: '1', nombre: 'Café en Grano', unidad: 'kg', stock: 15, stockMinimo: 5, precioExtra: 0 },
                { id: '2', nombre: 'Leche Entera', unidad: 'lt', stock: 24, stockMinimo: 6, precioExtra: 15 },
                { id: '3', nombre: 'Azúcar Blanca', unidad: 'kg', stock: 10, stockMinimo: 2, precioExtra: 5 },
            ],
            mesas: [
                { id: 'M1', nombre: 'Mesa 1', area: 'Principal', estado: 'libre', orden: null, capacidad: 4 },
                { id: 'M2', nombre: 'Mesa 2', area: 'Principal', estado: 'libre', orden: null, capacidad: 4 },
                { id: 'M3', nombre: 'Mesa 3', area: 'Principal', estado: 'libre', orden: null, capacidad: 2 },
                { id: 'M4', nombre: 'Mesa 4', area: 'Principal', estado: 'libre', orden: null, capacidad: 6 },
                { id: 'T1', nombre: 'Terraza 1', area: 'Terraza', estado: 'libre', orden: null, capacidad: 4 },
                { id: 'T2', nombre: 'Terraza 2', area: 'Terraza', estado: 'libre', orden: null, capacidad: 4 },
                { id: 'B1', nombre: 'Barra 1', area: 'Barra', estado: 'libre', orden: null, capacidad: 1 },
                { id: 'B2', nombre: 'Barra 2', area: 'Barra', estado: 'libre', orden: null, capacidad: 1 },
            ],
            usuarios: [
                { id: 'U1', nombre: 'Administrador', usuario: 'admin', clave: '1234', rol: 'admin', avatar: 'AD' },
                { id: 'U2', nombre: 'Cajero Principal', usuario: 'cajero', clave: '4321', rol: 'cajero', avatar: 'CP' },
                { id: 'U3', nombre: 'Mesero Juan', usuario: 'juan', clave: '0000', rol: 'mesero', avatar: 'MJ' }
            ],
            promociones: [
                {
                    id: 'P1',
                    nombre: 'Happy Hour Americanos',
                    tipo: '2x1',
                    valor: 2,
                    activo: true,
                    dias: ['monday', 'tuesday', 'wednesday', 'thursday'],
                    horaInicio: '16:00',
                    horaFin: '18:00',
                    aplicaA: 'productos',
                    itemsIds: ['P1'] // Assuming Espresso or similar
                }
            ]
        };
    },

    // Mock Data for Demo
    getMockData(name) {
        const data = localStorage.getItem(`mock_${name}`);
        if (data) return JSON.parse(data);

        // Default Mock Data
        const defaults = this.getDefaults();
        defaults.ventas = [];
        defaults.cortes = [];

        this.saveMockData(name, defaults[name] || []);
        return defaults[name] || [];
    },

    saveMockData(name, data) {
        localStorage.setItem(`mock_${name}`, JSON.stringify(data));
    },

    addMockData(collection, data) {
        const current = this.getMockData(collection);
        const newItem = { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() };
        current.push(newItem);
        this.saveMockData(collection, current);
        return newItem;
    },

    updateMockData(collection, id, data) {
        const current = this.getMockData(collection);
        const index = current.findIndex(item => item.id === id);
        if (index !== -1) {
            current[index] = { ...current[index], ...data };
            this.saveMockData(collection, current);
        }
    },

    deleteMockData(collection, id) {
        const current = this.getMockData(collection);
        const filtered = current.filter(item => item.id !== id);
        this.saveMockData(collection, filtered);
    },

    async logAction(context, action, details) {
        const settings = this.getSettings();
        if (!settings.auditoria?.activo) return;

        const user = this.getCurrentUser();
        const event = {
            id: Date.now().toString(),
            usuarioId: user.id || 'system',
            usuarioNombre: user.nombre || 'Sistema',
            rol: user.rol,
            context, // 'ventas', 'inventario', 'config', 'usuarios'
            action, // 'anular', 'eliminar', 'cambiar_precio'
            details,
            timestamp: new Date().toISOString()
        };

        const logs = this.getMockData('audit_logs') || [];
        logs.unshift(event); // Newest first
        this.saveMockData('audit_logs', logs.slice(0, 500)); // Keep last 500

        console.log(`[AUDIT] ${event.usuarioNombre} (${event.rol}) -> ${action} en ${context}`);
    },

    async compressImage(dataUrl, maxWidth = 400, quality = 0.7) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = dataUrl;
        });
    },


    getSettings() {
        const defaults = {
            manejarIVA: true,
            porcentajeIVA: 16,
            folioInicio: 1,
            folioActual: 1,
            negocio: {
                nombre: 'AROMATIC',
                eslogan: 'Cafetería Gourmet',
                logo: 'recursos/logo efimero.png',
                direccion: 'Calle del Aroma #123, Ciudad del Café',
                telefono: '123-456-7890',
                rfc: 'ARO-123456-ABC',
                mensajeTicket: '*** Gracias por su compra ***'
            },
            ticketConfig: {
                mostrarLogo: true,
                mostrarEslogan: true,
                mostrarDireccion: true,
                mostrarTelefono: true,
                mostrarRFC: true,
                mostrarNotas: true,
                mostrarExtras: true,
                tamanoFuente: 12,
                anchoPapel: 58 // mm
            },
            fidelizacion: {
                activo: true,
                puntosPorDinero: 1, // X puntos...
                dineroBase: 10,     // ...por cada $Y (ej: 1 punto por cada $10)
                valorPunto: 0.5, // cada punto vale $0.50
                puntosParaCanje: 100, // mínimo de puntos para canjear
                conversiones: [
                    { puntos: 1, valor: 0.5 }
                ],
                niveles: [
                    { id: 'bronce', nombre: 'Bronce', minPuntos: 0, color: '#cd7f32', beneficios: 'Ganancia normal de puntos', multiplicadorPuntos: 1, multiplicadorValor: 1 },
                    { id: 'plata', nombre: 'Plata', minPuntos: 300, color: '#c0c0c0', beneficios: '10% extra en valor de puntos', multiplicadorPuntos: 1.1, multiplicadorValor: 1.1 },
                    { id: 'oro', nombre: 'Oro', minPuntos: 1000, color: '#ffd700', beneficios: 'Bebida de cortesía mensual + 25% valor puntos', multiplicadorPuntos: 1.2, multiplicadorValor: 1.25 },
                    { id: 'platino', nombre: 'Platino', minPuntos: 2500, color: '#e5e4e2', beneficios: 'Postre de cortesía semanal + 50% valor puntos', multiplicadorPuntos: 1.5, multiplicadorValor: 1.5 }
                ]
            },
            auditoria: {
                activo: true
            },
            databaseConfig: {
                modoLocal: false
            }
        };
        const saved = localStorage.getItem('aromatic_settings');
        if (!saved) return defaults;

        const parsed = JSON.parse(saved);
        return {
            ...defaults,
            ...parsed,
            folioInicio: parsed.folioInicio ?? defaults.folioInicio,
            folioActual: parsed.folioActual ?? defaults.folioActual,
            negocio: {
                ...defaults.negocio,
                ...(parsed.negocio || {})
            },
            ticketConfig: {
                ...defaults.ticketConfig,
                ...(parsed.ticketConfig || {})
            },
            fidelizacion: {
                ...defaults.fidelizacion,
                ...(parsed.fidelizacion || {})
            },
            auditoria: {
                ...defaults.auditoria,
                ...(parsed.auditoria || {})
            },
            promociones: {
                activo: parsed.promociones?.activo ?? true
            }
        };
    },

    saveSettings(settings) {
        localStorage.setItem('aromatic_settings', JSON.stringify(settings));
    },

    getCurrentUser() {
        const saved = localStorage.getItem('aromatic_current_user');
        if (saved) return JSON.parse(saved);
        // Default to admin for first run
        const admin = this.getMockData('usuarios').find(u => u.rol === 'admin');
        return admin || { nombre: 'Visitante', rol: 'mesero', avatar: 'V' };
    },

    setCurrentUser(user) {
        localStorage.setItem('aromatic_current_user', JSON.stringify(user));
    },

    getNextFolio() {
        const settings = this.getSettings();
        const currentFolio = settings.folioActual || settings.folioInicio || 1;

        settings.folioActual = currentFolio + 1;
        this.saveSettings(settings);

        return currentFolio;
    }
};
