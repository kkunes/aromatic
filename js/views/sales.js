const salesView = {
    ventas: [],
    filterQuery: '',

    async render() {
        this.ventas = await db.getCollection('ventas');

        const localDateStr = new Date().toLocaleDateString('en-CA');
        const todayVentas = this.ventas.filter(v => new Date(v.fecha).toLocaleDateString('en-CA') === localDateStr);

        const filtered = this.ventas.filter(v =>
            v.id.toLowerCase().includes(this.filterQuery.toLowerCase()) ||
            v.metodoPago.toLowerCase().includes(this.filterQuery.toLowerCase())
        );

        const sortedVentas = [...filtered].reverse();
        const totalVentasDia = todayVentas.reduce((sum, v) => sum + v.total, 0);

        return `
            <div class="sales-container fade-in">
                <div class="view-header">
                    <h1>Reporte de Ventas</h1>
                    <div class="date-filter">
                        <input type="date" value="${localDateStr}">
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-label">Ventas del Día</span>
                        <span class="stat-value">$${totalVentasDia.toFixed(2)}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Transacciones (Hoy)</span>
                        <span class="stat-value">${todayVentas.length}</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-label">Ticket Promedio (Hoy)</span>
                        <span class="stat-value">$${todayVentas.length > 0 ? (totalVentasDia / todayVentas.length).toFixed(2) : '0.00'}</span>
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="modern-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Fecha</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Pago</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedVentas.map(v => `
                                <tr>
                                    <td>#${v.id.slice(-4).toUpperCase()}</td>
                                    <td>${new Date(v.fecha).toLocaleTimeString()}</td>
                                    <td>${v.items.length} productos</td>
                                    <td><strong>$${v.total.toFixed(2)}</strong></td>
                                    <td><span class="badge secondary">${v.metodoPago}</span></td>
                                    <td>
                                        <button class="btn-icon-small" title="Ver Ticket" onclick="salesView.showTicket('${v.id}')">
                                            <i data-lucide="receipt"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    bindEvents(appInstance) {
        this.app = appInstance;
    },

    filter(query) {
        this.filterQuery = query;
        this.refreshGrid();
    },

    async refreshGrid() {
        const container = document.getElementById('view-container');
        if (this.app && this.app.currentView === 'sales') {
            const html = await this.render();
            container.innerHTML = `<div class="view-enter">${html}</div>`;
            container.scrollTop = 0; // Reset scroll to top
            if (typeof lucide !== 'undefined') lucide.createIcons();
            this.bindEvents(this.app);
        }
    },

    async showTicket(id, allowRefunds = false) {
        const venta = this.ventas.find(v => v.id === id);
        if (!venta) return;

        const settings = db.getSettings();
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        // Generar el HTML del ticket de forma asíncrona
        const ticketHTML = await ticketView.generateHTML(venta, settings);

        modalContent.innerHTML = `
            <div class="ticket-modal-view">
                <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0;">Vista Previa de Ticket</h3>
                    <button class="btn-icon-small" onclick="document.getElementById('modalContainer').classList.add('hidden')">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                
                <div id="ticketPreview">
                    ${ticketHTML}
                </div>

                <div class="no-print" style="margin-top: 30px; display: flex; flex-direction: column; gap: 10px;">
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-primary" id="printHistoryTicket" style="flex: 1;">
                            <i data-lucide="printer"></i> Ticket
                        </button>
                        <button class="btn-primary" id="printHistoryKitchen" style="flex: 1; background: #fbbf24; border-color: #fbbf24; color: #78350f;">
                            <i data-lucide="chef-hat"></i> Comanda
                        </button>
                    </div>
                    ${allowRefunds ? `
                        <div style="border-top: 2px solid #f5f5f5; margin-top: 10px; padding-top: 20px;">
                            <h4 style="margin-bottom: 12px; font-size: 0.9rem; color: var(--danger); text-transform: uppercase;">Devoluciones</h4>
                            <div style="max-height: 200px; overflow-y: auto;">
                                ${venta.items.map((item, idx) => `
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; background: #fff; padding: 10px; border-radius: 10px; border: 1px solid #eee;">
                                        <div style="font-size: 0.85rem;">
                                            <span style="font-weight: 600;">${item.quantity}x</span> ${item.nombre}
                                        </div>
                                        <button class="btn-icon-small danger" onclick="salesView.refundItem('${venta.id}', ${idx})" title="Devolver artículo">
                                            <i data-lucide="rotate-ccw" style="width: 14px;"></i>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <button class="btn-secondary" onclick="document.getElementById('modalContainer').classList.add('hidden')">Cerrar</button>
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

        // Update items
        venta.items.splice(itemIdx, 1);

        // Return supplies to inventory
        if (window.app) {
            await window.app.updateStockFromRecipe(item, item.quantity, 'add');
        }

        if (venta.items.length === 0) {
            // If No items left, delete the sale
            await db.deleteDocument('ventas', ventaId);
            await db.logAction('ventas', 'anular_venta', `Venta No. ${ventaId.slice(-8).toUpperCase()} de $${venta.total.toFixed(2)}`);
            document.getElementById('modalContainer').classList.add('hidden');
            alert('Venta anulada por devolución total.');
        } else {
            // Update total and save
            venta.total -= itemTotal;
            await db.updateDocument('ventas', ventaId, venta);
            await db.logAction('ventas', 'reembolsar_item', `Item: "${item.nombre}", Cant: ${item.quantity}`);
            this.showTicket(ventaId, true); // Refresh ticket modal
        }

        // Refresh app UI if we are in POS history
        if (window.app) window.app.updateDailyHistoryUI();
        if (this.app && this.app.currentView === 'sales') this.app.renderView('sales');
    }
};
