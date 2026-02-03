const salesView = {
    ventas: [],
    filterQuery: '',
    selectedDate: new Date().toLocaleDateString('en-CA'),
    viewMode: 'cards',

    async render() {
        this.ventas = await db.getCollection('ventas');

        const dateVentas = this.ventas.filter(v =>
            new Date(v.fecha).toLocaleDateString('en-CA') === this.selectedDate
        );

        const filtered = dateVentas.filter(v => {
            if (!this.filterQuery) return true;
            const folio = (v.folio || v.id || '').toString().toLowerCase();
            const cliente = v.cliente?.nombre?.toLowerCase() || '';
            const productos = v.items.map(i => i.nombre.toLowerCase()).join(' ');
            const query = this.filterQuery.toLowerCase();
            return folio.includes(query) || cliente.includes(query) || productos.includes(query);
        });

        const sortedVentas = [...filtered].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        const totalVentas = dateVentas.reduce((sum, v) => sum + v.total, 0);
        const totalEfectivo = dateVentas.filter(v => v.metodoPago === 'Efectivo').reduce((sum, v) => sum + v.total, 0);
        const totalTarjeta = dateVentas.filter(v => v.metodoPago === 'Tarjeta').reduce((sum, v) => sum + v.total, 0);
        const ticketPromedio = dateVentas.length > 0 ? totalVentas / dateVentas.length : 0;

        return `
            <div class="sales-container fade-in" style="max-width: 1400px; margin: 0 auto;">
                <!-- Header -->
                <div style="margin-bottom: 32px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
                        <div>
                            <h1 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; margin: 0 0 8px 0; color: var(--primary);">Reporte de Ventas</h1>
                            <p style="color: var(--text-muted); font-size: 1rem; margin: 0;">Análisis y consulta de transacciones</p>
                        </div>
                        <div style="display: flex; gap: 12px;">
                            <button class="btn-icon-small ${this.viewMode === 'cards' ? 'active' : ''}" onclick="salesView.setViewMode('cards')" title="Vista de tarjetas" style="width: 44px; height: 44px; ${this.viewMode === 'cards' ? 'background: var(--primary); color: white;' : ''}">
                                <i data-lucide="layout-grid"></i>
                            </button>
                            <button class="btn-icon-small ${this.viewMode === 'table' ? 'active' : ''}" onclick="salesView.setViewMode('table')" title="Vista de tabla" style="width: 44px; height: 44px; ${this.viewMode === 'table' ? 'background: var(--primary); color: white;' : ''}">
                                <i data-lucide="list"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Filters Bar -->
                    <div style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px;">
                        <div style="flex: 1; min-width: 280px; position: relative;">
                            <i data-lucide="search" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 20px; color: var(--text-muted);"></i>
                            <input 
                                type="text" 
                                id="salesSearchInput" 
                                placeholder="Buscar por folio, cliente o producto..." 
                                value="${this.filterQuery}"
                                style="width: 100%; padding: 14px 16px 14px 48px; border: 2px solid #e2e8f0; border-radius: 16px; font-size: 1rem; font-family: 'Outfit', sans-serif; transition: all 0.3s; background: white;"
                                onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 4px 12px rgba(75,54,33,0.1)'"
                                onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none'"
                            >
                        </div>
                        <div style="position: relative; min-width: 220px;">
                            <i data-lucide="calendar" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 20px; color: var(--text-muted);"></i>
                            <input 
                                type="date" 
                                id="salesDateInput" 
                                value="${this.selectedDate}"
                                style="width: 100%; padding: 14px 16px 14px 48px; border: 2px solid #e2e8f0; border-radius: 16px; font-size: 1rem; font-family: 'Outfit', sans-serif; cursor: pointer; transition: all 0.3s; background: white;"
                                onfocus="this.style.borderColor='var(--primary)'; this.style.boxShadow='0 4px 12px rgba(75,54,33,0.1)'"
                                onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none'"
                            >
                        </div>
                        ${this.filterQuery || this.selectedDate !== new Date().toLocaleDateString('en-CA') ? `
                            <button class="btn-secondary" onclick="salesView.clearFilters()" style="padding: 14px 24px; border-radius: 16px; white-space: nowrap; display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="x"></i> Limpiar
                            </button>
                        ` : ''}
                    </div>
                </div>

                <!-- Stats Cards -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 32px;">
                    <div class="stat-card-premium" style="background: linear-gradient(135deg, #4B3621 0%, #6D4C41 100%); color: white; padding: 24px; border-radius: 20px; box-shadow: 0 8px 24px rgba(75,54,33,0.15); position: relative; overflow: hidden;">
                        <div style="position: absolute; right: -10px; top: -10px; width: 80px; height: 80px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                        <div style="position: relative; z-index: 1;">
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                                <div style="width: 44px; height: 44px; background: rgba(255,255,255,0.2); border-radius: 14px; display: flex; align-items: center; justify-content: center;">
                                    <i data-lucide="dollar-sign" style="width: 24px; height: 24px;"></i>
                                </div>
                                <span style="font-size: 0.85rem; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Total del Día</span>
                            </div>
                            <div style="font-family: 'Playfair Display', serif; font-size: 2.2rem; font-weight: 700; display: flex; align-items: baseline; gap: 4px;">
                                <span style="font-size: 1.2rem; opacity: 0.7;">$</span>${totalVentas.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div class="stat-card-premium" style="background: white; padding: 24px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            <div style="width: 44px; height: 44px; background: #f0fdf4; border-radius: 14px; display: flex; align-items: center; justify-content: center;">
                                <i data-lucide="banknote" style="width: 24px; height: 24px; color: #22c55e;"></i>
                            </div>
                            <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Efectivo</span>
                        </div>
                        <div style="font-family: 'Playfair Display', serif; font-size: 1.8rem; font-weight: 700; color: var(--primary); display: flex; align-items: baseline; gap: 4px;">
                            <span style="font-size: 1rem; opacity: 0.5;">$</span>${totalEfectivo.toFixed(2)}
                        </div>
                    </div>

                    <div class="stat-card-premium" style="background: white; padding: 24px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            <div style="width: 44px; height: 44px; background: #eff6ff; border-radius: 14px; display: flex; align-items: center; justify-content: center;">
                                <i data-lucide="credit-card" style="width: 24px; height: 24px; color: #3b82f6;"></i>
                            </div>
                            <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Tarjeta</span>
                        </div>
                        <div style="font-family: 'Playfair Display', serif; font-size: 1.8rem; font-weight: 700; color: var(--primary); display: flex; align-items: baseline; gap: 4px;">
                            <span style="font-size: 1rem; opacity: 0.5;">$</span>${totalTarjeta.toFixed(2)}
                        </div>
                    </div>

                    <div class="stat-card-premium" style="background: white; padding: 24px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                            <div style="width: 44px; height: 44px; background: #fef3c7; border-radius: 14px; display: flex; align-items: center; justify-content: center;">
                                <i data-lucide="receipt" style="width: 24px; height: 24px; color: #f59e0b;"></i>
                            </div>
                            <span style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Transacciones</span>
                        </div>
                        <div style="font-family: 'Playfair Display', serif; font-size: 1.8rem; font-weight: 700; color: var(--primary);">
                            ${dateVentas.length}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Promedio: $${ticketPromedio.toFixed(2)}</div>
                    </div>
                </div>

                <!-- Results Info -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 0 4px;">
                    <div style="font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">
                        ${sortedVentas.length === dateVentas.length
                ? `Mostrando <strong style="color: var(--primary);">${sortedVentas.length}</strong> transacciones`
                : `<strong style="color: var(--primary);">${sortedVentas.length}</strong> de ${dateVentas.length} transacciones`
            }
                    </div>
                    ${sortedVentas.length === 0 && this.filterQuery ? `
                        <button class="btn-secondary" onclick="salesView.clearFilters()" style="font-size: 0.85rem; padding: 8px 16px; border-radius: 12px;">
                            Ver todas las ventas del día
                        </button>
                    ` : ''}
                </div>

                <!-- Sales List -->
                <div id="sales-results-container">
                    ${sortedVentas.length > 0 ? (
                this.viewMode === 'cards'
                    ? this.renderCardsView(sortedVentas)
                    : this.renderTableView(sortedVentas)
            ) : `
                        <div style="text-align: center; padding: 80px 20px; background: white; border-radius: 24px; border: 2px dashed #e2e8f0;">
                            <div style="width: 80px; height: 80px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                                <i data-lucide="inbox" style="width: 40px; height: 40px; color: #cbd5e1;"></i>
                            </div>
                            <h3 style="font-family: 'Playfair Display', serif; font-size: 1.5rem; margin-bottom: 12px; color: var(--primary);">
                                ${this.filterQuery ? 'No se encontraron resultados' : 'Sin ventas registradas'}
                            </h3>
                            <p style="color: var(--text-muted); font-size: 0.95rem; max-width: 400px; margin: 0 auto;">
                                ${this.filterQuery
                ? 'Intenta con otro término de búsqueda o selecciona una fecha diferente.'
                : 'No hay transacciones registradas para la fecha seleccionada.'
            }
                            </p>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    renderCardsView(ventas) {
        return `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px;">
                ${ventas.map(v => {
            const folio = v.folio || v.id.slice(-4).toUpperCase();
            const timeStr = new Date(v.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
            const dateStr = new Date(v.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });

            return `
                        <div class="sale-card-premium" onclick="salesView.showTicket('${v.id}')" style="background: white; border: 1px solid #f1f5f9; border-radius: 20px; padding: 24px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                                <div>
                                    <div style="display: inline-block; background: var(--primary); color: white; font-size: 0.8rem; font-weight: 800; padding: 6px 14px; border-radius: 10px; margin-bottom: 8px; letter-spacing: 0.5px;">
                                        #${folio}
                                    </div>
                                    <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">
                                        <i data-lucide="clock" style="width: 14px; height: 14px; display: inline; margin-right: 4px;"></i>
                                        ${timeStr} • ${dateStr}
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-family: 'Playfair Display', serif; font-size: 1.8rem; font-weight: 700; color: var(--primary); line-height: 1;">
                                        <span style="font-size: 1rem; opacity: 0.5;">$</span>${v.total.toFixed(2)}
                                    </div>
                                </div>
                            </div>

                            ${v.cliente ? `
                                <div style="display: flex; align-items: center; gap: 10px; padding: 12px; background: #fafafa; border-radius: 12px; margin-bottom: 16px;">
                                    <div style="width: 36px; height: 36px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.9rem;">
                                        ${v.cliente.nombre.charAt(0)}
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; font-size: 0.9rem; color: var(--primary);">${v.cliente.nombre}</div>
                                        <div style="font-size: 0.75rem; color: var(--text-muted);">Cliente registrado</div>
                                    </div>
                                </div>
                            ` : ''}

                            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
                                ${v.items.slice(0, 3).map(item => `
                                    <div style="font-size: 0.8rem; padding: 6px 12px; background: #f8fafc; border-radius: 8px; color: #64748b; font-weight: 500;">
                                        ${item.quantity}x ${item.nombre}
                                    </div>
                                `).join('')}
                                ${v.items.length > 3 ? `
                                    <div style="font-size: 0.8rem; padding: 6px 12px; background: #f8fafc; border-radius: 8px; color: #64748b; font-weight: 600;">
                                        +${v.items.length - 3} más
                                    </div>
                                ` : ''}
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid #f1f5f9;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <i data-lucide="${v.metodoPago === 'Efectivo' ? 'banknote' : 'credit-card'}" style="width: 18px; height: 18px; color: ${v.metodoPago === 'Efectivo' ? '#22c55e' : '#3b82f6'};"></i>
                                    <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">${v.metodoPago}</span>
                                </div>
                                <div style="color: var(--primary); font-weight: 600; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">
                                    Ver detalles <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>
                                </div>
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    renderTableView(ventas) {
        return `
            <div style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #fafafa; border-bottom: 2px solid #f1f5f9;">
                                <th style="padding: 16px 24px; text-align: left; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted);">Folio</th>
                                <th style="padding: 16px 24px; text-align: left; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted);">Fecha y Hora</th>
                                <th style="padding: 16px 24px; text-align: left; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted);">Cliente</th>
                                <th style="padding: 16px 24px; text-align: left; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted);">Productos</th>
                                <th style="padding: 16px 24px; text-align: right; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted);">Total</th>
                                <th style="padding: 16px 24px; text-align: center; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted);">Pago</th>
                                <th style="padding: 16px 24px; text-align: center; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted);">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ventas.map((v, idx) => {
            const folio = v.folio || v.id.slice(-4).toUpperCase();
            const timeStr = new Date(v.fecha).toLocaleString('es-MX', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                                    <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s; cursor: pointer;" 
                                        onclick="salesView.showTicket('${v.id}')"
                                        onmouseenter="this.style.background='#fafafa'"
                                        onmouseleave="this.style.background='white'">
                                        <td style="padding: 20px 24px;">
                                            <div style="display: inline-block; background: var(--primary); color: white; font-size: 0.75rem; font-weight: 800; padding: 6px 12px; border-radius: 8px; letter-spacing: 0.5px;">
                                                #${folio}
                                            </div>
                                        </td>
                                        <td style="padding: 20px 24px; font-size: 0.9rem; color: var(--text-muted); font-weight: 500;">
                                            ${timeStr}
                                        </td>
                                        <td style="padding: 20px 24px;">
                                            ${v.cliente ? `
                                                <div style="display: flex; align-items: center; gap: 10px;">
                                                    <div style="width: 32px; height: 32px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.8rem;">
                                                        ${v.cliente.nombre.charAt(0)}
                                                    </div>
                                                    <span style="font-weight: 600; font-size: 0.9rem; color: var(--primary);">${v.cliente.nombre}</span>
                                                </div>
                                            ` : `<span style="font-size: 0.85rem; color: #cbd5e1;">—</span>`}
                                        </td>
                                        <td style="padding: 20px 24px;">
                                            <div style="font-size: 0.85rem; color: var(--text-muted);">
                                                ${v.items.length} producto${v.items.length !== 1 ? 's' : ''}
                                            </div>
                                        </td>
                                        <td style="padding: 20px 24px; text-align: right;">
                                            <div style="font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 700; color: var(--primary);">
                                                <span style="font-size: 0.9rem; opacity: 0.5;">$</span>${v.total.toFixed(2)}
                                            </div>
                                        </td>
                                        <td style="padding: 20px 24px; text-align: center;">
                                            <div style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px; font-size: 0.8rem; font-weight: 600; ${v.metodoPago === 'Efectivo' ? 'background: #f0fdf4; color: #166534;' : 'background: #eff6ff; color: #1e40af;'}">
                                                <i data-lucide="${v.metodoPago === 'Efectivo' ? 'banknote' : 'credit-card'}" style="width: 14px; height: 14px;"></i>
                                                ${v.metodoPago}
                                            </div>
                                        </td>
                                        <td style="padding: 20px 24px; text-align: center;">
                                            <button class="btn-icon-small" onclick="event.stopPropagation(); salesView.showTicket('${v.id}')" style="width: 40px; height: 40px;">
                                                <i data-lucide="eye" style="width: 18px; height: 18px;"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    setViewMode(mode) {
        this.viewMode = mode;
        this.refreshGrid();
    },

    clearFilters() {
        this.filterQuery = '';
        this.selectedDate = new Date().toLocaleDateString('en-CA');
        this.refreshGrid();
    },

    bindEvents(appInstance) {
        this.app = appInstance;

        const searchInput = document.getElementById('salesSearchInput');
        const dateInput = document.getElementById('salesDateInput');

        if (searchInput) {
            const debouncedRefresh = this.app.debounce(() => this.refreshGrid(), 300);
            searchInput.oninput = (e) => {
                this.filterQuery = e.target.value;
                debouncedRefresh();
            };
        }

        if (dateInput) {
            dateInput.onchange = (e) => {
                this.selectedDate = e.target.value;
                this.refreshGrid();
            };
        }
    },

    filter(query) {
        this.filterQuery = query;
        this.refreshGrid();
    },

    async refreshGrid() {
        const resultsContainer = document.getElementById('sales-results-container');
        if (resultsContainer) {
            this.ventas = await db.getCollection('ventas');
            const dateVentas = this.ventas.filter(v =>
                new Date(v.fecha).toLocaleDateString('en-CA') === this.selectedDate
            );

            const filtered = dateVentas.filter(v => {
                if (!this.filterQuery) return true;
                const folio = (v.folio || v.id || '').toString().toLowerCase();
                const cliente = v.cliente?.nombre?.toLowerCase() || '';
                const productos = v.items.map(i => i.nombre.toLowerCase()).join(' ');
                const query = this.filterQuery.toLowerCase();
                return folio.includes(query) || cliente.includes(query) || productos.includes(query);
            });

            const sortedVentas = [...filtered].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            resultsContainer.innerHTML = sortedVentas.length > 0 ? (
                this.viewMode === 'cards'
                    ? this.renderCardsView(sortedVentas)
                    : this.renderTableView(sortedVentas)
            ) : `
                <div style="text-align: center; padding: 80px 20px; background: white; border-radius: 24px; border: 2px dashed #e2e8f0;">
                    <div style="width: 80px; height: 80px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                        <i data-lucide="inbox" style="width: 40px; height: 40px; color: #cbd5e1;"></i>
                    </div>
                    <h3 style="font-family: 'Playfair Display', serif; font-size: 1.5rem; margin-bottom: 12px; color: var(--primary);">
                        ${this.filterQuery ? 'No se encontraron resultados' : 'Sin ventas registradas'}
                    </h3>
                    <p style="color: var(--text-muted); font-size: 0.95rem; max-width: 400px; margin: 0 auto;">
                        ${this.filterQuery
                ? 'Intenta con otro término de búsqueda o selecciona una fecha diferente.'
                : 'No hay transacciones registradas para la fecha seleccionada.'
            }
                    </p>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            const container = document.getElementById('view-container');
            if (this.app && this.app.currentView === 'sales') {
                const html = await this.render();
                container.innerHTML = `<div class="view-enter">${html}</div>`;
                container.scrollTop = 0;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                this.bindEvents(this.app);
            }
        }
    },

    async showTicket(id, allowRefunds = false) {
        const venta = this.ventas.find(v => v.id === id);
        if (!venta) return;

        const settings = db.getSettings();
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        const ticketHTML = await ticketView.generateHTML(venta, settings);

        modalContent.innerHTML = `
            <div style="max-width: 500px;">
                <div class="no-print" style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 1.5rem; color: var(--primary);">Vista Previa de Ticket</h3>
                    <button class="btn-icon-small" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="width: 40px; height: 40px;">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                
                <div id="ticketPreview" style="background: #fafafa; padding: 20px; border-radius: 16px; margin-bottom: 24px; max-height: 500px; overflow-y: auto;">
                    ${ticketHTML}
                </div>

                <div class="no-print" style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <button class="btn-primary" id="printHistoryTicket" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 16px; border-radius: 14px;">
                            <i data-lucide="printer"></i> Ticket
                        </button>
                        <button class="btn-primary" id="printHistoryKitchen" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 16px; border-radius: 14px; background: #fbbf24; border-color: #fbbf24; color: #78350f;">
                            <i data-lucide="chef-hat"></i> Comanda
                        </button>
                    </div>
                    ${allowRefunds ? `
                        <div style="border-top: 2px solid #f1f5f9; margin-top: 12px; padding-top: 20px;">
                            <h4 style="margin-bottom: 16px; font-size: 0.9rem; color: var(--danger); text-transform: uppercase; font-weight: 700;">Devoluciones</h4>
                            <div style="max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
                                ${venta.items.map((item, idx) => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 12px 16px; border-radius: 12px; border: 1px solid #f1f5f9;">
                                        <div style="font-size: 0.9rem;">
                                            <span style="font-weight: 700;">${item.quantity}x</span> ${item.nombre}
                                        </div>
                                        <button class="btn-icon-small danger" onclick="salesView.refundItem('${venta.id}', ${idx})" title="Devolver artículo" style="width: 36px; height: 36px;">
                                            <i data-lucide="rotate-ccw" style="width: 16px;"></i>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <button class="btn-secondary" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="padding: 16px; border-radius: 14px;">Cerrar</button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('printHistoryTicket').onclick = () => {
            ticketView.print('history', venta, settings);
        };
        document.getElementById('printHistoryKitchen').onclick = () => {
            ticketView.print('history', venta, settings, 'kitchen');
        };
    },

    async refundItem(ventaId, itemIdx) {
        if (!confirm('¿Deseas procesar la devolución de este artículo?')) return;

        const venta = this.ventas.find(v => v.id === ventaId);
        if (!venta) return;

        const item = venta.items[itemIdx];
        const extrasTotal = item.extras ? item.extras.reduce((s, e) => s + e.precio, 0) : 0;
        const itemTotal = (item.precio + extrasTotal) * item.quantity;

        venta.items.splice(itemIdx, 1);

        if (window.app) {
            await window.app.updateStockFromRecipe(item, item.quantity, 'add');
        }

        if (venta.items.length === 0) {
            await db.deleteDocument('ventas', ventaId);
            await db.logAction('ventas', 'anular_venta', `Venta No. ${venta.folio || ventaId.slice(-8).toUpperCase()} de $${venta.total.toFixed(2)}`);
            document.getElementById('modalContainer').classList.add('hidden');
            alert('Venta anulada por devolución total.');
        } else {
            venta.total -= itemTotal;
            await db.updateDocument('ventas', ventaId, venta);
            await db.logAction('ventas', 'reembolsar_item', `Item: "${item.nombre}", Cant: ${item.quantity}`);
            this.showTicket(ventaId, true);
        }

        if (window.app) window.app.updateDailyHistoryUI();
        if (this.app && this.app.currentView === 'sales') this.app.renderView('sales');
    }
};
