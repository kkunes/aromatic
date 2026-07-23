const cashClosingView = {
    currentSession: null,
    salesChart: null,
    currentFilter: 'today', // 'today', 'month', 'year', 'custom'
    customDate: new Date().toISOString().split('T')[0],

    async render() {
        const sesiones = await db.getCollection('caja_sesiones');
        this.currentSession = sesiones.find(s => !s.fechaCierre);

        if (!this.currentSession) {
            return await this.renderOpeningForm();
        } else {
            return await this.renderActiveDashboard();
        }
    },

    async renderOpeningForm() {
        const sesiones = await db.getCollection('caja_sesiones');
        const closed = sesiones.filter(s => s.fechaCierre).sort((a, b) => new Date(b.fechaCierre) - new Date(a.fechaCierre));
        const lastSession = closed[0];
        const user = db.getCurrentUser();

        let lastSessionHTML = '';
        if (lastSession) {
            const lastDate = new Date(lastSession.fechaCierre).toLocaleDateString('es-MX', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            lastSessionHTML = `
                <div style="background: rgba(226, 150, 93, 0.04); border: 1px solid rgba(226, 150, 93, 0.15); border-radius: 16px; padding: 16px; margin-bottom: 25px; text-align: left;">
                    <div style="display: flex; align-items: center; gap: 8px; color: var(--accent); font-weight: 700; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 8px;">
                        <i data-lucide="info" style="width: 16px; height: 16px;"></i> Último Cierre de Caja
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 4px; color: var(--text-main);">
                        <span>Fecha:</span>
                        <strong style="font-weight: 600;">${lastDate}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 4px; color: var(--text-main);">
                        <span>Efectivo Contado:</span>
                        <strong style="font-weight: 700; color: var(--success);">$${(lastSession.montoFinalReal || 0).toFixed(2)}</strong>
                    </div>
                    ${lastSession.diferencia !== undefined && lastSession.diferencia !== 0 ? `
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-main);">
                            <span>Diferencia:</span>
                            <span style="font-weight: 700; color: ${lastSession.diferencia >= 0 ? 'var(--success)' : 'var(--danger)'};">
                                ${lastSession.diferencia > 0 ? '+' : ''}${(lastSession.diferencia || 0).toFixed(2)}
                            </span>
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            lastSessionHTML = `
                <div style="background: rgba(75, 54, 33, 0.03); border: 1px dashed rgba(75, 54, 33, 0.1); border-radius: 16px; padding: 16px; margin-bottom: 25px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                    No se registran turnos anteriores cerrados en este dispositivo.
                </div>
            `;
        }

        return `
            <div class="cash-closing-container fade-in" style="max-width: 520px; margin: 40px auto; padding: 0 20px;">
                <div class="card" style="padding: 40px; border-radius: 24px; box-shadow: 0 10px 30px rgba(75, 54, 33, 0.08); border: 1px solid rgba(75, 54, 33, 0.05); position: relative; overflow: hidden; background: #fff;">
                    <!-- Top accent line -->
                    <div style="position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, var(--primary), var(--accent));"></div>
                    
                    <div style="width: 70px; height: 70px; background: rgba(226, 150, 93, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 1px solid rgba(226, 150, 93, 0.2);">
                        <i data-lucide="coffee" style="width: 32px; height: 32px; color: var(--accent);"></i>
                    </div>
                    
                    <h1 style="font-family: 'Playfair Display', serif; font-size: 2.2rem; color: var(--primary); margin-bottom: 6px; text-align: center; font-weight: 700;">Apertura de Caja</h1>
                    <p style="color: var(--text-muted); margin-bottom: 25px; text-align: center; font-size: 0.95rem;">
                        Bienvenido a <strong>Aromatic POS</strong>. Inicia tu turno registrando el fondo inicial en efectivo disponible en el cajón de dinero.
                    </p>
                    
                    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 25px; background: #fdf5e6; border: 1px solid rgba(226, 150, 93, 0.15); padding: 8px 16px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; color: var(--primary); width: fit-content; margin-left: auto; margin-right: auto;">
                        <span style="width: 6px; height: 6px; background: var(--accent); border-radius: 50%;"></span>
                        Cajero: ${user.nombre} (${user.rol.toUpperCase()})
                    </div>
                    
                    ${lastSessionHTML}
                    
                    <div class="input-group" style="text-align: left; margin-bottom: 25px;">
                        <label style="font-size: 0.85rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; display: block;">Monto de Fondo Inicial ($)</label>
                        <div style="position: relative;">
                            <span style="position: absolute; left: 20px; top: 50%; transform: translateY(-50%); font-size: 1.8rem; font-weight: 700; color: var(--text-muted); opacity: 0.7;">$</span>
                            <input type="number" id="montoInicial" placeholder="0.00" class="large-input" style="font-size: 2.2rem; text-align: center; padding-left: 45px; border-radius: 16px; border: 2px solid #e8e2dc; background: #faf8f5; transition: border-color 0.2s;" value="0">
                        </div>
                    </div>
                    
                    <!-- Presets buttons to click quickly -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 30px;">
                        <button type="button" class="btn-secondary" onclick="document.getElementById('montoInicial').value = '0'" style="padding: 15px 10px; border-radius: 10px; font-size: 0.85rem; border-color: #ddd; background: #fff; font-weight: 700; color: var(--text-muted);">Sin Fondo</button>
                        <button type="button" class="btn-secondary" onclick="document.getElementById('montoInicial').value = '500'" style="padding: 15px 10px; border-radius: 10px; font-size: 0.95rem; border-color: #ddd; background: #fff; font-weight: 700; color: var(--primary);">$500</button>
                        <button type="button" class="btn-secondary" onclick="document.getElementById('montoInicial').value = '1000'" style="padding: 15px 10px; border-radius: 10px; font-size: 0.95rem; border-color: #ddd; background: #fff; font-weight: 700; color: var(--primary);">$1,000</button>
                        <button type="button" class="btn-secondary" onclick="document.getElementById('montoInicial').value = '2000'" style="padding: 15px 10px; border-radius: 10px; font-size: 0.95rem; border-color: #ddd; background: #fff; font-weight: 700; color: var(--primary);">$2,000</button>
                    </div>

                    <button class="btn-primary btn-large ripple" id="btnAbrirCaja" style="width: 100%; border-radius: 16px; font-weight: 700; font-size: 1.1rem; padding: 20px; box-shadow: 0 6px 20px rgba(75, 54, 33, 0.15); display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i data-lucide="unlock" style="width: 22px; height: 22px;"></i> ABRIR CAJA Y COMENZAR
                    </button>
                    
                    <div style="margin-top: 25px; border-top: 1px solid #f1f0ee; padding-top: 20px; text-align: center;">
                         <button class="btn-secondary" onclick="cashClosingView.showHistory()" style="width: 100%; border-radius: 12px; padding: 15px; border-color: rgba(75, 54, 33, 0.15); font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 8px; color: var(--text-muted);">
                            <i data-lucide="history" style="width: 18px;"></i> Ver Cortes de Caja Anteriores
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    async renderActiveDashboard() {
        const user = db.getCurrentUser();
        // Load layout structure, then async load data
        setTimeout(() => this.loadDashboardData(), 100);
        
        return `
            <div class="cash-closing-container fade-in" style="padding-bottom: 40px;">
                <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
                    <div>
                        <h1 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 2.2rem; color: var(--primary);">Resumen Financiero y Caja</h1>
                        <p style="color: var(--success); display: flex; align-items: center; gap: 6px; font-weight: 500; margin-top: 4px;">
                            <span class="pulse" style="width: 10px; height: 10px; background: var(--success); border-radius: 50%; display: inline-block;"></span>
                            Turno Activo desde: <strong id="turnoActivoTime">Cargando...</strong>
                        </p>
                    </div>
                    <div style="display: flex; gap: 15px; align-items: center;">
                        <!-- Date Filter Buttons -->
                        <div style="display: flex; background: #fff; border-radius: 12px; padding: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.05);">
                            <button id="filterBtn-today" class="btn-choice active" onclick="cashClosingView.setFilter('today')" style="padding: 10px 15px; border-radius: 8px; font-weight: 600;">Hoy</button>
                            <button id="filterBtn-month" class="btn-choice" onclick="cashClosingView.setFilter('month')" style="padding: 10px 15px; border-radius: 8px; font-weight: 600;">Este Mes</button>
                            <button id="filterBtn-year" class="btn-choice" onclick="cashClosingView.setFilter('year')" style="padding: 10px 15px; border-radius: 8px; font-weight: 600;">Este Año</button>
                            <input type="date" id="filterBtn-custom" onchange="cashClosingView.setFilter('custom', this.value)" style="padding: 10px; border-radius: 8px; border: 1px solid #eee; margin-left: 5px; cursor: pointer; color: var(--text-main); font-family: inherit;">
                        </div>

                         <button class="btn-secondary" onclick="cashClosingView.showHistory()" style="padding: 15px; border-radius: 12px;">
                            <i data-lucide="history"></i> Historial
                        </button>
                        <button class="btn-danger ripple" onclick="cashClosingView.triggerClosingForm()" style="padding: 15px 20px; font-weight: 700; border-radius: 12px; font-size: 1.05rem;">
                            <i data-lucide="lock"></i> CERRAR TURNO
                        </button>
                    </div>
                </div>

                <div id="dashboardContent">
                    <div style="text-align: center; padding: 60px; color: var(--text-muted);">
                        <i data-lucide="loader" class="spin" style="width: 40px; height: 40px; color: var(--accent); margin-bottom: 10px;"></i>
                        <p>Cargando analíticas...</p>
                    </div>
                </div>
            </div>
            <style>
                .btn-choice { background: transparent; border: none; cursor: pointer; color: var(--text-muted); transition: 0.2s; }
                .btn-choice.active { background: var(--primary); color: white; box-shadow: 0 4px 10px rgba(75, 54, 33, 0.2); }
                .btn-choice:hover:not(.active) { background: rgba(0,0,0,0.03); }
                .touch-card { transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
                .touch-card:active { transform: scale(0.98); }
            </style>
        `;
    },

    setFilter(filter, value = null) {
        document.querySelectorAll('.btn-choice').forEach(b => b.classList.remove('active'));
        if (filter !== 'custom') {
            document.getElementById('filterBtn-' + filter)?.classList.add('active');
        } else {
            this.customDate = value;
            document.getElementById('filterBtn-custom').classList.add('active');
        }
        this.currentFilter = filter;
        this.loadDashboardData();
    },

    async loadDashboardData() {
        if (!this.currentSession) return;
        const sessionStart = new Date(this.currentSession.fechaApertura);
        document.getElementById('turnoActivoTime').innerText = sessionStart.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });

        const ventas = await db.getCollection('ventas');
        const movimientos = await db.getCollection('caja_movimientos');

        // Apply Time Filter for Analytical Display
        let filteredVentas = [];
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        if (this.currentFilter === 'today') {
            filteredVentas = ventas.filter(v => new Date(v.fecha) >= startOfToday);
        } else if (this.currentFilter === 'month') {
            filteredVentas = ventas.filter(v => new Date(v.fecha) >= startOfMonth);
        } else if (this.currentFilter === 'year') {
            filteredVentas = ventas.filter(v => new Date(v.fecha) >= startOfYear);
        } else if (this.currentFilter === 'custom') {
            const customStart = new Date(this.customDate + 'T00:00:00');
            const customEnd = new Date(this.customDate + 'T23:59:59');
            filteredVentas = ventas.filter(v => {
                const fd = new Date(v.fecha);
                return fd >= customStart && fd <= customEnd;
            });
        }

        // Current Session calculations (always tied to sessionStart, regardless of filter)
        // Cash Drawer values should always reflect the current open session
        const sessionVentas = ventas.filter(v => new Date(v.fecha) >= sessionStart);
        const sessionMovs = movimientos.filter(m => m.idSesion === this.currentSession.id);

        const ventasEfectivoSession = sessionVentas.reduce((sum, v) => {
            const efec = v.desglosePago?.efectivo !== undefined ? v.desglosePago.efectivo : (v.metodoPago === 'Efectivo' ? v.total : 0);
            return sum + efec;
        }, 0);
        const ingresos = sessionMovs.filter(m => m.tipo === 'INGRESO').reduce((sum, m) => sum + m.monto, 0);
        const retiros = sessionMovs.filter(m => m.tipo === 'RETIRO').reduce((sum, m) => sum + m.monto, 0);
        const saldoInicial = this.currentSession.montoInicial;
        const saldoEsperado = saldoInicial + ventasEfectivoSession + ingresos - retiros;

        // Save for the close box modal
        this.currentSaldoEsperado = saldoEsperado;

        // Analytic Data generation based on Filter
        let categoriasData = {};
        let empleadosData = {};
        let totalVentasFilter = 0;
        let metodosData = { 'Efectivo': 0, 'Tarjeta': 0, 'Transferencia': 0 };

        filteredVentas.forEach(v => {
            totalVentasFilter += v.total;
            if (v.desglosePago) {
                metodosData['Efectivo'] += (v.desglosePago.efectivo || 0);
                metodosData['Tarjeta'] += (v.desglosePago.tarjeta || 0);
                metodosData['Transferencia'] += (v.desglosePago.transferencia || 0);
            } else if (metodosData[v.metodoPago] !== undefined) {
                metodosData[v.metodoPago] += v.total;
            }

            // Empleados
            const empName = v.vendedorNombre || 'Sistema/Admin';
            empleadosData[empName] = (empleadosData[empName] || 0) + v.total;

            // Categorias (Iterate items)
            if (v.items && v.items.length > 0) {
                v.items.forEach(item => {
                    const cat = (item.producto?.categoria || item.categoria) || 'Sin Categoría';
                    const itemTotal = item.cantidad * (item.producto?.precio || item.precio || 0);
                    categoriasData[cat] = (categoriasData[cat] || 0) + itemTotal;
                });
            }
        });

        // Generate Labels and Values for Chart
        const catLabels = Object.keys(categoriasData);
        const catValues = Object.values(categoriasData);
        
        // Generate Employees List HTML
        const empleadosHTML = Object.keys(empleadosData).map(emp => {
            const percentage = ((empleadosData[emp] / totalVentasFilter) * 100).toFixed(1);
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; background: rgba(0,0,0,0.02); padding: 12px 15px; border-radius: 12px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; background: var(--accent); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">
                            ${emp.charAt(0).toUpperCase()}
                        </div>
                        <span style="font-weight: 600; color: var(--primary);">${emp}</span>
                    </div>
                    <div style="text-align: right;">
                        <strong style="display: block; font-size: 1.1rem; color: var(--success);">$${empleadosData[emp].toFixed(2)}</strong>
                        <small style="color: var(--text-muted);">${percentage}% del total</small>
                    </div>
                </div>
            `;
        }).join('') || '<div style="text-align: center; color: #999; padding: 20px;">Sin ventas registradas</div>';

        document.getElementById('dashboardContent').innerHTML = `
            <!-- Main Metrics (Filtered) -->
            <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-top: 30px;">
                <div class="stat-card" style="background: linear-gradient(135deg, var(--primary), #2a1f12); padding: 25px; border-radius: 20px; box-shadow: 0 10px 20px rgba(75, 54, 33, 0.2); color: white;">
                    <span style="color: rgba(255,255,255,0.7); font-size: 1rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Ingreso Total (Filtro)</span>
                    <h2 style="font-size: 2.5rem; margin: 10px 0 0; color: white;">$${totalVentasFilter.toFixed(2)}</h2>
                    <div style="display: flex; gap: 15px; margin-top: 15px; font-size: 0.85rem; color: rgba(255,255,255,0.8);">
                        <span><i data-lucide="banknote" style="width: 14px; vertical-align: middle;"></i> Efectivo: $${metodosData['Efectivo'].toFixed(2)}</span>
                        <span><i data-lucide="credit-card" style="width: 14px; vertical-align: middle;"></i> Tarjeta: $${metodosData['Tarjeta'].toFixed(2)}</span>
                    </div>
                </div>

                <div class="stat-card blind-card" style="background: #fff; padding: 25px; border-radius: 20px; box-shadow: 0 10px 20px rgba(0,0,0,0.05); border: 1px solid #f1f0ee; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: center;">
                    <span style="color: #64748b; font-size: 1rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Efectivo en Caja (Turno)</span>
                    <div id="blindTotal" style="margin-top: 15px; display: flex; align-items: center; justify-content: space-between;">
                        <span style="font-size: 2rem; font-weight: 800; color: #94a3b8; letter-spacing: 4px;">$ • • • •</span>
                        ${db.getCurrentUser().rol === 'admin' ? `
                            <button onclick="cashClosingView.revealTotal(${saldoEsperado})" style="border: none; background: rgba(226, 150, 93, 0.1); color: var(--accent); padding: 8px 16px; border-radius: 12px; cursor: pointer; font-size: 0.85rem; font-weight: 700;">VER</button>
                        ` : `
                            <span style="font-size: 0.8rem; color: #cbd5e1; font-weight: 600; font-style: italic;">(Restringido)</span>
                        `}
                    </div>
                    <i data-lucide="eye-off" style="position: absolute; right: -15px; bottom: -15px; width: 100px; height: 100px; opacity: 0.03; transform: rotate(-15deg);"></i>
                </div>
            </div>

            <!-- Analytics Layout -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 30px;">
                <!-- Chart Area -->
                <div class="card" style="padding: 30px; border-radius: 24px;">
                    <h3 style="margin-bottom: 25px; display: flex; align-items: center; gap: 10px; font-size: 1.3rem;">
                        <div style="width: 40px; height: 40px; background: rgba(226,150,93,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <i data-lucide="pie-chart" style="color: var(--accent);"></i>
                        </div>
                        Ingresos por Categoría
                    </h3>
                    <div style="position: relative; height: 300px; width: 100%;">
                        ${catLabels.length > 0 ? '<canvas id="salesCategoryChart"></canvas>' : '<div style="text-align:center; padding-top: 120px; color:#999;">Sin datos para graficar en este periodo</div>'}
                    </div>
                </div>

                <!-- Employees Sales -->
                <div class="card" style="padding: 30px; border-radius: 24px;">
                    <h3 style="margin-bottom: 25px; display: flex; align-items: center; gap: 10px; font-size: 1.3rem;">
                        <div style="width: 40px; height: 40px; background: rgba(75,54,33,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                            <i data-lucide="users" style="color: var(--primary);"></i>
                        </div>
                        Desempeño por Empleado
                    </h3>
                    <div style="max-height: 300px; overflow-y: auto; padding-right: 10px;" class="custom-scrollbar">
                        ${empleadosHTML}
                    </div>
                </div>
            </div>

            <!-- Cash Drawer Operations (Always Active Session) -->
            <h2 style="margin: 40px 0 20px; font-family: 'Playfair Display'; color: var(--primary); font-size: 1.8rem;">Operaciones de Caja (Turno Actual)</h2>
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
                <!-- Lista de Movimientos -->
                <div class="card" style="border-radius: 24px; padding: 25px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="margin:0; font-size: 1.2rem;">Flujo de Efectivo</h3>
                        <div style="display: flex; gap: 15px; font-size: 0.9rem;">
                            <span style="color: var(--success); font-weight: 600;"><i data-lucide="arrow-up-circle" style="width:14px; vertical-align:middle;"></i> +$${ingresos.toFixed(2)}</span>
                            <span style="color: var(--danger); font-weight: 600;"><i data-lucide="arrow-down-circle" style="width:14px; vertical-align:middle;"></i> -$${retiros.toFixed(2)}</span>
                        </div>
                    </div>
                    <div style="max-height: 250px; overflow-y: auto;" class="custom-scrollbar">
                        <table class="modern-table" style="font-size: 0.95rem;">
                            <thead>
                                <tr>
                                    <th>Hora</th>
                                    <th>Tipo</th>
                                    <th>Motivo</th>
                                    <th style="text-align: right;">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${sessionMovs.length > 0 ? sessionMovs.map(m => `
                                    <tr>
                                        <td>${new Date(m.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td><span class="badge ${m.tipo === 'INGRESO' ? 'success' : 'danger'}" style="border-radius: 8px; padding: 6px 10px;">${m.tipo}</span></td>
                                        <td>${m.motivo}</td>
                                        <td style="text-align: right; font-weight: 700; color: ${m.tipo === 'INGRESO' ? 'var(--success)' : 'var(--danger)'};">$${m.monto.toFixed(2)}</td>
                                    </tr>
                                `).join('') : '<tr><td colspan="4" style="text-align: center; color: #999; padding: 20px;">Sin movimientos de flujo extra</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Botones Táctiles Extra Grandes -->
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <div class="card touch-card ripple" onclick="cashClosingView.showMovementModal('INGRESO')" style="padding: 25px; border-radius: 24px; background: linear-gradient(145deg, #ffffff, #f0fdf4); border: 1px solid #bbf7d0; display: flex; align-items: center; gap: 20px; height: 100%;">
                        <div style="width: 60px; height: 60px; background: #dcfce7; border-radius: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 5px 15px rgba(34,197,94,0.2);">
                            <i data-lucide="arrow-down-left" style="color: var(--success); width: 32px; height: 32px;"></i>
                        </div>
                        <div>
                            <span style="display: block; font-weight: 800; font-size: 1.3rem; color: var(--success); margin-bottom: 5px;">Registrar Ingreso</span>
                            <span style="font-size: 0.95rem; color: #64748b;">Cambio, fondeo, depósitos externos.</span>
                        </div>
                    </div>

                    <div class="card touch-card ripple" onclick="cashClosingView.showMovementModal('RETIRO')" style="padding: 25px; border-radius: 24px; background: linear-gradient(145deg, #ffffff, #fef2f2); border: 1px solid #fecaca; display: flex; align-items: center; gap: 20px; height: 100%;">
                        <div style="width: 60px; height: 60px; background: #fee2e2; border-radius: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 5px 15px rgba(239,68,68,0.2);">
                            <i data-lucide="arrow-up-right" style="color: var(--danger); width: 32px; height: 32px;"></i>
                        </div>
                        <div>
                            <span style="display: block; font-weight: 800; font-size: 1.3rem; color: var(--danger); margin-bottom: 5px;">Registrar Retiro</span>
                            <span style="font-size: 0.95rem; color: #64748b;">Sangrías, pagos a proveedores, gastos.</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Render Chart
        if (catLabels.length > 0 && typeof Chart !== 'undefined') {
            const ctx = document.getElementById('salesCategoryChart');
            if (ctx) {
                if (this.salesChart) {
                    this.salesChart.destroy();
                }
                
                const backgroundColors = [
                    '#c28d63', // accent
                    '#4b3621', // primary
                    '#8b5e3c', 
                    '#d9a782',
                    '#f4ede6',
                    '#666666'
                ];

                this.salesChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: catLabels,
                        datasets: [{
                            data: catValues,
                            backgroundColor: backgroundColors,
                            borderWidth: 0,
                            hoverOffset: 10
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '70%',
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    font: { family: "'Outfit', sans-serif", size: 14 },
                                    color: '#4b3621',
                                    padding: 20,
                                    usePointStyle: true,
                                    pointStyle: 'circle'
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(75, 54, 33, 0.9)',
                                titleFont: { family: "'Outfit', sans-serif", size: 14 },
                                bodyFont: { family: "'Outfit', sans-serif", size: 14 },
                                padding: 15,
                                cornerRadius: 10,
                                callbacks: {
                                    label: function(context) {
                                        let label = context.label || '';
                                        if (label) { label += ': '; }
                                        if (context.parsed !== null) {
                                            label += new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(context.parsed);
                                        }
                                        return label;
                                    }
                                }
                            }
                        },
                        animation: {
                            animateScale: true,
                            animateRotate: true
                        }
                    }
                });
            }
        }
    },

    bindEvents() {
        const btnAbrir = document.getElementById('btnAbrirCaja');
        if (btnAbrir) {
            btnAbrir.onclick = async () => {
                const monto = parseFloat(document.getElementById('montoInicial').value);
                if (isNaN(monto)) return app.showToast('Ingrese un monto inicial válido.', 'warning');

                await db.addDocument('caja_sesiones', {
                    fechaApertura: new Date().toISOString(),
                    montoInicial: monto,
                    fechaCierre: null
                });

                app.showToast('¡Caja abierta con éxito! Iniciando turno de ventas.', 'success');
                if (typeof audioService !== 'undefined') audioService.playClick();
                await app.switchView('pos');
            };
        }
    },

    showMovementModal(defaultType = 'INGRESO') {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        modalContent.innerHTML = `
            <h2 style="margin-bottom: 25px; font-family: 'Playfair Display'; color: var(--primary); font-size: 2rem; text-align: center;">Registrar Flujo Extra</h2>
            
            <div style="display: flex; gap: 15px; margin-bottom: 30px;">
                <button type="button" class="btn-choice ${defaultType === 'INGRESO' ? 'active' : ''}" onclick="cashClosingView.toggleType(this, 'INGRESO')" style="flex: 1; padding: 20px; border: 2px solid #eee; border-radius: 16px; cursor: pointer; font-size: 1.1rem; font-weight: 700; display:flex; flex-direction:column; align-items:center; gap:10px;">
                    <i data-lucide="arrow-down-left" style="width: 32px; height: 32px; color: var(--success);"></i>
                    ENTRADA
                </button>
                <button type="button" class="btn-choice ${defaultType === 'RETIRO' ? 'active' : ''}" onclick="cashClosingView.toggleType(this, 'RETIRO')" style="flex: 1; padding: 20px; border: 2px solid #eee; border-radius: 16px; cursor: pointer; font-size: 1.1rem; font-weight: 700; display:flex; flex-direction:column; align-items:center; gap:10px;">
                    <i data-lucide="arrow-up-right" style="width: 32px; height: 32px; color: var(--danger);"></i>
                    SALIDA
                </button>
            </div>
            <input type="hidden" id="movTipo" value="${defaultType}">
            
            <div class="input-group">
                <label style="font-weight: 700; color: var(--primary);">Monto ($)</label>
                <input type="number" id="movMonto" class="large-input" placeholder="0.00" style="font-size: 2rem; text-align: center; height: 70px; border-radius: 16px;">
            </div>

            <div class="input-group">
                <label style="font-weight: 700; color: var(--primary);">Motivo / Descripción</label>
                <input type="text" id="movMotivo" class="large-input" placeholder="Ej: Pago proveedor, Cambio banco..." style="padding: 20px; border-radius: 16px;">
            </div>

            <div style="display: flex; gap: 15px; margin-top: 40px;">
                <button class="btn-secondary" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="flex: 1; padding: 20px; border-radius: 16px; font-weight: 700; font-size: 1.1rem;">Cancelar</button>
                <button class="btn-primary ripple" id="saveMovBtn" style="flex: 2; padding: 20px; border-radius: 16px; font-weight: 700; font-size: 1.1rem; background: var(--primary);">Confirmar Registro</button>
            </div>
            
            <style>
                .btn-choice.active { background: var(--primary) !important; color: white !important; border-color: var(--primary) !important; box-shadow: 0 10px 20px rgba(75, 54, 33, 0.2); }
                .btn-choice.active i { color: white !important; }
            </style>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('saveMovBtn').onclick = async () => {
            const userType = document.getElementById('movTipo').value;
            const monto = parseFloat(document.getElementById('movMonto').value);
            const motivo = document.getElementById('movMotivo').value;

            if (isNaN(monto) || !motivo) return app.showToast('Complete el monto y motivo.', 'warning');

            // VALIDACIÓN: No permitir retiros mayores al saldo en caja
            if (userType === 'RETIRO') {
                const ventas = await db.getCollection('ventas');
                const movimientos = await db.getCollection('caja_movimientos');
                const sessionStart = new Date(this.currentSession.fechaApertura);

                const sessionVentas = ventas.filter(v => new Date(v.fecha) >= sessionStart);
                const sessionMovs = movimientos.filter(m => m.idSesion === this.currentSession.id);

                const ventasEfectivo = sessionVentas.filter(v => v.metodoPago === 'Efectivo').reduce((sum, v) => sum + v.total, 0);
                const ingresos = sessionMovs.filter(m => m.tipo === 'INGRESO').reduce((sum, m) => sum + m.monto, 0);
                const retirosActuales = sessionMovs.filter(m => m.tipo === 'RETIRO').reduce((sum, m) => sum + m.monto, 0);

                const saldoEnCaja = this.currentSession.montoInicial + ventasEfectivo + ingresos - retirosActuales;

                if (monto > saldoEnCaja) {
                    return app.showToast(`Fondos insuficientes. Solo hay $${saldoEnCaja.toFixed(2)} en efectivo.`, 'warning');
                }
            }

            await db.addDocument('caja_movimientos', {
                idSesion: this.currentSession.id,
                tipo: userType,
                monto: monto,
                motivo: motivo,
                fecha: new Date().toISOString()
            });

            modal.classList.add('hidden');
            app.showToast('Movimiento registrado.', 'success');
            if (typeof audioService !== 'undefined') audioService.playClick();
            
            // Reload just the data part
            this.loadDashboardData();
        };

        modal.classList.remove('hidden');
    },

    toggleType(btn, type) {
        document.querySelectorAll('.btn-choice').forEach(b => {
            b.classList.remove('active');
        });
        btn.classList.add('active');
        document.getElementById('movTipo').value = type;
    },

    revealTotal(amount) {
        if (db.getCurrentUser().rol !== 'admin') return;
        const container = document.getElementById('blindTotal');
        if (container) {
            container.innerHTML = `<span style="font-size: 2.2rem; margin: 0; color: #0284c7; font-weight: 800; animation: fadeIn 0.5s;">$${amount.toFixed(2)}</span>`;
        }
    },

    triggerClosingForm() {
        this.renderClosingForm(this.currentSaldoEsperado);
    },

    renderClosingForm(saldoEsperado) {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        modalContent.innerHTML = `
            <h2 style="font-family: 'Playfair Display'; color: var(--primary); font-size: 2rem; text-align: center; margin-bottom: 5px;">Arqueo de Caja</h2>
            <p style="text-align: center; color: var(--text-muted); margin-bottom: 25px;">Verifica el efectivo físico antes de cerrar turno.</p>

            <div style="background: rgba(226, 150, 93, 0.1); padding: 20px; border-radius: 16px; margin-bottom: 30px; text-align: center; border: 1px dashed rgba(226, 150, 93, 0.3);">
                <i data-lucide="info" style="color: var(--accent); margin-bottom: 10px; width: 32px; height: 32px;"></i>
                <p style="font-size: 0.95rem; color: var(--text-main); margin: 0;">Cuenta todo el efectivo en tu cajón y regístralo aquí. El sistema lo comparará con las ventas e ingresos del turno de manera confidencial.</p>
            </div>

            <div class="input-group">
                <label style="font-weight: 700; color: var(--primary); text-transform: uppercase;">Efectivo Físico Contado ($)</label>
                <input type="number" id="closeCounted" class="large-input" placeholder="0.00" style="font-size: 2.5rem; text-align: center; height: 80px; border-radius: 20px; border: 2px solid #e2e8f0;">
            </div>

            <div id="diffDisplay" style="text-align: center; margin: 20px 0; font-weight: bold; font-size: 1.1rem; display: none;"></div>

            <div class="input-group">
                <label style="font-weight: 700; color: var(--primary);">Observaciones (Opcional)</label>
                <textarea id="closeNotes" class="large-input" style="height: 100px; font-size: 1rem; border-radius: 16px; padding: 15px;" placeholder="¿Ocurrió algo relevante durante el turno?"></textarea>
            </div>

            <div style="display: flex; gap: 15px; margin-top: 40px;">
                <button class="btn-secondary" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="flex: 1; padding: 20px; border-radius: 16px; font-size: 1.1rem; font-weight: 700;">Cancelar</button>
                <button class="btn-danger ripple" id="confirmCloseBtn" style="flex: 2; padding: 20px; border-radius: 16px; font-size: 1.1rem; font-weight: 700; background: var(--danger); box-shadow: 0 10px 20px rgba(239, 68, 68, 0.2);">Confirmar Cierre</button>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();

        const input = document.getElementById('closeCounted');
        const diffDisplay = document.getElementById('diffDisplay');

        input.oninput = () => {
            diffDisplay.style.display = 'block';
            diffDisplay.innerHTML = '<span style="color: var(--accent); font-size: 0.95rem; font-weight: 600;"><i data-lucide="check-circle" style="width:16px; vertical-align:middle;"></i> Cantidad ingresada</span>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        };

        document.getElementById('confirmCloseBtn').onclick = async () => {
            const contado = parseFloat(input.value);
            if (isNaN(contado)) return app.showToast('Debe ingresar el efectivo contado.', 'warning');

            const notas = document.getElementById('closeNotes').value;
            const diferencia = contado - saldoEsperado;

            await db.updateDocument('caja_sesiones', this.currentSession.id, {
                fechaCierre: new Date().toISOString(),
                montoFinalEsperado: saldoEsperado,
                montoFinalReal: contado,
                diferencia: diferencia,
                notas: notas
            });

            modal.classList.add('hidden');
            app.showToast('Turno cerrado exitosamente.', 'success');
            if (typeof audioService !== 'undefined') audioService.playClick();
            
            // Re-render completely since session is closed
            app.renderView('cash-closing');
        };

        modal.classList.remove('hidden');
    },

    async showHistory() {
        const sesiones = await db.getCollection('caja_sesiones');
        const closed = sesiones.filter(s => s.fechaCierre).sort((a, b) => new Date(b.fechaCierre) - new Date(a.fechaCierre));

        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        modalContent.innerHTML = `
            <h2 style="font-family: 'Playfair Display'; color: var(--primary); font-size: 2rem; margin-bottom: 25px;">Historial de Turnos</h2>
            <div style="max-height: 500px; overflow-y: auto; margin-top: 10px; padding-right: 10px;" class="custom-scrollbar">
                <table class="modern-table" style="font-size: 0.95rem;">
                    <thead>
                        <tr>
                            <th>Fecha Cierre</th>
                            <th>Apertura</th>
                            <th>Físico Contado</th>
                            <th>Diferencia</th>
                            <th>Notas</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${closed.length > 0 ? closed.map(s => `
                            <tr>
                                <td><strong style="color: var(--primary);">${new Date(s.fechaCierre).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</strong></td>
                                <td>$${s.montoInicial.toFixed(2)}</td>
                                <td style="font-weight: 700;">$${(s.montoFinalReal || 0).toFixed(2)}</td>
                                <td>
                                    <span style="display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; background: ${s.diferencia === 0 ? '#f1f5f9' : s.diferencia > 0 ? '#dcfce7' : '#fee2e2'}; color: ${s.diferencia === 0 ? '#64748b' : s.diferencia > 0 ? '#15803d' : '#b91c1c'};">
                                        ${s.diferencia > 0 ? '+' : ''}${(s.diferencia || 0).toFixed(2)}
                                    </span>
                                </td>
                                <td style="font-size: 0.85rem; color: #64748b; max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${s.notas || ''}">${s.notas || '-'}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">No hay turnos cerrados registrados.</td></tr>'}
                    </tbody>
                </table>
            </div>
            <button class="btn-primary ripple" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="width: 100%; margin-top: 30px; padding: 18px; border-radius: 16px; font-weight: 700; font-size: 1.1rem;">Cerrar Historial</button>
        `;
        modal.classList.remove('hidden');
    }
};
