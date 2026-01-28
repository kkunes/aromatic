const suppliesView = {
    insumos: [],
    activeCategory: 'all',
    filterQuery: '',

    async render() {
        this.insumos = await db.getCollection('insumos');

        // Obtener categorías únicas
        const categories = ['all', ...new Set(this.insumos.map(i => i.categoria || 'General'))];

        // Filtrar insumos por categoría y búsqueda
        const filteredInsumos = this.insumos.filter(i => {
            const matchesCat = this.activeCategory === 'all' || (i.categoria || 'General') === this.activeCategory;
            const matchesSearch = i.nombre.toLowerCase().includes(this.filterQuery.toLowerCase());
            return matchesCat && matchesSearch;
        });

        return `
            <div class="supplies-container fade-in" style="height: 100%; display: flex; flex-direction: column;">
                <div class="view-header" style="flex-shrink: 0; margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <button class="btn-icon-small" onclick="app.switchView('inventory')" style="background: white; border: 1px solid #e2e8f0; width: 40px; height: 40px;">
                            <i data-lucide="arrow-left"></i>
                        </button>
                        <div>
                            <h1 style="margin: 0;">Gestión de Insumos</h1>
                            <p style="color: var(--text-muted); margin-top: 5px;">Administra tu inventario y costos.</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-secondary" onclick="app.switchView('waste')" style="display: flex; align-items: center; gap: 8px; border-color: #fca5a5; color: #b91c1c; background: #fef2f2;">
                            <i data-lucide="trash-2"></i> Ver Mermas
                        </button>
                        <button class="btn-primary" id="addInsumoBtn">
                            <i data-lucide="plus"></i> Nuevo Insumo
                        </button>
                    </div>
                </div>

                <!-- Tabs de Categorías -->
                <div class="category-filters hide-scrollbar" style="flex-shrink: 0; margin-bottom: 20px; padding-bottom: 5px;">
                    <button class="chip ${this.activeCategory === 'all' ? 'active' : ''}" 
                            onclick="suppliesView.filterCategory('all')">
                        Todo
                    </button>
                    ${categories.filter(c => c !== 'all').map(cat => `
                        <button class="chip ${this.activeCategory === cat ? 'active' : ''}" 
                                onclick="suppliesView.filterCategory('${cat}')">
                            ${cat}
                        </button>
                    `).join('')}
                </div>

                <div class="stats-grid" style="flex-shrink: 0; margin-bottom: 25px; margin-top: 0;">
                    <div class="stat-card">
                        <span class="stat-label">Total Items</span>
                        <span class="stat-value">${this.insumos.length}</span>
                    </div>
                    <div class="stat-card warning">
                        <span class="stat-label">Stock Bajo</span>
                        <span class="stat-value" style="color: #eab308;">${this.insumos.filter(i => i.stock <= i.stockMinimo).length}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Valor Inventario</span>
                        <span class="stat-value" style="color: var(--success);">$${this.insumos.reduce((sum, i) => sum + (i.stock * (i.costoUnitario || 0)), 0).toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="table-container hide-scrollbar" style="flex: 1; overflow-y: auto; margin-top: 0;">
                    <table class="modern-table">
                        <thead style="position: sticky; top: 0; background: white; z-index: 10;">
                            <tr>
                                <th>Insumo</th>
                                <th>Categoría</th>
                                <th>Stock</th>
                                <th>Costo Unit.</th>
                                <th>Precio Extra</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredInsumos.map(i => `
                                <tr>
                                    <td>
                                        <div class="supply-info">
                                            <strong style="font-size: 1rem; color: var(--primary);">${i.nombre}</strong>
                                            <small style="color: var(--text-muted);">${i.stockMinimo} ${i.unidad} (Mínimo)</small>
                                        </div>
                                    </td>
                                    <td>
                                        <span style="background: #f1f5f9; color: #64748b; padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: 500;">
                                            ${i.categoria || 'General'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="stock-indicator">
                                            <span class="stock-text ${i.stock <= i.stockMinimo ? 'text-danger' : ''}">
                                                ${i.stock.toFixed(2)} ${i.unidad}
                                            </span>
                                            <div class="stock-bar">
                                                <div class="stock-fill" style="width: ${Math.min((i.stock / (Math.max(i.stock, i.stockMinimo * 2) || 1)) * 100, 100)}%; background: ${i.stock <= i.stockMinimo ? 'var(--danger)' : 'var(--success)'}"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="font-weight: 600;">
                                        $${(i.costoUnitario || 0).toFixed(2)}
                                    </td>
                                    <td>
                                        ${i.precioExtra > 0 ? `<span class="badge primary">$${i.precioExtra.toFixed(2)}</span>` : '<span style="color: #cbd5e1;">-</span>'}
                                    </td>
                                    <td>
                                        <div style="display: flex; gap: 8px;">
                                            <button class="btn-icon-small" onclick="suppliesView.editInsumo('${i.id}')" title="Editar" style="color: var(--primary); background: #f8fafc; border: 1px solid #e2e8f0;">
                                                <i data-lucide="edit-2" style="width: 16px;"></i>
                                            </button>
                                            <button class="btn-secondary btn-sm" onclick="suppliesView.surtirInsumo('${i.id}')" style="padding: 0 12px; font-size: 0.8rem; height: 32px; display: flex; align-items: center; gap: 6px;">
                                                <i data-lucide="package-plus" style="width: 14px;"></i> Surtir
                                            </button>
                                            <button class="btn-icon-small danger" onclick="suppliesView.deleteInsumo('${i.id}')" title="Eliminar" style="background: #fef2f2; border: 1px solid #fecaca;">
                                                <i data-lucide="trash-2" style="width: 16px;"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                            ${filteredInsumos.length === 0 ? `
                                <tr>
                                    <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
                                        No hay insumos en esta categoría.
                                    </td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    filterCategory(cat) {
        this.activeCategory = cat;
        this.refreshGrid();
    },

    filter(query) {
        this.filterQuery = query;
        this.refreshGrid();
    },

    async refreshGrid() {
        const container = document.getElementById('view-container');
        if (this.app && this.app.currentView === 'supplies') {
            const html = await this.render();
            container.innerHTML = `<div class="view-enter">${html}</div>`;
            container.scrollTop = 0; // Reset scroll to top
            if (typeof lucide !== 'undefined') lucide.createIcons();
            this.bindEvents(this.app);
        }
    },

    bindEvents(appInstance) {
        this.app = appInstance;
        const addBtn = document.getElementById('addInsumoBtn');
        if (addBtn) {
            addBtn.onclick = () => this.showInsumoModal();
        }
    },

    editInsumo(id) {
        const insumo = this.insumos.find(i => i.id === id);
        if (insumo) this.showInsumoModal(insumo);
    },

    showInsumoModal(insumo = null) {
        const isEdit = !!insumo;
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        // Categorías existentes para sugerencias
        const existingCats = [...new Set(this.insumos.map(i => i.categoria || 'General'))];

        modalContent.innerHTML = `
            <div class="insumo-form-modal" style="width: 600px; max-width: 95vw;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #f1f5f9;">
                    <h2 style="margin: 0; color: var(--primary);">${isEdit ? 'Editar Insumo' : 'Nuevo Insumo'}</h2>
                    <button class="btn-icon-small" id="closeInsModalTop"><i data-lucide="x"></i></button>
                </div>

                <form id="insumoForm" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    
                    <div class="input-group" style="grid-column: span 2;">
                        <label>Nombre del Insumo</label>
                        <input type="text" id="insNombre" value="${isEdit ? insumo.nombre : ''}" required class="large-input" style="font-size: 1.1rem;">
                    </div>

                    <div class="input-group">
                        <label>Categoría</label>
                        <input type="text" id="insCategoria" list="catList" value="${isEdit ? (insumo.categoria || 'General') : ''}" class="large-input" placeholder="Ej: Lácteos">
                        <datalist id="catList">
                            ${existingCats.map(c => `<option value="${c}">`).join('')}
                            <option value="Lácteos">
                            <option value="Jarabes">
                            <option value="Café">
                            <option value="Desechables">
                            <option value="Panadería">
                        </datalist>
                    </div>

                    <div class="input-group">
                        <label>Unidad de Medida</label>
                        <select id="insUnidad" required class="large-input">
                            <option value="pz" ${isEdit && insumo.unidad === 'pz' ? 'selected' : ''}>Piezas (pz)</option>
                            <option value="lt" ${isEdit && insumo.unidad === 'lt' ? 'selected' : ''}>Litros (lt)</option>
                            <option value="ml" ${isEdit && insumo.unidad === 'ml' ? 'selected' : ''}>Mililitros (ml)</option>
                            <option value="kg" ${isEdit && insumo.unidad === 'kg' ? 'selected' : ''}>Kilogramos (kg)</option>
                            <option value="gr" ${isEdit && insumo.unidad === 'gr' ? 'selected' : ''}>Gramos (gr)</option>
                            <option value="oz" ${isEdit && insumo.unidad === 'oz' ? 'selected' : ''}>Onzas (oz)</option>
                        </select>
                    </div>

                    <div class="input-group">
                        <label>Stock Actual</label>
                        <input type="number" id="insStock" step="0.01" value="${isEdit ? insumo.stock : ''}" required class="large-input">
                    </div>

                    <div class="input-group">
                        <label>Stock Mínimo (Alerta)</label>
                        <input type="number" id="insMinimo" step="0.01" value="${isEdit ? insumo.stockMinimo : ''}" required class="large-input">
                    </div>

                    <div class="input-group">
                        <label title="Costo por unidad de medida">Costo Unitario ($)</label>
                        <input type="number" id="insCosto" step="0.01" value="${isEdit ? (insumo.costoUnitario || 0) : ''}" placeholder="0.00" class="large-input" style="border-color: #cbd5e1;">
                        <small style="color: #64748b;">Costo para tus recetas.</small>
                    </div>

                    <div class="input-group">
                        <label title="Precio si se vende como extra">Precio Extra ($)</label>
                        <input type="number" id="insPrecioExtra" step="0.01" value="${isEdit ? (insumo.precioExtra || 0) : 0}" placeholder="0.00" class="large-input">
                        <small style="color: #64748b;">Opcional (para venta al público).</small>
                    </div>

                    <div style="grid-column: span 2; margin-top: 20px; display: flex; gap: 15px;">
                        <button type="button" class="btn-secondary" id="closeInsModal" style="flex: 1; padding: 15px;">Cancelar</button>
                        <button type="submit" class="btn-primary" style="flex: 2; padding: 15px;">${isEdit ? 'Guardar Cambios' : 'Registrar Insumo'}</button>
                    </div>
                </form>
            </div>
        `;

        modal.classList.remove('hidden');
        audioService.playPop(); // Premium sound
        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('closeInsModal').onclick = () => modal.classList.add('hidden');
        document.getElementById('closeInsModalTop').onclick = () => modal.classList.add('hidden');

        document.getElementById('insumoForm').onsubmit = async (e) => {
            e.preventDefault();
            const data = {
                nombre: document.getElementById('insNombre').value,
                categoria: document.getElementById('insCategoria').value || 'General',
                unidad: document.getElementById('insUnidad').value,
                stock: parseFloat(document.getElementById('insStock').value),
                stockMinimo: parseFloat(document.getElementById('insMinimo').value),
                costoUnitario: parseFloat(document.getElementById('insCosto').value) || 0,
                precioExtra: parseFloat(document.getElementById('insPrecioExtra').value) || 0
            };

            if (isEdit) {
                await db.updateDocument('insumos', insumo.id, data);
                await db.logAction('inventario', 'actualizar_insumo', `Insumo: "${data.nombre}", Stock: ${data.stock} ${data.unidad}`);
                app.showToast('Insumo actualizado');
            } else {
                await db.addDocument('insumos', data);
                await db.logAction('inventario', 'crear_insumo', `Insumo: "${data.nombre}", Inicial: ${data.stock} ${data.unidad}`);
                app.showToast('Insumo registrado');
            }

            modal.classList.add('hidden');
            this.app.renderView('supplies');
        };
    },

    async surtirInsumo(id) {
        const insumo = this.insumos.find(i => i.id === id);
        if (!insumo) return;

        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        modalContent.innerHTML = `
            <div style="width: 400px; text-align: center;">
                <h2 style="margin-bottom: 10px;">Surtir Inventario</h2>
                <p style="color: var(--text-muted); margin-bottom: 20px;">${insumo.nombre} (${insumo.unidad})</p>
                
                <input type="number" id="surtirCant" placeholder="Cantidad a agregar" class="large-input" style="text-align: center; margin-bottom: 20px;" autofocus>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <button class="btn-secondary" onclick="document.getElementById('modalContainer').classList.add('hidden')">Cancelar</button>
                    <button class="btn-primary" id="confirmSurtir">Confirmar</button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        audioService.playPop(); // Premium sound
        document.getElementById('surtirCant').focus();

        document.getElementById('confirmSurtir').onclick = async () => {
            const cant = parseFloat(document.getElementById('surtirCant').value);
            if (cant && !isNaN(cant) && cant > 0) {
                const nuevoStock = insumo.stock + cant;
                await db.updateDocument('insumos', id, { stock: nuevoStock });
                await db.logAction('inventario', 'surtir_insumo', `Surtido: +${cant} ${insumo.unidad} a "${insumo.nombre}"`);
                app.showToast(`Stock actualizado: ${nuevoStock.toFixed(2)} ${insumo.unidad}`);
                modal.classList.add('hidden');
                this.app.renderView('supplies');
            }
        };
    },

    async deleteInsumo(id) {
        const confirm = await app.showConfirmModal({
            title: 'Eliminar Insumo',
            message: '¿Estás seguro? Esto podría afectar recetas que usen este insumo.',
            type: 'danger',
            confirmText: 'Sí, Eliminar'
        });

        if (confirm) {
            const insumo = this.insumos.find(i => i.id === id);
            await db.deleteDocument('insumos', id);
            await db.logAction('inventario', 'eliminar_insumo', `Insumo: "${insumo?.nombre}"`);
            app.showToast('Insumo eliminado');
            this.app.renderView('supplies');
        }
    }
};
