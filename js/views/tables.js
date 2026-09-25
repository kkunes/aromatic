const tablesView = {
    mesas: [],
    mapaElementos: [],
    activeFilter: 'all',
    viewMode: localStorage.getItem('tablesViewMode') || 'map',
    editorMode: 'select',
    isDragging: false,
    draggedElement: null,
    isDrawing: false,
    currentLine: null,
    gridSize: 20,

    toggleViewMode(mode) {
        this.viewMode = mode;
        localStorage.setItem('tablesViewMode', mode);
        app.renderView('tables');
    },

    async render() {
        this.mesas = await db.getCollection('mesas');
        this.mapaElementos = await db.getCollection('mapa_elementos');
        if (!this.mapaElementos) this.mapaElementos = [];

        const isGrid = this.viewMode === 'grid';
        const isMap = this.viewMode === 'map';

        // Gather unique areas for filter chips in grid mode
        const areas = [...new Set(this.mesas.map(m => m.area).filter(Boolean))];
        const occupied = this.mesas.filter(m => m.estado === 'ocupada').length;
        const free = this.mesas.length - occupied;

        return `
            <div class="tables-view fade-in" style="height: 100%; display: flex; flex-direction: column;">
                <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <h1 style="margin: 0;">Gestión de Mesas</h1>
                        <p style="color: var(--text-muted); margin-top: 4px;">Seleccione una mesa para tomar orden o cobrar.</p>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <!-- View Mode Toggle -->
                        <div class="view-mode-toggle">
                            <button class="vmt-btn ${isGrid ? 'active' : ''}" onclick="tablesView.toggleViewMode('grid')" title="Vista Cuadrícula">
                                <i data-lucide="layout-grid" style="width: 18px; height: 18px;"></i>
                                <span>Cuadrícula</span>
                            </button>
                            <button class="vmt-btn ${isMap ? 'active' : ''}" onclick="tablesView.toggleViewMode('map')" title="Vista Mapa">
                                <i data-lucide="map" style="width: 18px; height: 18px;"></i>
                                <span>Mapa</span>
                            </button>
                        </div>
                        <button class="btn-primary" onclick="app.openCounterSale()">
                            <i data-lucide="shopping-bag"></i> Venta Mostrador
                        </button>
                        ${isMap ? `
                        <button class="btn-secondary" onclick="tablesView.openMapEditor()" style="display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="map"></i> Editar Mapa
                        </button>` : ''}
                        <button class="btn-secondary" onclick="tablesView.openConfigModal()" style="display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="settings"></i> Configurar Mesas
                        </button>
                    </div>
                </div>

                ${isGrid ? `
                <!-- Grid Mode: Summary Bar + Filters -->
                <div class="grid-summary-bar">
                    <div class="grid-summary-stats">
                        <div class="grid-stat">
                            <span class="grid-stat-value">${this.mesas.length}</span>
                            <span class="grid-stat-label">Total</span>
                        </div>
                        <div class="grid-stat grid-stat-free">
                            <span class="grid-stat-value">${free}</span>
                            <span class="grid-stat-label">Libres</span>
                        </div>
                        <div class="grid-stat grid-stat-occ">
                            <span class="grid-stat-value">${occupied}</span>
                            <span class="grid-stat-label">Ocupadas</span>
                        </div>
                    </div>
                    <div class="grid-area-filters">
                        <button class="grid-filter-chip ${this.activeFilter === 'all' ? 'active' : ''}" onclick="tablesView.filterByArea('all')">
                            <i data-lucide="layers" style="width: 14px; height: 14px;"></i> Todas
                        </button>
                        ${areas.map(a => `
                            <button class="grid-filter-chip ${this.activeFilter === a ? 'active' : ''}" onclick="tablesView.filterByArea('${a}')">
                                ${a}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Grid Content -->
                <div class="premium-grid-container hide-scrollbar" style="flex: 1; overflow-y: auto; padding: 4px;">
                    <div class="premium-tables-grid">
                        ${this.renderGrid(this.activeFilter)}
                    </div>
                </div>
                ` : `
                <!-- Map Mode -->
                <div class="map-container" id="mainMapContainer" style="flex: 1; background: #f8fafc; border-radius: 16px; border: 2px solid #e2e8f0; position: relative; overflow: auto; cursor: grab;">
                    ${this.renderMapContent()}
                </div>
                `}
            </div>
            
            <style>
                /* ====== VIEW MODE TOGGLE ====== */
                .view-mode-toggle {
                    display: flex;
                    background: #f1f5f9;
                    padding: 4px;
                    border-radius: 14px;
                    gap: 4px;
                    border: 1px solid #e2e8f0;
                }
                .vmt-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    border-radius: 10px;
                    border: none;
                    background: transparent;
                    color: #64748b;
                    font-weight: 600;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    font-family: inherit;
                }
                .vmt-btn:hover {
                    color: #334155;
                    background: rgba(255,255,255,0.5);
                }
                .vmt-btn.active {
                    background: white;
                    color: var(--primary);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
                }

                /* ====== GRID SUMMARY BAR ====== */
                .grid-summary-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: white;
                    border-radius: 16px;
                    padding: 14px 20px;
                    margin-bottom: 16px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
                }
                .grid-summary-stats {
                    display: flex;
                    gap: 24px;
                }
                .grid-stat {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .grid-stat-value {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #0f172a;
                    line-height: 1;
                }
                .grid-stat-label {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .grid-stat-free .grid-stat-value { color: #10b981; }
                .grid-stat-occ .grid-stat-value { color: #ef4444; }
                .grid-area-filters {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .grid-filter-chip {
                    padding: 6px 16px;
                    border-radius: 20px;
                    border: 1.5px solid #e2e8f0;
                    background: #f8fafc;
                    color: #64748b;
                    font-weight: 600;
                    font-size: 0.82rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: inherit;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .grid-filter-chip:hover {
                    border-color: var(--primary);
                    color: var(--primary);
                    background: white;
                }
                .grid-filter-chip.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                    box-shadow: 0 2px 8px rgba(75, 54, 33, 0.2);
                }

                /* ====== PREMIUM GRID ====== */
                .premium-tables-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                    gap: 16px;
                    padding-bottom: 20px;
                }

                .ptg-card {
                    background: white;
                    border-radius: 18px;
                    padding: 20px;
                    border: 1.5px solid #e8ecf1;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }
                .ptg-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, #10b981, #34d399);
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .ptg-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.04);
                    border-color: transparent;
                }
                .ptg-card:hover::before { opacity: 1; }
                .ptg-card:active { transform: translateY(-2px) scale(0.99); }

                /* Occupied card variant */
                .ptg-card.ptg-occupied {
                    background: linear-gradient(135deg, #fff5f5 0%, #fff0f0 100%);
                    border-color: #fecaca;
                }
                .ptg-card.ptg-occupied::before {
                    background: linear-gradient(90deg, #ef4444, #f87171);
                    opacity: 1;
                }
                .ptg-card.ptg-occupied:hover {
                    box-shadow: 0 12px 32px rgba(239, 68, 68, 0.15), 0 4px 8px rgba(239, 68, 68, 0.08);
                }

                .ptg-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .ptg-card-identity {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .ptg-card-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .ptg-card.ptg-occupied .ptg-card-icon {
                    background: linear-gradient(135deg, #fee2e2, #fecaca);
                    color: #dc2626;
                }
                .ptg-card:not(.ptg-occupied) .ptg-card-icon {
                    background: linear-gradient(135deg, #ecfdf5, #d1fae5);
                    color: #059669;
                }
                .ptg-card-name {
                    font-size: 1.1rem;
                    font-weight: 800;
                    color: #0f172a;
                    line-height: 1.2;
                }
                .ptg-card-area {
                    font-size: 0.78rem;
                    color: #94a3b8;
                    font-weight: 600;
                }
                .ptg-card-status {
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 0.72rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .ptg-status-free {
                    background: #ecfdf5;
                    color: #059669;
                    border: 1px solid #a7f3d0;
                }
                .ptg-status-occ {
                    background: #fef2f2;
                    color: #dc2626;
                    border: 1px solid #fecaca;
                    animation: ptg-pulse 2s infinite;
                }
                @keyframes ptg-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }

                .ptg-card-body {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    flex: 1;
                }

                /* Occupied: total + details */
                .ptg-total-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                }
                .ptg-total {
                    font-size: 1.6rem;
                    font-weight: 900;
                    color: #991b1b;
                    letter-spacing: -0.5px;
                    font-family: 'Outfit', system-ui, sans-serif;
                }
                .ptg-time {
                    font-size: 0.82rem;
                    font-weight: 700;
                    color: #dc2626;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .ptg-items-count {
                    font-size: 0.82rem;
                    color: #64748b;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                /* Free: capacity + availability */
                .ptg-capacity-row {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 14px;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1.5px dashed #e2e8f0;
                }
                .ptg-capacity-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: #f0f9ff;
                    color: #0284c7;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .ptg-capacity-text {
                    font-size: 0.88rem;
                    font-weight: 600;
                    color: #475569;
                }
                .ptg-available-badge {
                    margin-top: auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    padding: 8px;
                    background: linear-gradient(135deg, #ecfdf5, #d1fae5);
                    border-radius: 10px;
                    color: #059669;
                    font-weight: 700;
                    font-size: 0.85rem;
                    letter-spacing: 0.3px;
                }

                .ptg-empty-state {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 60px 20px;
                    color: #94a3b8;
                }
                .ptg-empty-state h3 {
                    margin-top: 16px;
                    color: #64748b;
                    font-size: 1.15rem;
                }

                /* ====== MAP STYLES ====== */
                .map-table {
                    position: absolute;
                    width: 140px;
                    height: 110px;
                    background: #ffffff;
                    border-radius: 14px;
                    display: flex;
                    flex-direction: column;
                    padding: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    border: 2px solid transparent;
                    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
                    user-select: none;
                    transform: translate(-50%, -50%); 
                    font-family: system-ui, -apple-system, sans-serif;
                }
                .map-table.editing { transition: none; opacity: 0.8; }
                .map-table:hover {
                    transform: translate(-50%, -50%) scale(1.05);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                    z-index: 10 !important;
                }
                .map-table.free { 
                    border-color: #cbd5e1; 
                }
                .map-table.free:hover {
                    border-color: #10b981; 
                }
                .map-table.occupied { 
                    background: #fff1f2; 
                    border-color: #fca5a5; 
                }
                
                .map-table-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: auto; /* Push body down */
                }
                .map-table-name {
                    font-size: 0.95rem;
                    font-weight: 800;
                    color: #0f172a;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 95px;
                }
                .map-table.occupied .map-table-name {
                    color: #991b1b;
                }
                
                .status-dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }
                .status-dot.green { background: #10b981; box-shadow: 0 0 0 3px #d1fae5; }
                .status-dot.pulse-red {
                    background: #ef4444;
                    animation: pulse-red 2s infinite;
                }
                @keyframes pulse-red {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                
                .map-table-body {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .map-table-total {
                    font-size: 1.25rem;
                    font-weight: 900;
                    color: #b91c1c;
                    letter-spacing: -0.5px;
                }
                .map-table-details {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 0.8rem;
                    color: #475569;
                    font-weight: 600;
                }
                .map-table.occupied .map-table-details {
                    color: #b91c1c;
                }
                
                .map-table-icon {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 4px 0;
                }
                .free-details {
                    border-top: 2px dashed #e2e8f0;
                    padding-top: 6px;
                }
                .free-text {
                    color: #10b981;
                    font-weight: 800;
                    font-size: 0.8rem;
                    text-transform: uppercase;
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
                <div class="ptg-empty-state">
                    <i data-lucide="layout-grid" style="width: 52px; height: 52px; opacity: 0.3;"></i>
                    <h3>No hay mesas${filter !== 'all' ? ' en esta área' : ' configuradas'}</h3>
                    <p style="font-size: 0.9rem; margin-top: 6px;">Usa "Configurar Mesas" para agregar nuevas mesas.</p>
                </div>
            `;
        }

        return filtered.map((mesa, idx) => {
            const isOccupied = mesa.estado === 'ocupada';
            const total = mesa.orden ? mesa.orden.total : 0;
            const itemsCount = mesa.orden ? mesa.orden.items.length : 0;
            const tiempo = isOccupied ? this.getTimeElapsed(mesa.orden.fechaInicio) : '';
            const lockText = isOccupied && mesa.mesero ? `🔒 ${mesa.mesero}` : (isOccupied ? 'Ocupada' : 'Libre');

            return `
                <div class="ptg-card ${isOccupied ? 'ptg-occupied' : ''}" onclick="tablesView.handleTableClick('${mesa.id}')" style="animation: fadeInUp 0.4s ease ${idx * 0.04}s both;">
                    <div class="ptg-card-header">
                        <div class="ptg-card-identity">
                            <div class="ptg-card-icon">
                                <i data-lucide="${isOccupied ? 'lock' : 'utensils'}" style="width: 22px; height: 22px;"></i>
                            </div>
                            <div>
                                <div class="ptg-card-name">${mesa.nombre}</div>
                                <div class="ptg-card-area">${mesa.area} • ${mesa.capacidad} personas</div>
                            </div>
                        </div>
                        <div class="ptg-card-status ${isOccupied ? 'ptg-status-occ' : 'ptg-status-free'}">
                            <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></span>
                            ${lockText}
                        </div>
                    </div>

                    <div class="ptg-card-body">
                        ${isOccupied ? `
                            <div class="ptg-total-row">
                                <span class="ptg-total">$${total.toFixed(2)}</span>
                                <span class="ptg-time">
                                    <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
                                    ${tiempo}
                                </span>
                            </div>
                            <div class="ptg-items-count">
                                <i data-lucide="shopping-bag" style="width: 14px; height: 14px;"></i>
                                ${itemsCount} ${itemsCount === 1 ? 'producto' : 'productos'}
                            </div>
                        ` : `
                            <div class="ptg-capacity-row">
                                <div class="ptg-capacity-icon">
                                    <i data-lucide="armchair" style="width: 16px; height: 16px;"></i>
                                </div>
                                <span class="ptg-capacity-text">${mesa.capacidad} personas</span>
                            </div>
                            <div class="ptg-available-badge">
                                <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i>
                                Disponible
                            </div>
                        `}
                    </div>
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
    },

    renderMapContent(isEditor = false) {
        const svgLines = this.mapaElementos.map(el => {
            if (el.type === 'wall') {
                return `<line id="wall-${el.id}" x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" stroke="#334155" stroke-width="6" stroke-linecap="round" ${isEditor ? `onclick="tablesView.deleteWall('${el.id}')" style="cursor: no-drop;" title="Click para eliminar"` : ''} />`;
            }
            return '';
        }).join('');

        const tablesHtml = this.mesas.map((mesa, idx) => {
            // Default position logic if x/y are null
            const x = mesa.x !== undefined && mesa.x !== null ? mesa.x : 100 + (idx % 5) * 150;
            const y = mesa.y !== undefined && mesa.y !== null ? mesa.y : 100 + Math.floor(idx / 5) * 150;
            const isOccupied = mesa.estado === 'ocupada';
            const total = mesa.orden ? mesa.orden.total : 0;
            const itemsCount = mesa.orden ? mesa.orden.items.length : 0;
            const tiempo = isOccupied ? this.getTimeElapsed(mesa.orden.fechaInicio) : '';
            
            const onclickAttr = isEditor ? '' : `onclick="tablesView.handleTableClick('${mesa.id}')"`;
            const onmousedownAttr = isEditor ? `onmousedown="tablesView.startDragTable(event, '${mesa.id}')"` : '';
            const cursor = isEditor ? 'grab' : 'pointer';
            
            return `
                <div id="${isEditor ? 'edit-mesa-' : 'view-mesa-'}${mesa.id}" class="map-table ${isOccupied ? 'occupied' : 'free'}" 
                     style="left: ${x}px; top: ${y}px; cursor: ${cursor};" 
                     ${onclickAttr} ${onmousedownAttr}>
                    
                    <div class="map-table-header">
                        <span class="map-table-name" title="${isOccupied && mesa.mesero ? 'Ocupada por ' + mesa.mesero : mesa.nombre}">
                            ${isOccupied && mesa.mesero ? '🔒 ' + mesa.mesero : mesa.nombre}
                        </span>
                        <div class="status-dot ${isOccupied ? 'pulse-red' : 'green'}"></div>
                    </div>
                    
                    <div class="map-table-body">
                        ${isOccupied ? `
                            <div class="map-table-total">$${total.toFixed(2)}</div>
                            <div class="map-table-details">
                                <span style="display: flex; align-items: center; gap: 4px;">
                                    <i data-lucide="clock" style="width: 14px;"></i> ${tiempo}
                                </span>
                                <span style="display: flex; align-items: center; gap: 4px;">
                                    <i data-lucide="shopping-bag" style="width: 14px;"></i> ${itemsCount}
                                </span>
                            </div>
                        ` : `
                            <div class="map-table-icon">
                                <i data-lucide="utensils" style="width: 24px; color: #cbd5e1;"></i>
                            </div>
                            <div class="map-table-details free-details">
                                <span style="display: flex; align-items: center; gap: 4px;">
                                    <i data-lucide="users" style="width: 14px;"></i> ${mesa.capacidad}
                                </span>
                                <span class="free-text">Libre</span>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div style="width: 2000px; height: 2000px; position: relative;">
                <svg id="${isEditor ? 'editorSvg' : 'viewSvg'}" width="2000" height="2000" style="position: absolute; top: 0; left: 0; z-index: 1;" ${isEditor ? 'onmousedown="tablesView.startDrawWall(event)" onmousemove="tablesView.onDrawWall(event)" onmouseup="tablesView.stopDrawWall(event)"' : ''}>
                    ${isEditor ? `<defs>
                        <pattern id="grid" width="${this.gridSize}" height="${this.gridSize}" patternUnits="userSpaceOnUse">
                            <path d="M ${this.gridSize} 0 L 0 0 0 ${this.gridSize}" fill="none" stroke="#cbd5e1" stroke-width="0.5"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />` : ''}
                    ${svgLines}
                    <line id="drawingLine" stroke="#0ea5e9" stroke-width="6" stroke-linecap="round" stroke-dasharray="8,4" style="display: none;"></line>
                </svg>
                <div id="${isEditor ? 'editorTablesOverlay' : 'viewTablesOverlay'}" style="position: absolute; top: 0; left: 0; width: 2000px; height: 2000px; z-index: 2; pointer-events: none;">
                    <style>
                        .map-table { pointer-events: auto; }
                    </style>
                    ${tablesHtml}
                </div>
            </div>
        `;
    },

    openMapEditor() {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        modalContent.innerHTML = `
            <div style="width: 100vw; height: 100vh; position: fixed; top: 0; left: 0; background: #f8fafc; z-index: 9999; display: flex; flex-direction: column;">
                <div style="background: white; padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <h2 style="margin: 0; color: #0f172a; font-size: 1.5rem; display: flex; align-items: center; gap: 10px;">
                            <i data-lucide="map" style="color: var(--primary);"></i> Editor de Mapa
                        </h2>
                        <div style="display: flex; background: #f1f5f9; padding: 4px; border-radius: 12px; gap: 4px;">
                            <button id="modeSelect" onclick="tablesView.setEditorMode('select')" class="btn-primary" style="padding: 8px 16px; border-radius: 8px; box-shadow: none;">
                                <i data-lucide="move" style="width: 18px;"></i> Mover Mesas
                            </button>
                            <button id="modeDraw" onclick="tablesView.setEditorMode('draw')" class="btn-secondary" style="padding: 8px 16px; border-radius: 8px; border: none; background: transparent; color: #64748b;">
                                <i data-lucide="pen-tool" style="width: 18px;"></i> Dibujar Muros
                            </button>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-secondary" onclick="tablesView.closeMapEditor()" style="background: white;">Cancelar</button>
                        <button class="btn-primary" onclick="tablesView.saveMapElements()" style="background: #10b981; border-color: #10b981;">Guardar Mapa</button>
                    </div>
                </div>
                
                <div id="editorMapContainer" style="flex: 1; position: relative; overflow: auto; cursor: default; background: white;">
                    ${this.renderMapContent(true)}
                </div>
            </div>
        `;
        
        modal.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();
        this.setEditorMode('select');
    },

    setEditorMode(mode) {
        this.editorMode = mode;
        const btnSelect = document.getElementById('modeSelect');
        const btnDraw = document.getElementById('modeDraw');
        const container = document.getElementById('editorMapContainer');
        
        if (mode === 'select') {
            btnSelect.className = 'btn-primary';
            btnSelect.style.background = 'var(--primary)';
            btnSelect.style.color = 'white';
            
            btnDraw.className = 'btn-secondary';
            btnDraw.style.background = 'transparent';
            btnDraw.style.color = '#64748b';
            
            container.style.cursor = 'default';
        } else {
            btnDraw.className = 'btn-primary';
            btnDraw.style.background = 'var(--primary)';
            btnDraw.style.color = 'white';
            
            btnSelect.className = 'btn-secondary';
            btnSelect.style.background = 'transparent';
            btnSelect.style.color = '#64748b';
            
            container.style.cursor = 'crosshair';
        }
    },

    closeMapEditor() {
        document.getElementById('modalContainer').classList.add('hidden');
        app.renderView('tables'); // Re-render to undo any unsaved drags
    },

    async saveMapElements() {
        // Save table positions
        for (const mesa of this.mesas) {
            await db.updateDocument('mesas', mesa.id, { x: mesa.x, y: mesa.y });
        }
        
        app.showToast('Mapa guardado correctamente', 'success');
        this.closeMapEditor();
    },

    startDragTable(e, id) {
        if (this.editorMode !== 'select') return;
        e.preventDefault();
        
        this.isDragging = true;
        this.draggedElement = { id, el: document.getElementById('edit-mesa-' + id) };
        this.draggedElement.el.classList.add('editing');
        this.draggedElement.el.style.zIndex = '100';
        
        const container = document.getElementById('editorMapContainer');
        
        const mouseMoveHandler = (ev) => this.onDragTable(ev);
        const mouseUpHandler = (ev) => {
            this.stopDragTable(ev);
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        };
        
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    },

    onDragTable(e) {
        if (!this.isDragging || !this.draggedElement) return;
        
        const container = document.getElementById('editorMapContainer');
        const containerRect = container.getBoundingClientRect();
        
        let rawX = e.clientX - containerRect.left + container.scrollLeft;
        let rawY = e.clientY - containerRect.top + container.scrollTop;
        
        // Snap to grid
        rawX = Math.round(rawX / this.gridSize) * this.gridSize;
        rawY = Math.round(rawY / this.gridSize) * this.gridSize;
        
        rawX = Math.max(40, Math.min(rawX, 1960));
        rawY = Math.max(40, Math.min(rawY, 1960));
        
        this.draggedElement.el.style.left = rawX + 'px';
        this.draggedElement.el.style.top = rawY + 'px';
        
        const mesa = this.mesas.find(m => m.id === this.draggedElement.id);
        if (mesa) {
            mesa.x = rawX;
            mesa.y = rawY;
        }
    },

    stopDragTable(e) {
        if (this.draggedElement) {
            this.draggedElement.el.classList.remove('editing');
            this.draggedElement.el.style.zIndex = '';
        }
        this.isDragging = false;
        this.draggedElement = null;
    },

    startDrawWall(e) {
        if (this.editorMode !== 'draw') return;
        
        const container = document.getElementById('editorMapContainer');
        const containerRect = container.getBoundingClientRect();
        
        let startX = e.clientX - containerRect.left + container.scrollLeft;
        let startY = e.clientY - containerRect.top + container.scrollTop;
        
        startX = Math.round(startX / this.gridSize) * this.gridSize;
        startY = Math.round(startY / this.gridSize) * this.gridSize;
        
        this.isDrawing = true;
        this.currentLine = { x1: startX, y1: startY, x2: startX, y2: startY };
        
        const drawLine = document.getElementById('drawingLine');
        drawLine.setAttribute('x1', startX);
        drawLine.setAttribute('y1', startY);
        drawLine.setAttribute('x2', startX);
        drawLine.setAttribute('y2', startY);
        drawLine.style.display = 'block';
    },

    onDrawWall(e) {
        if (!this.isDrawing) return;
        
        const container = document.getElementById('editorMapContainer');
        const containerRect = container.getBoundingClientRect();
        
        let currentX = e.clientX - containerRect.left + container.scrollLeft;
        let currentY = e.clientY - containerRect.top + container.scrollTop;
        
        currentX = Math.round(currentX / this.gridSize) * this.gridSize;
        currentY = Math.round(currentY / this.gridSize) * this.gridSize;
        
        this.currentLine.x2 = currentX;
        this.currentLine.y2 = currentY;
        
        const drawLine = document.getElementById('drawingLine');
        drawLine.setAttribute('x2', currentX);
        drawLine.setAttribute('y2', currentY);
    },

    async stopDrawWall(e) {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        
        const drawLine = document.getElementById('drawingLine');
        drawLine.style.display = 'none';
        
        if (this.currentLine.x1 !== this.currentLine.x2 || this.currentLine.y1 !== this.currentLine.y2) {
            const newWall = {
                id: 'W-' + Date.now(),
                type: 'wall',
                x1: this.currentLine.x1,
                y1: this.currentLine.y1,
                x2: this.currentLine.x2,
                y2: this.currentLine.y2
            };
            
            this.mapaElementos.push(newWall);
            await db.addDocument('mapa_elementos', newWall);
            
            document.getElementById('editorMapContainer').innerHTML = this.renderMapContent(true);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    },

    async deleteWall(id) {
        if (this.editorMode !== 'draw') return;
        
        const confirm = await app.showConfirmModal({
            title: 'Eliminar Muro',
            message: '¿Estás seguro de eliminar este muro?',
            confirmText: 'Sí, Eliminar',
            cancelText: 'Cancelar',
            type: 'danger',
            icon: 'trash-2'
        });
        
        if (confirm) {
            this.mapaElementos = this.mapaElementos.filter(e => e.id !== id);
            await db.deleteDocument('mapa_elementos', id);
            
            document.getElementById('editorMapContainer').innerHTML = this.renderMapContent(true);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }
};
