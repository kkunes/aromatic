const analyticsView = {
    ventas: [],
    dateStart: '',
    dateEnd: '',

    async render() {
        if (!this.dateStart || !this.dateEnd) {
            const today = new Date();
            const lastMonth = new Date();
            lastMonth.setMonth(today.getMonth() - 1);
            this.dateStart = lastMonth.toLocaleDateString('en-CA');
            this.dateEnd = today.toLocaleDateString('en-CA');
        }

        this.ventas = await db.getCollection('ventas');
        const stats = this.calculateStats();

        return `
            <div class="analytics-container fade-in" style="max-width: 1400px; margin: 0 auto; padding-bottom: 50px;">
                <!-- Header Component -->
                <div style="margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 20px;">
                    <div>
                        <h1 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; margin: 0 0 8px 0; color: var(--primary);">Inteligencia de Negocio</h1>
                        <p style="color: var(--text-muted); font-size: 1rem; margin: 0;">Analiza el rendimiento de tu cafetería y toma mejores decisiones</p>
                    </div>
                    
                    <div style="display: flex; gap: 12px; background: white; padding: 12px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Desde</label>
                            <input type="date" id="analyticsDateStart" value="${this.dateStart}" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 10px; font-family: 'Outfit';">
                        </div>
                        <div style="width: 1px; height: 20px; background: #e2e8f0;"></div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Hasta</label>
                            <input type="date" id="analyticsDateEnd" value="${this.dateEnd}" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 10px; font-family: 'Outfit';">
                        </div>
                        <button class="btn-primary" id="btnUpdateAnalytics" style="padding: 8px 16px; border-radius: 10px; font-size: 0.85rem;">
                            <i data-lucide="refresh-cw" style="width: 14px;"></i> Actualizar
                        </button>
                    </div>
                </div>

                <!-- Main Stats Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 32px;">
                    <!-- Total Revenue Card -->
                    <div class="stat-card-premium" style="background: linear-gradient(135deg, #4B3621 0%, #6D4C41 100%); color: white; padding: 28px; border-radius: 24px; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(75,54,33,0.2);">
                        <i data-lucide="trending-up" style="position: absolute; right: -20px; bottom: -20px; width: 150px; height: 150px; opacity: 0.1;"></i>
                        <div style="position: relative; z-index: 1;">
                            <div style="font-size: 0.9rem; opacity: 0.8; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Ingresos Totales</div>
                            <div style="font-family: 'Playfair Display', serif; font-size: 3rem; font-weight: 700; margin-bottom: 8px;">
                                <span style="font-size: 1.5rem; opacity: 0.7;">$</span>${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div style="display: flex; gap: 20px; font-size: 0.85rem;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <div style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%;"></div>
                                    <span>${stats.totalSales} Ventas</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <div style="width: 8px; height: 8px; background: #fbbf24; border-radius: 50%;"></div>
                                    <span>Ticket Promedio: $${stats.avgTicket.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Top Product Summary -->
                    <div style="background: white; padding: 28px; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h3 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 1.25rem;">Estrella del Menú</h3>
                            <i data-lucide="award" style="color: var(--accent);"></i>
                        </div>
                        ${stats.topProducts.length > 0 ? `
                            <div style="display: flex; align-items: center; gap: 20px;">
                                <div style="width: 80px; height: 80px; background: #fffbeb; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2rem;">
                                    ☕
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-size: 1.2rem; font-weight: 700; color: var(--primary);">${stats.topProducts[0].nombre}</div>
                                    <div style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">
                                        <strong>${stats.topProducts[0].quantity}</strong> unidades vendidas
                                    </div>
                                    <div style="margin-top: 10px; width: 100%; height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden;">
                                        <div style="width: 100%; height: 100%; background: var(--accent);"></div>
                                    </div>
                                </div>
                            </div>
                        ` : '<p style="color: var(--text-muted);">Sin datos suficientes</p>'}
                    </div>

                    <!-- Peak Hour Summary -->
                    <div style="background: white; padding: 28px; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h3 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 1.25rem;">Hora Pico</h3>
                            <i data-lucide="clock" style="color: #3b82f6;"></i>
                        </div>
                        <div style="display: flex; align-items: center; gap: 20px;">
                            <div style="width: 80px; height: 80px; background: #eff6ff; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2rem;">
                                🕒
                            </div>
                            <div style="flex: 1;">
                                <div style="font-size: 1.2rem; font-weight: 700; color: var(--primary);">${stats.peakHour}:00 - ${stats.peakHour + 1}:00</div>
                                <div style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">
                                    Momento de mayor actividad
                                </div>
                                <div style="margin-top: 10px; display: flex; gap: 4px; align-items: flex-end; height: 30px;">
                                    ${Object.values(stats.hourlySales).map(v => {
            const hScale = Math.max(...Object.values(stats.hourlySales));
            const height = hScale > 0 ? (v / hScale) * 30 : 2;
            return `<div style="flex: 1; height: ${height}px; background: #3b82f6; border-radius: 1px; opacity: 0.6;"></div>`;
        }).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 24px;">
                    <!-- Products Performance -->
                    <div class="card" style="padding: 28px; border-radius: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                            <h3 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 1.5rem;">Rendimiento de Productos</h3>
                            <div style="display: flex; background: #f1f5f9; padding: 4px; border-radius: 12px;">
                                <button class="chart-tab active" onclick="analyticsView.switchProductTab('top')" style="border: none; background: white; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">Más Vendidos</button>
                                <button class="chart-tab" onclick="analyticsView.switchProductTab('bottom')" style="border: none; background: transparent; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; color: #64748b;">Menos Vendidos</button>
                            </div>
                        </div>
                        
                        <div id="productsChartContainer" style="display: flex; flex-direction: column; gap: 16px;">
                            ${this.renderProductsList(stats.topProducts.slice(0, 10), 'top')}
                        </div>
                        
                        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9; display: flex; gap: 12px; align-items: center;">
                            <div style="width: 40px; height: 40px; background: #fff1f2; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #e11d48;">
                                <i data-lucide="info" style="width: 20px;"></i>
                            </div>
                            <p style="font-size: 0.85rem; color: #64748b; margin: 0;">
                                <strong>Tip Visual:</strong> Los productos con menos ventas podrían necesitar una promoción o revisión de precio.
                            </p>
                        </div>
                    </div>

                    <!-- Sales Trends -->
                    <div class="card" style="padding: 28px; border-radius: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                            <h3 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 1.5rem;">Tendencia de Ventas</h3>
                            <span style="font-size: 0.8rem; font-weight: 700; color: #64748b; background: #f8fafc; padding: 4px 10px; border-radius: 20px; border: 1px solid #e2e8f0;">Por Día</span>
                        </div>
                        
                        <div style="height: 300px; width: 100%; position: relative; margin-bottom: 24px;">
                            ${this.renderSalesChart(stats.dailyTrend)}
                        </div>

                        <div style="margin-bottom: 24px;">
                            <h4 style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">Desempeño por Día de la Semana</h4>
                            <div style="display: flex; gap: 8px; align-items: flex-end; height: 60px;">
                                ${Object.entries(stats.dayStats).map(([day, total]) => {
            const maxDay = Math.max(...Object.values(stats.dayStats), 1);
            const height = (total / maxDay) * 100;
            const isBest = day === stats.bestDayName;
            return `
                                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                                            <div style="width: 100%; height: ${height}%; background: ${isBest ? 'var(--accent)' : '#cbd5e1'}; border-radius: 4px; min-height: 4px; transition: height 1s;"></div>
                                            <span style="font-size: 0.65rem; font-weight: 700; color: #64748b;">${day.substring(0, 2)}</span>
                                        </div>
                                    `;
        }).join('')}
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div style="background: #f8fafc; padding: 16px; border-radius: 16px; border: 1px solid #f1f5f9;">
                                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">Día de Oro</div>
                                <div style="font-size: 1.1rem; font-weight: 700; color: var(--primary);">${stats.bestDayName}</div>
                                <div style="font-size: 0.8rem; color: #22c55e; font-weight: 600;">$${stats.bestDayTotal.toFixed(2)} acumulados</div>
                            </div>
                            <div style="background: #f8fafc; padding: 16px; border-radius: 16px; border: 1px solid #f1f5f9;">
                                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">Día Flojo</div>
                                <div style="font-size: 1.1rem; font-weight: 700; color: var(--primary);">${stats.worstDayName}</div>
                                <div style="font-size: 0.8rem; color: #ef4444; font-weight: 600;">$${stats.worstDayTotal.toFixed(2)} acumulados</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Actionable Insights Section -->
                <div style="margin-top: 32px; background: white; padding: 32px; border-radius: 24px; background: linear-gradient(to right, #ffffff, #fafaf9);">
                    <h3 style="margin: 0 0 24px 0; font-family: 'Playfair Display', serif; font-size: 1.8rem;">Sugerencias Estratégicas</h3>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                        <div style="display: flex; gap: 16px; padding: 20px; background: rgba(226, 150, 93, 0.05); border-radius: 20px; border: 1px solid rgba(226, 150, 93, 0.1);">
                            <div style="width: 48px; height: 48px; background: var(--accent); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;">
                                <i data-lucide="users"></i>
                            </div>
                            <div>
                                <h4 style="margin: 0 0 6px 0; font-size: 1.1rem; color: var(--primary);">Optimización de Personal</h4>
                                <p style="margin: 0; font-size: 0.9rem; color: #57534e; line-height: 1.5;">Refuerza el equipo entre las <strong>${stats.peakHour}:00 y ${stats.peakHour + 2}:00</strong> los días <strong>${stats.bestDayName}</strong> para mantener la calidad del servicio premium.</p>
                            </div>
                        </div>

                        <div style="display: flex; gap: 16px; padding: 20px; background: rgba(59, 130, 246, 0.05); border-radius: 20px; border: 1px solid rgba(59, 130, 246, 0.1);">
                            <div style="width: 48px; height: 48px; background: #3b82f6; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;">
                                <i data-lucide="tag"></i>
                            </div>
                            <div>
                                <h4 style="margin: 0 0 6px 0; font-size: 1.1rem; color: var(--primary);">Promociones Inteligentes</h4>
                                <p style="margin: 0; font-size: 0.9rem; color: #57534e; line-height: 1.5;">Lanza un "Happy Hour" los días <strong>${stats.worstDayName}</strong> o para el producto <strong>"${stats.bottomProducts[0]?.nombre || 'menos vendido'}"</strong> para impulsar la rotación.</p>
                            </div>
                        </div>

                        <div style="display: flex; gap: 16px; padding: 20px; background: rgba(34, 197, 94, 0.05); border-radius: 20px; border: 1px solid rgba(34, 197, 94, 0.1);">
                            <div style="width: 48px; height: 48px; background: #22c55e; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;">
                                <i data-lucide="bar-chart"></i>
                            </div>
                            <div>
                                <h4 style="margin: 0 0 6px 0; font-size: 1.1rem; color: var(--primary);">Ajuste de Precios</h4>
                                <p style="margin: 0; font-size: 0.9rem; color: #57534e; line-height: 1.5;">Tu ticket promedio es de <strong>$${stats.avgTicket.toFixed(2)}</strong>. Considera crear combos que sumen un 15% a este valor para subir el profit.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    calculateStats() {
        const start = new Date(this.dateStart + 'T00:00:00');
        const end = new Date(this.dateEnd + 'T23:59:59');

        const filtered = this.ventas.filter(v => {
            const d = new Date(v.fecha);
            return d >= start && d <= end;
        });

        const revenue = filtered.reduce((sum, v) => sum + v.total, 0);
        const count = filtered.length;
        const avg = count > 0 ? revenue / count : 0;

        // Products stats
        const productMap = {};
        filtered.forEach(v => {
            v.items.forEach(item => {
                if (!productMap[item.nombre]) {
                    productMap[item.nombre] = { nombre: item.nombre, quantity: 0, revenue: 0 };
                }
                productMap[item.nombre].quantity += item.quantity;
                productMap[item.nombre].revenue += (item.precio * item.quantity);
            });
        });

        const sortedProducts = Object.values(productMap).sort((a, b) => b.quantity - a.quantity);
        const topProducts = sortedProducts;
        const bottomProducts = [...sortedProducts].reverse();

        // Hourly stats
        const hourly = {};
        for (let i = 0; i < 24; i++) hourly[i] = 0;
        filtered.forEach(v => {
            const hour = new Date(v.fecha).getHours();
            hourly[hour] += v.total;
        });
        let peakHour = 0;
        let maxH = -1;
        Object.entries(hourly).forEach(([h, total]) => {
            if (total > maxH) {
                maxH = total;
                peakHour = parseInt(h);
            }
        });

        // Day of week stats
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayStats = {};
        days.forEach(d => dayStats[d] = 0);
        filtered.forEach(v => {
            const day = days[new Date(v.fecha).getDay()];
            dayStats[day] += v.total;
        });
        let bestDay = 'Lunes', worstDay = 'Lunes';
        let maxD = -1, minD = Infinity;
        Object.entries(dayStats).forEach(([d, total]) => {
            if (total > maxD) { maxD = total; bestDay = d; }
            if (total < minD && total > 0) { minD = total; worstDay = d; }
        });

        // Daily trend for chart
        const dailyTrend = {};
        // Fill range with zeros
        let current = new Date(start);
        while (current <= end) {
            dailyTrend[current.toLocaleDateString('en-CA')] = 0;
            current.setDate(current.getDate() + 1);
        }
        filtered.forEach(v => {
            const dStr = new Date(v.fecha).toLocaleDateString('en-CA');
            if (dailyTrend[dStr] !== undefined) dailyTrend[dStr] += v.total;
        });

        return {
            totalRevenue: revenue,
            totalSales: count,
            avgTicket: avg,
            topProducts,
            bottomProducts,
            hourlySales: hourly,
            peakHour,
            bestDayName: bestDay,
            bestDayTotal: maxD,
            worstDayName: worstDay,
            worstDayTotal: minD === Infinity ? 0 : minD,
            dailyTrend,
            dayStats
        };
    },

    renderProductsList(products, type) {
        if (products.length === 0) return '<p style="text-align:center; color: #94a3b8; padding: 20px;">Sin datos para este periodo</p>';

        const maxQty = products[0].quantity;

        return products.map((p, idx) => {
            const percent = (p.quantity / maxQty) * 100;
            const color = type === 'top' ? 'var(--accent)' : '#ef4444';

            return `
                <div style="display: flex; align-items: center; gap: 15px;">
                    <span style="width: 25px; font-weight: 800; color: #cbd5e1; font-size: 0.8rem;">${idx + 1}</span>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <span style="font-weight: 600; font-size: 0.95rem; color: var(--primary);">${p.nombre}</span>
                            <span style="font-weight: 700; font-size: 0.9rem;">${p.quantity} <small style="font-weight: 400; color: #64748b;">uds</small></span>
                        </div>
                        <div style="width: 100%; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; display: flex;">
                            <div style="width: ${percent}%; height: 100%; background: ${color}; border-radius: 4px; transition: width 1s ease-out;"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderSalesChart(trend) {
        const entries = Object.entries(trend);
        if (entries.length === 0) return '';

        const maxVal = Math.max(...Object.values(trend), 100);
        const width = 1000;
        const height = 300;
        const padding = 20;

        const points = entries.map(([date, val], idx) => {
            const x = (idx / (entries.length - 1)) * (width - padding * 2) + padding;
            const y = height - (val / maxVal) * (height - padding * 2) - padding;
            return { x, y, val, date };
        });

        let pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            pathD += ` L ${points[i].x} ${points[i].y}`;
        }

        let areaD = pathD + ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

        return `
            <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%; overflow: visible;" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.2" />
                        <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
                    </linearGradient>
                </defs>
                
                <!-- Grid Lines -->
                <line x1="0" y1="${height - padding}" x2="${width}" y2="${height - padding}" stroke="#f1f5f9" stroke-width="1" />
                <line x1="0" y1="${padding}" x2="${width}" y2="${padding}" stroke="#f1f5f9" stroke-width="1" />
                
                <!-- Area -->
                <path d="${areaD}" fill="url(#chartGradient)" />
                
                <!-- Line -->
                <path d="${pathD}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                
                <!-- Points -->
                ${points.length < 50 ? points.map(p => `
                    <circle cx="${p.x}" cy="${p.y}" r="4" fill="white" stroke="var(--accent)" stroke-width="2" />
                `).join('') : ''}
                
                <!-- Labels Tooltip Hack (simplified) -->
                ${points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 6)) === 0).map(p => {
            const d = new Date(p.date + 'T00:00:00');
            const label = d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
            return `<text x="${p.x}" y="${height + 5}" font-family="Outfit" font-size="12" fill="#94a3b8" text-anchor="middle">${label}</text>`;
        }).join('')}
            </svg>
        `;
    },

    bindEvents(app) {
        this.app = app;
        const btnUpdate = document.getElementById('btnUpdateAnalytics');
        if (btnUpdate) {
            btnUpdate.onclick = () => {
                this.dateStart = document.getElementById('analyticsDateStart').value;
                this.dateEnd = document.getElementById('analyticsDateEnd').value;
                this.app.renderView('analytics');
            };
        }
    },

    async switchProductTab(type) {
        const tabs = document.querySelectorAll('.chart-tab');
        tabs.forEach(t => {
            t.classList.remove('active');
            t.style.background = 'transparent';
            t.style.color = '#64748b';
            t.style.boxShadow = 'none';
        });

        const activeTab = event.currentTarget;
        activeTab.classList.add('active');
        activeTab.style.background = 'white';
        activeTab.style.color = 'var(--primary)';
        activeTab.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';

        const container = document.getElementById('productsChartContainer');
        const stats = this.calculateStats();

        if (type === 'top') {
            container.innerHTML = this.renderProductsList(stats.topProducts.slice(0, 10), 'top');
        } else {
            container.innerHTML = this.renderProductsList(stats.bottomProducts.slice(0, 10), 'bottom');
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};
