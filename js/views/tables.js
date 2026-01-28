const tablesView = {
    mesas: [],
    activeFilter: 'all',

    async render() {
        this.mesas = await db.getCollection('mesas');

        // Agrupar áreas únicas para los filtros
        const areas = ['all', ...new Set(this.mesas.map(m => m.area))];

        return `
            <div class="tables-view fade-in" style="height: 100%; display: flex; flex-direction: column;">
                <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <h1 style="margin: 0;">Gestión de Mesas</h1>
                        <p style="color: var(--text-muted); margin-top: 4px;">Seleccione una mesa para tomar orden o cobrar.</p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-primary" onclick="app.openCounterSale()">
                            <i data-lucide="shopping-bag"></i> Venta Mostrador
                        </button>
                        <button class="btn-secondary" onclick="tablesView.openConfigModal()" style="display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="settings"></i> Configurar Mesas
                        </button>
                    </div>
                </div>

                <div class="area-filters" style="display: flex; gap: 10px; margin-bottom: 30px; overflow-x: auto; padding-bottom: 5px;">
                    ${areas.map(area => `
                        <button class="filter-chip ${this.activeFilter === area ? 'active' : ''}" 
                                onclick="tablesView.filterByArea('${area}')">
                            ${area === 'all' ? 'Todas las Áreas' : area}
                        </button>
                    `).join('')}
                </div>

                <div class="tables-grid" id="tablesGrid">
                    ${this.renderGrid(this.activeFilter)}
                </div>
            </div>
            
            <style>
                .filter-chip {
                    padding: 10px 20px;
                    border-radius: 20px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    color: #64748b;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                .filter-chip.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .tables-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 24px;
                    padding-bottom: 40px;
                }
                .table-card {
                    background: white;
                    border-radius: 24px;
                    padding: 24px;
                    position: relative;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 2px solid transparent;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    min-height: 180px;
                }
                .table-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                }
                
                /* Estado: LIBRE */
                .table-card.free {
                    border-color: #e2e8f0;
                }
                .table-card.free .table-icon {
                    background: #f0fdf4;
                    color: #16a34a;
                }
                
                /* Estado: OCUPADA */
                .table-card.occupied {
                    border-color: #fee2e2;
                    background: #fffafa;
                }
                .table-card.occupied .table-icon {
                    background: #fee2e2;
                    color: #ef4444;
                }
                .table-card.occupied .status-badge {
                    background: #ef4444;
                    color: white;
                }

                .table-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .table-icon {
                    width: 50px;
                    height: 50px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                }
                .table-name {
                    font-size: 1.2rem;
                    font-weight: 700;
                    margin: 15px 0 5px;
                }
                .table-info {
                    font-size: 0.9rem;
                    color: var(--text-muted);
                }
                .table-total {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: var(--primary);
                    margin-top: auto;
                }
                .status-indicator {
                    position: absolute;
                    top: 24px;
                    right: 24px;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                }
            </style>
        `;
    },

    openConfigModal(editingId = null) {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        const editData = editingId ? this.mesas.find(m => m.id === editingId) : null;

        modalContent.innerHTML = `
            <div style="width: 850px; max-width: 95vw; height: 80vh; max-height: 800px; display: flex; flex-direction: column;">
                
                <!-- Encabezado Compacto -->
                <div style="flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0;">
                    <div>
                        <h2 style="margin: 0; font-size: 1.4rem; color: #0f172a;">Configuración de Mesas</h2>
                    </div>
                    <button class="btn-icon-small" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="width: 36px; height: 36px; background: #f1f5f9; border-radius: 50%;">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                
                <!-- Formulario Horizontal Compacto -->
                <div style="flex-shrink: 0; background: #f8fafc; padding: 15px; border-radius: 16px; border: 1px solid #cbd5e1; margin-bottom: 15px; box-shadow: 0 2px 4px -1px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0; color: var(--primary); font-size: 1rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                            ${editData ? '<i data-lucide="edit-2" style="width: 16px;"></i> Editando' : '<i data-lucide="plus-circle" style="width: 16px;"></i> Nueva Mesa'}
                        </h4>
                         ${editData ? `<button onclick="tablesView.openConfigModal()" style="font-size: 0.8rem; color: #64748b; background: white; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 20px; cursor: pointer;">Cancelar</button>` : ''}
                    </div>

                    <form id="addTableForm" style="display: grid; grid-template-columns: 1.5fr 1.5fr 1fr auto; gap: 12px; align-items: end;">
                        <input type="hidden" id="editTableId" value="${editData ? editData.id : ''}">
                        
                        <div class="input-group" style="margin: 0;">
                            <label style="font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: #475569;">Identificador</label>
                            <input type="text" id="newTableName" placeholder="Ej: Mesa 1" required 
                                   value="${editData ? editData.nombre : ''}"
                                   style="height: 42px; font-size: 1rem; border-radius: 10px; border: 1px solid #cbd5e1; padding: 0 12px;">
                        </div>
                        
                        <div class="input-group" style="margin: 0;">
                            <label style="font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: #475569;">Zona</label>
                            <input type="text" id="newTableArea" placeholder="Ej: Terraza" required list="areaSuggestions"
                                   value="${editData ? editData.area : ''}"
                                   style="height: 42px; font-size: 1rem; border-radius: 10px; border: 1px solid #cbd5e1; padding: 0 12px;">
                             <datalist id="areaSuggestions">
                                <option value="Principal">
                                <option value="Terraza">
                                <option value="Barra">
                            </datalist>
                        </div>
                        
                        <div class="input-group" style="margin: 0;">
                            <label style="font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: #475569;">Personas</label>
                            <div style="position: relative;">
                                <input type="number" id="newTableCap" placeholder="4" value="${editData ? editData.capacidad : '4'}" min="1" required
                                       style="height: 42px; font-size: 1rem; border-radius: 10px; border: 1px solid #cbd5e1; padding-left: 35px; width: 100%;">
                                <i data-lucide="users" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); width: 16px; color: #64748b;"></i>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn-primary" style="height: 42px; padding: 0 20px; border-radius: 10px; font-weight: 700; ${editData ? 'background: #f59e0b; border-color: #f59e0b;' : ''}">
                            <i data-lucide="${editData ? 'save' : 'plus'}" style="width: 18px;"></i>
                            ${editData ? 'GUARDAR' : 'AGREGAR'}
                        </button>
                    </form>
                </div>

                <!-- Lista Grid (Scrollable) -->
                <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0;">
                    <h4 style="flex-shrink: 0; margin: 0 0 10px 0; color: #334155; font-size: 1rem; display: flex; align-items: center; justify-content: space-between;">
                        <span>Inventario Actual</span>
                        <span style="background: #e2e8f0; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem;">${this.mesas.length} Mesas</span>
                    </h4>
                    
                    <div class="hide-scrollbar" style="overflow-y: auto; padding: 5px; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; grid-auto-rows: max-content;">
                        <style>
                            .conf-card {
                                background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px;
                                display: flex; flex-direction: column; gap: 8px; transition: all 0.2s;
                            }
                            .conf-card:hover { border-color: var(--primary); transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                        </style>

                        ${this.mesas.map(m => `
                            <div class="conf-card">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div style="width: 32px; height: 32px; background: ${m.estado === 'ocupada' ? '#fee2e2' : '#f0fdf4'}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: ${m.estado === 'ocupada' ? '#ef4444' : '#16a34a'};">
                                            <i data-lucide="${m.estado === 'ocupada' ? 'users' : 'utensils'}" style="width: 16px;"></i>
                                        </div>
                                        <span style="font-weight: 700; color: #1e293b; font-size: 1rem;">${m.nombre}</span>
                                    </div>
                                    ${m.estado === 'ocupada' ? '<span style="font-size: 0.7rem; background: #fff7ed; color: #ea580c; padding: 2px 6px; border-radius: 4px; border: 1px solid #ffedd5;">Ocupada</span>' : ''}
                                </div>
                                
                                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: #64748b;">
                                    <span>${m.area}</span>
                                    <span><i data-lucide="users" style="width: 12px; display: inline-block;"></i> ${m.capacidad}</span>
                                </div>
                                
                                <div style="display: flex; gap: 8px; margin-top: 4px;">
                                    ${m.estado === 'libre' ? `
                                        <button onclick="tablesView.openConfigModal('${m.id}')" style="flex: 1; padding: 6px; border-radius: 8px; border: 1px solid #bfdbfe; background: #eff6ff; color: #2563eb; cursor: pointer; display: flex; justify-content: center; align-items: center;" title="Editar">
                                            <i data-lucide="edit-3" style="width: 14px;"></i>
                                        </button>
                                        <button onclick="tablesView.deleteTable('${m.id}')" style="flex: 1; padding: 6px; border-radius: 8px; border: 1px solid #fecaca; background: #fef2f2; color: #dc2626; cursor: pointer; display: flex; justify-content: center; align-items: center;" title="Eliminar">
                                            <i data-lucide="trash-2" style="width: 14px;"></i>
                                        </button>
                                    ` : `
                                        <button disabled style="width: 100%; padding: 6px; border-radius: 8px; border: 1px solid #f1f5f9; background: #f8fafc; color: #94a3b8; cursor: not-allowed; display: flex; justify-content: center; align-items: center; font-size: 0.8rem; font-weight: 600;">
                                            <i data-lucide="lock" style="width: 12px; margin-right: 6px;"></i> Mesa Ocupada
                                        </button>
                                    `}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        modal.classList.remove('hidden');
        audioService.playPop(); // Premium sound

        document.getElementById('addTableForm').onsubmit = async (e) => {
            e.preventDefault();
            const editId = document.getElementById('editTableId').value;
            const nombre = document.getElementById('newTableName').value;
            const area = document.getElementById('newTableArea').value;
            const capacidad = parseInt(document.getElementById('newTableCap').value);

            if (editId) {
                await db.updateDocument('mesas', editId, { nombre, area, capacidad });
                app.showToast('Mesa actualizada', 'success');
            } else {
                const id = 'T-' + Date.now().toString().slice(-6);
                await db.setDocument('mesas', id, {
                    id: id, nombre, area, capacidad,
                    estado: 'libre', orden: null
                });
                app.showToast('Mesa creada', 'success');
            }

            this.mesas = await db.getCollection('mesas');
            this.openConfigModal();
            app.renderView('tables');
        };
    },

    async deleteTable(id) {
        const confirm = await app.showConfirmModal({
            title: 'Eliminar Mesa',
            message: '¿Estás seguro de eliminar esta mesa? Esta acción no se puede deshacer.',
            confirmText: 'Sí, Eliminar',
            cancelText: 'Cancelar',
            type: 'danger',
            icon: 'trash-2'
        });

        if (!confirm) return;

        await db.deleteDocument('mesas', id);
        app.showToast('Mesa eliminada', 'success');

        this.mesas = await db.getCollection('mesas');
        this.openConfigModal();
        app.renderView('tables');
    },

    renderGrid(filter) {
        const filtered = filter === 'all' ? this.mesas : this.mesas.filter(m => m.area === filter);

        if (filtered.length === 0) {
            return `
                <div style="grid-column: 1 / -1; text-align: center; padding: 50px; color: var(--text-muted);">
                    <i data-lucide="layout-grid" style="width: 48px; height: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <h3>No hay mesas en esta área</h3>
                </div>
            `;
        }

        return filtered.map(mesa => {
            const isOccupied = mesa.estado === 'ocupada';
            const total = mesa.orden ? mesa.orden.total : 0;
            const tiempo = isOccupied ? this.getTimeElapsed(mesa.orden.fechaInicio) : '';

            return `
                <div class="table-card ${isOccupied ? 'occupied' : 'free'}" onclick="tablesView.handleTableClick('${mesa.id}')">
                    <div class="table-header">
                        <div class="table-icon">
                            <i data-lucide="${isOccupied ? 'users' : 'utensils'}"></i>
                        </div>
                        ${isOccupied ? `<span style="font-size: 0.8rem; font-weight: 600; color: #ef4444;">${tiempo}</span>` : ''}
                    </div>
                    
                    <div>
                        <h3 class="table-name">${mesa.nombre}</h3>
                        <p class="table-info">${mesa.capacidad} Personas • ${mesa.area}</p>
                    </div>

                    ${isOccupied ? `
                        <div class="table-total">
                            $${total.toFixed(2)}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 5px;">
                            ${mesa.orden.items.length} items
                        </div>
                    ` : `
                        <div style="margin-top: auto; padding-top: 20px; color: #94a3b8; font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; gap: 6px;">
                            <span style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%;"></span> Disponible
                        </div>
                    `}
                </div>
            `;
        }).join('');
    },

    getTimeElapsed(startDate) {
        if (!startDate) return '';
        const start = new Date(startDate);
        const now = new Date();
        const diff = Math.floor((now - start) / 60000); // minutos
        if (diff < 60) return `${diff} min`;
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        return `${hours}h ${mins}m`;
    },

    filterByArea(area) {
        this.activeFilter = area;
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        app.renderView('tables');
    },

    async handleTableClick(id) {
        const mesa = this.mesas.find(m => m.id === id);
        if (!mesa) return;

        if (mesa.estado === 'libre') {
            const confirmOpen = await app.showConfirmModal({
                title: `Abrir ${mesa.nombre}`,
                message: '¿Deseas ocupar esta mesa y comenzar una orden?',
                confirmText: 'Sí, Abrir Orden',
                cancelText: 'Cancelar',
                icon: 'utensils'
            });

            if (confirmOpen) {
                app.openTableOrder(mesa);
            }
        } else {
            this.showTableDetails(mesa);
        }
    },

    showTableDetails(mesa) {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        modalContent.innerHTML = `
            <div class="table-detail-modal" style="width: 500px;">
                <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 20px;">
                    <h2 style="margin: 0; font-size: 1.8rem; color: var(--primary);">${mesa.nombre}</h2>
                    <p style="color: var(--text-muted); margin: 5px 0;">${mesa.area} • Iniciada hace ${this.getTimeElapsed(mesa.orden.fechaInicio)}</p>
                    ${mesa.orden.cliente ? `
                        <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 5px; color: var(--accent); font-weight: 600;">
                            <i data-lucide="user" style="width: 14px; height: 14px;"></i>
                            <span>${mesa.orden.cliente.nombre}</span>
                        </div>
                    ` : ''}
                    <h1 style="font-size: 3rem; margin: 15px 0 0; color: #1e293b;">$${mesa.orden.total.toFixed(2)}</h1>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                    <button class="btn-secondary" onclick="app.editTableOrder('${mesa.id}')" style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px; font-size: 0.85rem;">
                        <i data-lucide="edit-3"></i>
                        <span>Editar</span>
                    </button>
                    <button class="btn-secondary" onclick="tablesView.showSplitBillModal('${mesa.id}')" style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px; font-size: 0.85rem; background: #f0f9ff; border-color: #bae6fd; color: #0369a1;">
                        <i data-lucide="split"></i>
                        <span>Dividir</span>
                    </button>
                    <button class="btn-primary" onclick="app.checkoutTable('${mesa.id}')" style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px; background: #22c55e; border-color: #22c55e; font-size: 0.85rem;">
                        <i data-lucide="credit-card"></i>
                        <span>Cobrar</span>
                    </button>
                </div>
                
                <button class="btn-secondary" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="width: 100%; margin-bottom: 25px;">Volver</button>

                <div class="hide-scrollbar" style="margin-bottom: 20px; padding-top: 20px; border-top: 2px dashed #f1f5f9; max-height: 300px; overflow-y: auto;">
                    <h4 style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                        <i data-lucide="list-checks" style="width: 16px;"></i> Resumen de Orden
                    </h4>
                    ${mesa.orden.items.map((item, idx) => {
            const hasExtras = item.extras && item.extras.length > 0;
            const hasOmitted = item.omitted && item.omitted.length > 0;
            const hasNote = !!item.nota;
            const isModified = hasExtras || hasOmitted || hasNote;

            return `
                            <div class="${isModified ? 'modified-item-row' : ''}" 
                                 ${isModified ? `onclick="tablesView.showItemModifications(${JSON.stringify(item).replace(/"/g, '&quot;')}, '${mesa.id}')"` : ''}
                                 style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-radius: 12px; margin-bottom: 8px; transition: all 0.2s; ${isModified ? 'cursor: pointer; background: #fdfaf6; border: 1px solid #f973161a;' : 'background: #f8fafc; border: 1px solid transparent;'}">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <span style="font-weight: 800; color: var(--primary); font-size: 1.1rem; min-width: 30px;">${item.quantity}x</span>
                                    <div style="display: flex; flex-direction: column;">
                                        <div style="display: flex; align-items: center; gap: 6px;">
                                            <span style="font-weight: 600; color: #1e293b;">${item.nombre}</span>
                                            ${isModified ? `
                                                <div style="display: flex; align-items: center; gap: 3px; background: var(--accent); color: white; padding: 2px 6px; border-radius: 20px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase;">
                                                    <i data-lucide="sparkles" style="width: 10px; height: 10px;"></i> Especial
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-weight: 700; color: var(--primary);">$${((item.precio + (item.extras ? item.extras.reduce((s, e) => s + e.precio, 0) : 0)) * item.quantity).toFixed(2)}</span>
                                    ${isModified ? '<i data-lucide="chevron-right" style="width: 16px; color: var(--accent); opacity: 0.5;"></i>' : ''}
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        modal.classList.remove('hidden');
    },

    async showItemModifications(item, mesaId) {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        const allInsumos = await db.getCollection('insumos');

        modalContent.innerHTML = `
            <div style="width: 400px; padding: 10px;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px;">
                    <button class="btn-icon-small" onclick="tablesView.showTableDetailsById('${mesaId}')">
                        <i data-lucide="arrow-left"></i>
                    </button>
                    <div>
                        <h2 style="margin: 0; font-family: 'Playfair Display', serif; color: var(--primary);">Detalles Especiales</h2>
                        <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">${item.quantity}x ${item.nombre}</p>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 20px;">
                    ${item.nota ? `
                        <div style="background: #f8fafc; padding: 16px; border-radius: 16px; border: 1px solid #e2e8f0;">
                            <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--primary); margin-bottom: 10px; font-size: 0.85rem; text-transform: uppercase;">
                                <i data-lucide="message-square" style="width: 14px;"></i> Notas de preparación
                            </label>
                            <p style="margin: 0; font-style: italic; color: #334155; line-height: 1.5;">"${item.nota}"</p>
                        </div>
                    ` : ''}

                    ${item.extras && item.extras.length > 0 ? `
                        <div style="background: #f0fdf4; padding: 16px; border-radius: 16px; border: 1px solid #bbf7d0;">
                            <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #166534; margin-bottom: 10px; font-size: 0.85rem; text-transform: uppercase;">
                                <i data-lucide="plus-circle" style="width: 14px;"></i> Ingredientes Extra
                            </label>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                ${item.extras.map(e => `
                                    <span style="background: white; border: 1px solid #bbf7d0; color: #15803d; padding: 4px 12px; border-radius: 20px; font-size: 0.9rem; font-weight: 600;">
                                        + ${e.nombre} ($${e.precio.toFixed(2)})
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    ${item.omitted && item.omitted.length > 0 ? `
                        <div style="background: #fff1f2; padding: 16px; border-radius: 16px; border: 1px solid #fecaca;">
                            <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #991b1b; margin-bottom: 10px; font-size: 0.85rem; text-transform: uppercase;">
                                <i data-lucide="minus-circle" style="width: 14px;"></i> Ingredientes Quitados
                            </label>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                ${item.omitted.map(id => {
            const ins = allInsumos.find(i => i.id === id);
            return `
                                        <span style="background: white; border: 1px solid #fecaca; color: #991b1b; padding: 4px 12px; border-radius: 20px; font-size: 0.9rem; font-weight: 600;">
                                            SIN ${ins ? ins.nombre.toUpperCase() : 'INGREDIENTE'}
                                        </span>
                                    `;
        }).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                    <button class="btn-primary" onclick="tablesView.showTableDetailsById('${mesaId}')" style="width: 100%; padding: 16px; border-radius: 14px;">
                        Entendido
                    </button>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    async showTableDetailsById(id) {
        const mesas = await db.getCollection('mesas');
        const mesa = mesas.find(m => m.id === id);
        if (mesa) this.showTableDetails(mesa);
    },

    async showSplitBillModal(mesaId) {
        const mesa = this.mesas.find(m => m.id === mesaId);
        if (!mesa || !mesa.orden) return;

        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        const items = mesa.orden.items;
        let selectedIndices = [];

        modalContent.innerHTML = `
            <div style="width: 500px;">
                <h2 style="margin-bottom: 20px;">Dividir Cuenta - ${mesa.nombre}</h2>
                <p style="color: var(--text-muted); margin-bottom: 20px;">Selecciona los artículos que se pagarán en este ticket parcial.</p>
                
                <div class="split-items-list" style="max-height: 350px; overflow-y: auto; margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px;">
                    ${items.map((item, idx) => `
                        <div class="split-item-row" onclick="tablesView.toggleSplitItem(${idx})" id="splitItem-${idx}" 
                             style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border: 2px solid #f1f5f9; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div class="checkbox-circle" style="width: 20px; height: 20px; border: 2px solid #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <i data-lucide="check" style="width: 12px; color: white; display: none;"></i>
                                </div>
                                <span style="font-weight: 600;">${item.quantity}x ${item.nombre}</span>
                            </div>
                            <span style="font-weight: 700; color: var(--primary);">$${((item.precio + (item.extras ? item.extras.reduce((s, e) => s + e.precio, 0) : 0)) * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="split-summary" style="background: #f8fafc; padding: 16px; border-radius: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; color: #64748b;">Subtotal Parcial:</span>
                    <span id="splitPartialTotal" style="font-size: 1.4rem; font-weight: 800; color: var(--primary);">$0.00</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <button class="btn-secondary" onclick="tablesView.showTableDetailsById('${mesaId}')">Cancelar</button>
                    <button class="btn-primary" id="btnProcessSplit" disabled style="background: #0284c7; border-color: #0284c7;">COBRAR SELECCIÓN</button>
                </div>
            </div>
            <style>
                .split-item-row.selected { border-color: #0284c7; background: #f0f9ff; }
                .split-item-row.selected .checkbox-circle { background: #0284c7; border-color: #0284c7; }
                .split-item-row.selected .checkbox-circle i { display: block; }
            </style>
        `;

        this.updateSplitUI = () => {
            let total = 0;
            items.forEach((item, idx) => {
                if (selectedIndices.includes(idx)) {
                    const extrasPrice = item.extras ? item.extras.reduce((s, e) => s + e.precio, 0) : 0;
                    total += (item.precio + extrasPrice) * item.quantity;
                }
            });
            document.getElementById('splitPartialTotal').textContent = `$${total.toFixed(2)}`;
            document.getElementById('btnProcessSplit').disabled = selectedIndices.length === 0;
        };

        this.toggleSplitItem = (idx) => {
            const row = document.getElementById(`splitItem-${idx}`);
            if (selectedIndices.includes(idx)) {
                selectedIndices = selectedIndices.filter(i => i !== idx);
                row.classList.remove('selected');
            } else {
                selectedIndices.push(idx);
                row.classList.add('selected');
            }
            this.updateSplitUI();
        };

        document.getElementById('btnProcessSplit').onclick = async () => {
            const selectedItems = selectedIndices.map(idx => items[idx]);
            const remainingItems = items.filter((_, idx) => !selectedIndices.includes(idx));

            // Abrir flujo de cobro con los items seleccionados
            app.checkoutSplit(mesaId, selectedItems, remainingItems);
        };

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};
