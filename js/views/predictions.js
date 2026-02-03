const predictionsView = {
    ventas: [],
    productos: [],
    insumos: [],
    selectedDate: new Date().toLocaleDateString('en-CA'),
    customPredictions: {}, // { productId: quantity }

    async render() {
        this.ventas = await db.getCollection('ventas');
        this.productos = await db.getCollection('productos');
        this.insumos = await db.getCollection('insumos');

        const stats = this.calculatePredictions();

        return `
            <div class="predictions-container fade-in" style="max-width: 1400px; margin: 0 auto; padding-bottom: 50px;">
                <div style="margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 20px;">
                    <div>
                        <h1 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; margin: 0 0 8px 0; color: var(--primary);">Planificador Inteligente</h1>
                        <p style="color: var(--text-muted); font-size: 1rem; margin: 0;">Predicciones basadas en tu histórico para optimizar tus compras e inventario.</p>
                    </div>
                    
                    <div style="display: flex; gap: 12px; background: white; padding: 12px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <label style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Día a Planear</label>
                            <input type="date" id="predictionDate" value="${this.selectedDate}" style="border: 2px solid #e2e8f0; border-radius: 12px; padding: 10px 16px; font-family: 'Outfit'; font-weight: 600; color: var(--primary); outline: none; transition: border-color 0.3s;">
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 32px;">
                    <!-- Predictions Column -->
                    <div class="card" style="padding: 28px; border-radius: 24px; display: flex; flex-direction: column;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                            <h3 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 1.5rem;">Ventas Estimadas</h3>
                            <div style="background: #f0fdf4; color: #166534; padding: 6px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">BASADO EN ${stats.dayOfWeekName}S</div>
                        </div>

                        <div style="background: #f8fafc; padding: 16px; border-radius: 16px; margin-bottom: 20px; border: 1px solid #f1f5f9; display: flex; gap: 12px; align-items: center;">
                            <i data-lucide="info" style="color: #3b82f6; width: 20px;"></i>
                            <p style="font-size: 0.85rem; color: #64748b; margin: 0;">Puedes ajustar las cantidades si esperas un evento especial, mal clima o alguna promoción.</p>
                        </div>

                        <div id="predictionList" style="flex: 1; overflow-y: auto; max-height: 600px; padding-right: 5px;">
                            ${this.renderPredictionList(stats.productPredictions)}
                        </div>
                    </div>

                    <!-- Supplies and Alerts Column -->
                    <div style="display: flex; flex-direction: column; gap: 32px;">
                        <!-- Critical Alerts -->
                        <div class="card" style="padding: 28px; border-radius: 24px; border: 2px solid ${stats.alerts.length > 0 ? '#fee2e2' : '#f1f5f9'};">
                            <h3 style="margin: 0 0 20px 0; font-family: 'Playfair Display', serif; font-size: 1.5rem; display: flex; align-items: center; gap: 10px;">
                                <i data-lucide="alert-triangle" style="color: ${stats.alerts.length > 0 ? '#ef4444' : '#cbd5e1'};"></i>
                                Riesgos de Inventario
                            </h3>
                            
                            <div id="alertsContainer">
                                ${stats.alerts.length > 0 ? `
                                    <div style="display: flex; flex-direction: column; gap: 12px;">
                                        ${stats.alerts.map(alert => `
                                            <div style="display: flex; align-items: center; gap: 15px; background: #fff1f2; padding: 16px; border-radius: 16px; border: 1px solid #fecaca;">
                                                <div style="width: 40px; height: 40px; background: #ef4444; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white;">
                                                    <i data-lucide="shopping-cart" style="width: 20px;"></i>
                                                </div>
                                                <div style="flex: 1;">
                                                    <div style="font-weight: 700; color: #991b1b;">Se agotará: ${alert.insumo}</div>
                                                    <div style="font-size: 0.85rem; color: #b91c1c;">Necesitas <strong>${alert.needed.toFixed(2)} ${alert.unidad}</strong> adicionales para cumplir el plan.</div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : `
                                    <div style="text-align: center; padding: 40px 20px; color: #94a3b8;">
                                        <div style="width: 60px; height: 60px; background: #f0fdf4; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                                            <i data-lucide="check-circle-2" style="color: #22c55e;"></i>
                                        </div>
                                        <p style="font-weight: 600;">¡Todo listo!</p>
                                        <p style="font-size: 0.85rem;">Tienes suficiente stock para la venta estimada.</p>
                                    </div>
                                `}
                            </div>
                        </div>

                        <!-- Supply Projection -->
                        <div class="card" style="padding: 28px; border-radius: 24px;">
                            <h3 style="margin: 0 0 24px 0; font-family: 'Playfair Display', serif; font-size: 1.5rem;">Cálculo de Insumos</h3>
                            <div id="suppliesProjection" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
                                ${this.renderSuppliesProjection(stats.supplyNeeds)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    calculatePredictions() {
        const targetDate = new Date(this.selectedDate + 'T00:00:00');
        const dayOfWeek = targetDate.getDay();
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayOfWeekName = days[dayOfWeek];

        // 1. Get average sales for this day of week
        // We look at the last 8 weeks of data for the same day of week
        const productAverages = {};

        // Find dates for the same day of week in the past 60 days
        const sameDaySales = this.ventas.filter(v => {
            const d = new Date(v.fecha);
            return d.getDay() === dayOfWeek;
        });

        // Count how many unique dates of this day-of-week we have
        const uniqueDates = new Set(sameDaySales.map(v => new Date(v.fecha).toLocaleDateString())).size || 1;

        sameDaySales.forEach(v => {
            v.items.forEach(item => {
                const prod = this.productos.find(p => p.id === item.id) || this.productos.find(p => p.nombre === item.nombre);
                if (!prod) return;

                if (!productAverages[prod.id]) {
                    productAverages[prod.id] = { id: prod.id, nombre: prod.nombre, totalQty: 0, count: 0 };
                }
                productAverages[prod.id].totalQty += item.quantity;
            });
        });

        const productPredictions = this.productos.map(p => {
            const avg = productAverages[p.id] ? (productAverages[p.id].totalQty / uniqueDates) : 0;
            // Use custom prediction if set, otherwise rounded average
            const predicted = this.customPredictions[p.id] !== undefined ? this.customPredictions[p.id] : Math.ceil(avg);
            return {
                id: p.id,
                nombre: p.nombre,
                avg: avg,
                predicted: predicted,
                insumos: p.insumos || []
            };
        }).filter(p => p.avg > 0 || p.predicted > 0).sort((a, b) => b.predicted - a.predicted);

        // 2. Calculate supply needs
        const supplyNeeds = {};
        productPredictions.forEach(pp => {
            pp.insumos.forEach(recipeItem => {
                const insumo = this.insumos.find(i => i.id === recipeItem.idInsumo);
                if (!insumo) return;

                if (!supplyNeeds[insumo.id]) {
                    supplyNeeds[insumo.id] = {
                        id: insumo.id,
                        nombre: insumo.nombre,
                        unidad: insumo.unidad,
                        needed: 0,
                        stock: insumo.stock
                    };
                }
                supplyNeeds[insumo.id].needed += (recipeItem.cantidad * pp.predicted);
            });
        });

        // 3. Generate alerts
        const alerts = Object.values(supplyNeeds)
            .filter(sn => sn.needed > sn.stock)
            .map(sn => ({
                insumo: sn.nombre,
                unidad: sn.unidad,
                missing: sn.needed - sn.stock,
                needed: sn.needed
            }));

        return {
            dayOfWeekName,
            productPredictions,
            supplyNeeds: Object.values(supplyNeeds),
            alerts
        };
    },

    renderPredictionList(predictions) {
        if (predictions.length === 0) return '<p style="text-align:center; color: #94a3b8; padding: 40px;">No hay historial suficiente para este día.</p>';

        return predictions.map(p => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #f1f5f9; transition: all 0.2s;">
                <div style="flex: 1;">
                    <div style="font-weight: 700; color: var(--primary); font-size: 1rem;">${p.nombre}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Promedio historial: ${p.avg.toFixed(1)} u</div>
                </div>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <button class="btn-icon-small" onclick="predictionsView.adjust('${p.id}', -1)" style="width: 32px; height: 32px; border-radius: 8px;">
                        <i data-lucide="minus"></i>
                    </button>
                    <input type="number" 
                        value="${p.predicted}" 
                        onchange="predictionsView.set('${p.id}', this.value)"
                        style="width: 60px; text-align: center; border: 2px solid #e2e8f0; border-radius: 10px; padding: 6px; font-weight: 700; font-family: 'Outfit';">
                    <button class="btn-icon-small" onclick="predictionsView.adjust('${p.id}', 1)" style="width: 32px; height: 32px; border-radius: 8px;">
                        <i data-lucide="plus"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    renderSuppliesProjection(supplies) {
        return supplies.map(s => {
            const percent = Math.min((s.needed / s.stock) * 100, 100);
            const isDanger = s.needed > s.stock;
            return `
                <div style="background: ${isDanger ? '#fff1f2' : '#f8fafc'}; padding: 15px; border-radius: 16px; border: 1px solid ${isDanger ? '#fecaca' : '#e2e8f0'};">
                    <div style="font-size: 0.8rem; font-weight: 700; color: ${isDanger ? '#991b1b' : '#475569'}; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${s.nombre}">
                        ${s.nombre}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                        <strong style="font-size: 1.1rem; color: var(--primary);">${s.needed.toFixed(1)}</strong>
                        <small style="color: var(--text-muted); font-size: 0.7rem;">/ ${s.stock.toFixed(1)} ${s.unidad}</small>
                    </div>
                    <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                        <div style="width: ${percent}%; height: 100%; background: ${isDanger ? '#ef4444' : 'var(--accent)'};"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    bindEvents(app) {
        this.app = app;
        const dateInput = document.getElementById('predictionDate');
        if (dateInput) {
            dateInput.onchange = (e) => {
                this.selectedDate = e.target.value;
                this.customPredictions = {}; // Reset adjustments on date change
                this.app.renderView('prediction');
            };
        }
    },

    adjust(id, delta) {
        const current = this.customPredictions[id] !== undefined ? this.customPredictions[id] : this.getPredictedFromHistory(id);
        const next = Math.max(0, current + delta);
        this.customPredictions[id] = next;
        this.refresh();
    },

    set(id, val) {
        const next = Math.max(0, parseInt(val) || 0);
        this.customPredictions[id] = next;
        this.refresh();
    },

    getPredictedFromHistory(id) {
        const stats = this.calculatePredictions();
        const p = stats.productPredictions.find(item => item.id === id);
        return p ? p.predicted : 0;
    },

    async refresh() {
        const container = document.getElementById('view-container');
        if (this.app && this.app.currentView === 'prediction') {
            const html = await this.render();
            container.innerHTML = `<div class="view-enter">${html}</div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            this.bindEvents(this.app);
        }
    }
};
