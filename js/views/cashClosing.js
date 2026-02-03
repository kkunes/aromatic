const cashClosingView = {
    currentSession: null,

    async render() {
        const sesiones = await db.getCollection('caja_sesiones');
        this.currentSession = sesiones.find(s => !s.fechaCierre);

        if (!this.currentSession) {
            return this.renderOpeningForm();
        } else {
            return await this.renderActiveDashboard();
        }
    },

    renderOpeningForm() {
        return `
            <div class="cash-closing-container fade-in" style="max-width: 500px; margin: 50px auto;">
                <div class="card" style="text-align: center; padding: 40px;">
                    <div style="width: 80px; height: 80px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                        <i data-lucide="key" style="width: 40px; height: 40px; color: var(--primary);"></i>
                    </div>
                    <h1 style="margin-bottom: 10px;">Apertura de Caja</h1>
                    <p style="color: var(--text-muted); margin-bottom: 30px;">Inicie un nuevo turno registrando el fondo inicial de efectivo.</p>
                    
                    <div class="input-group" style="text-align: left; margin-bottom: 25px;">
                        <label>Fondo Inicial ($)</label>
                        <input type="number" id="montoInicial" placeholder="0.00" class="large-input" style="font-size: 1.5rem; text-align: center;">
                    </div>

                    <button class="btn-primary btn-large" id="btnAbrirCaja" style="width: 100%;">
                        ABRIR TURNO
                    </button>
                    
                    <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
                         <button class="btn-secondary" onclick="cashClosingView.showHistory()" style="width: 100%;">
                            <i data-lucide="history"></i> Ver Cortes Anteriores
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    async renderActiveDashboard() {
        const ventas = await db.getCollection('ventas');
        const movimientos = await db.getCollection('caja_movimientos');

        // Filter data for current session
        const sessionStart = new Date(this.currentSession.fechaApertura);

        const sessionVentas = ventas.filter(v => new Date(v.fecha) >= sessionStart);
        const sessionMovs = movimientos.filter(m => m.idSesion === this.currentSession.id);

        // Calculate Totals
        const ventasEfectivo = sessionVentas
            .filter(v => v.metodoPago === 'Efectivo')
            .reduce((sum, v) => sum + v.total, 0);

        const ventasTarjeta = sessionVentas
            .filter(v => v.metodoPago === 'Tarjeta')
            .reduce((sum, v) => sum + v.total, 0);

        const ingresos = sessionMovs
            .filter(m => m.tipo === 'INGRESO')
            .reduce((sum, m) => sum + m.monto, 0);

        const retiros = sessionMovs
            .filter(m => m.tipo === 'RETIRO')
            .reduce((sum, m) => sum + m.monto, 0);

        const saldoInicial = this.currentSession.montoInicial;
        const saldoEsperado = saldoInicial + ventasEfectivo + ingresos - retiros;

        return `
            <div class="cash-closing-container fade-in">
                <div class="view-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1 style="margin: 0;">Gestión de Caja</h1>
                        <p style="color: var(--success); display: flex; align-items: center; gap: 6px; font-weight: 500; margin-top: 4px;">
                            <span style="width: 8px; height: 8px; background: var(--success); border-radius: 50%; display: inline-block;"></span>
                            Turno Activo desde: ${sessionStart.toLocaleString('es-MX')}
                        </p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                         <button class="btn-secondary" onclick="cashClosingView.showHistory()">
                            <i data-lucide="history"></i> Historial
                        </button>
                        <button class="btn-danger" onclick="cashClosingView.renderClosingForm(${saldoEsperado})">
                            <i data-lucide="lock"></i> CERRAR TURNO
                        </button>
                    </div>
                </div>

                <div class="dashboard-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 30px;">
                    <div class="stat-card" style="background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <span style="color: var(--text-muted); font-size: 0.9rem;">Fondo Inicial</span>
                        <h2 style="font-size: 1.8rem; margin: 5px 0 0; color: var(--primary);">$${saldoInicial.toFixed(2)}</h2>
                    </div>
                    <div class="stat-card" style="background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <span style="color: var(--text-muted); font-size: 0.9rem;">Ventas Efectivo</span>
                        <h2 style="font-size: 1.8rem; margin: 5px 0 0; color: var(--success);">+$${ventasEfectivo.toFixed(2)}</h2>
                        <small style="color: var(--text-muted);">Tarjeta: $${ventasTarjeta.toFixed(2)}</small>
                    </div>
                    <div class="stat-card" style="background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <span style="color: var(--text-muted); font-size: 0.9rem;">Entradas Extra</span>
                        <h2 style="font-size: 1.8rem; margin: 5px 0 0; color: var(--success);">+$${ingresos.toFixed(2)}</h2>
                    </div>
                    <div class="stat-card" style="background: white; padding: 20px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <span style="color: var(--text-muted); font-size: 0.9rem;">Retiros / Gastos</span>
                        <h2 style="font-size: 1.8rem; margin: 5px 0 0; color: var(--danger);">-$${retiros.toFixed(2)}</h2>
                    </div>
                    <div class="stat-card blind-card" style="background: #f8fafc; padding: 20px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; position: relative; overflow: hidden;">
                        <span style="color: #64748b; font-size: 0.9rem; font-weight: 600;">Efectivo en Caja</span>
                        <div id="blindTotal" style="margin-top: 10px;">
                            <span style="font-size: 1.5rem; font-weight: 800; color: #94a3b8; letter-spacing: 2px;">$ • • • • •</span>
                            ${db.getCurrentUser().rol === 'admin' ? `
                                <button onclick="cashClosingView.revealTotal(${saldoEsperado})" style="margin-left: 10px; border: none; background: none; color: var(--primary); cursor: pointer; font-size: 0.8rem; font-weight: 700; text-decoration: underline;">MOSTRAR</button>
                            ` : `
                                <span style="margin-left: 10px; font-size: 0.75rem; color: #cbd5e1; font-weight: 600; font-style: italic;">(Restringido)</span>
                            `}
                        </div>
                        <i data-lucide="eye-off" style="position: absolute; right: -10px; bottom: -10px; width: 80px; height: 80px; opacity: 0.05; transform: rotate(-15deg);"></i>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; margin-top: 30px;">
                    <!-- Lista de Movimientos -->
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h3>Movimientos de Caja</h3>
                            <button class="btn-icon-small" onclick="cashClosingView.showMovementModal()" title="Nuevo Movimiento">
                                <i data-lucide="plus"></i>
                            </button>
                        </div>
                        <div style="max-height: 400px; overflow-y: auto;">
                            <table class="modern-table">
                                <thead>
                                    <tr>
                                        <th>Hora</th>
                                        <th>Tipo</th>
                                        <th>Motivo</th>
                                        <th>Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${sessionMovs.length > 0 ? sessionMovs.map(m => `
                                        <tr>
                                            <td>${new Date(m.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td><span class="badge ${m.tipo === 'INGRESO' ? 'success' : 'danger'}">${m.tipo}</span></td>
                                            <td>${m.motivo}</td>
                                            <td style="font-weight: bold;">$${m.monto.toFixed(2)}</td>
                                        </tr>
                                    `).join('') : '<tr><td colspan="4" style="text-align: center; color: #999;">Sin movimientos registrados</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Acciones Rápidas -->
                    <div style="display: flex; flex-direction: column; gap: 16px;">
                        <button class="btn-secondary" onclick="cashClosingView.showMovementModal('INGRESO')" style="padding: 20px; justify-content: flex-start;">
                            <div style="width: 40px; height: 40px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                                <i data-lucide="arrow-down-left" style="color: var(--success);"></i>
                            </div>
                            <div style="text-align: left;">
                                <span style="display: block; font-weight: bold; color: var(--success);">Registrar Entrada</span>
                                <span style="font-size: 0.8rem; color: #666;">Cambio, depósitos, etc.</span>
                            </div>
                        </button>

                        <button class="btn-secondary" onclick="cashClosingView.showMovementModal('RETIRO')" style="padding: 20px; justify-content: flex-start;">
                            <div style="width: 40px; height: 40px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                                <i data-lucide="arrow-up-right" style="color: var(--danger);"></i>
                            </div>
                            <div style="text-align: left;">
                                <span style="display: block; font-weight: bold; color: var(--danger);">Registrar Retiro</span>
                                <span style="font-size: 0.8rem; color: #666;">Gastos, pagos, sangría.</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        const btnAbrir = document.getElementById('btnAbrirCaja');
        if (btnAbrir) {
            btnAbrir.onclick = async () => {
                const monto = parseFloat(document.getElementById('montoInicial').value);
                if (isNaN(monto)) return alert('Ingrese un monto válido');

                await db.addDocument('caja_sesiones', {
                    fechaApertura: new Date().toISOString(),
                    montoInicial: monto,
                    fechaCierre: null
                });

                app.renderView('cashClosing');
            };
        }
    },

    showMovementModal(defaultType = 'INGRESO') {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        modalContent.innerHTML = `
            <h2 style="margin-bottom: 20px;">Registrar Movimiento</h2>
            <div class="input-group">
                <label>Tipo de Movimiento</label>
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <button type="button" class="btn-choice ${defaultType === 'INGRESO' ? 'active' : ''}" onclick="cashClosingView.toggleType(this, 'INGRESO')" style="flex: 1; padding: 10px; border: 1px solid #eee; border-radius: 8px; cursor: pointer;">INGRESO</button>
                    <button type="button" class="btn-choice ${defaultType === 'RETIRO' ? 'active' : ''}" onclick="cashClosingView.toggleType(this, 'RETIRO')" style="flex: 1; padding: 10px; border: 1px solid #eee; border-radius: 8px; cursor: pointer;">RETIRO</button>
                </div>
                <input type="hidden" id="movTipo" value="${defaultType}">
            </div>
            
            <div class="input-group">
                <label>Monto</label>
                <input type="number" id="movMonto" class="large-input" placeholder="0.00">
            </div>

            <div class="input-group">
                <label>Motivo / Descripción</label>
                <input type="text" id="movMotivo" class="large-input" placeholder="Ej: Compra de hielo, Cambio del banco">
            </div>

            <div style="display: flex; gap: 10px; margin-top: 30px;">
                <button class="btn-secondary" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="flex: 1;">Cancelar</button>
                <button class="btn-primary" id="saveMovBtn" style="flex: 2;">Guardar</button>
            </div>
            
            <style>
                .btn-choice.active { background: var(--primary); color: white; border-color: var(--primary) !important; font-weight: bold; }
            </style>
        `;

        document.getElementById('saveMovBtn').onclick = async () => {
            const userType = document.getElementById('movTipo').value;
            const monto = parseFloat(document.getElementById('movMonto').value);
            const motivo = document.getElementById('movMotivo').value;

            if (isNaN(monto) || !motivo) return alert('Complete todos los datos');

            // VALIDACIÓN: No permitir retiros mayores al saldo en caja
            if (userType === 'RETIRO') {
                const ventas = await db.getCollection('ventas');
                const movimientos = await db.getCollection('caja_movimientos');
                const sessionStart = new Date(this.currentSession.fechaApertura);

                const sessionVentas = ventas.filter(v => new Date(v.fecha) >= sessionStart);
                const sessionMovs = movimientos.filter(m => m.idSesion === this.currentSession.id);

                const ventasEfectivo = sessionVentas
                    .filter(v => v.metodoPago === 'Efectivo')
                    .reduce((sum, v) => sum + v.total, 0);

                const ingresos = sessionMovs
                    .filter(m => m.tipo === 'INGRESO')
                    .reduce((sum, m) => sum + m.monto, 0);

                const retirosActuales = sessionMovs
                    .filter(m => m.tipo === 'RETIRO')
                    .reduce((sum, m) => sum + m.monto, 0);

                const saldoEnCaja = this.currentSession.montoInicial + ventasEfectivo + ingresos - retirosActuales;

                if (monto > saldoEnCaja) {
                    return alert(`No se puede retirar $${monto.toFixed(2)} porque solo hay $${saldoEnCaja.toFixed(2)} en efectivo en caja.`);
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
            app.renderView('cashClosing');
        };

        modal.classList.remove('hidden');
    },

    toggleType(btn, type) {
        document.querySelectorAll('.btn-choice').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('movTipo').value = type;
    },

    revealTotal(amount) {
        if (db.getCurrentUser().rol !== 'admin') return;
        const container = document.getElementById('blindTotal');
        if (container) {
            container.innerHTML = `<h2 style="font-size: 1.8rem; margin: 0; color: #0284c7;">$${amount.toFixed(2)}</h2>`;
        }
    },

    renderClosingForm(saldoEsperado) {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        modalContent.innerHTML = `
            <h2>Corte de Caja (Arqueo)</h2>
            <p style="color: var(--text-muted); margin-bottom: 20px;">Verifique el efectivo físico en caja.</p>

            <div style="background: #f8fafc; padding: 20px; border-radius: 16px; margin-bottom: 24px; text-align: center; border: 1px solid #e2e8f0;">
                <i data-lucide="info" style="color: var(--primary); margin-bottom: 8px;"></i>
                <p style="font-size: 0.9rem; color: #64748b; margin: 0;">Ingrese el total de efectivo físico que tiene en caja en este momento. El sistema comparará este valor con el saldo esperado de forma interna.</p>
            </div>

            <div class="input-group">
                <label>Efectivo Real (Contado)</label>
                <input type="number" id="closeCounted" class="large-input" placeholder="0.00" style="font-size: 1.4rem;">
            </div>

            <div id="diffDisplay" style="text-align: center; margin: 15px 0; font-weight: bold; font-size: 1.1rem; display: none;"></div>

            <div class="input-group">
                <label>Notas del Turno</label>
                <textarea id="closeNotes" class="large-input" style="height: 80px; font-size: 0.9rem;" placeholder="Observaciones..."></textarea>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 30px;">
                <button class="btn-secondary" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="flex: 1;">Cancelar</button>
                <button class="btn-danger" id="confirmCloseBtn" style="flex: 2;">Finalizar Turno</button>
            </div>
        `;

        const input = document.getElementById('closeCounted');
        const diffDisplay = document.getElementById('diffDisplay');

        input.oninput = () => {
            // No se muestra la diferencia en tiempo real para mantener el arqueo "a ciegas"
            diffDisplay.style.display = 'block';
            diffDisplay.innerHTML = '<span style="color: #64748b; font-size: 0.85rem; font-weight: 500;">Listo para procesar arqueo</span>';
        };

        document.getElementById('confirmCloseBtn').onclick = async () => {
            const contado = parseFloat(input.value);
            if (isNaN(contado)) return alert('Ingrese el monto contado');

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
            alert('Turno cerrado correctamente.');
            app.renderView('cashClosing');
        };

        modal.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    async showHistory() {
        const sesiones = await db.getCollection('caja_sesiones');
        const closed = sesiones.filter(s => s.fechaCierre).sort((a, b) => new Date(b.fechaCierre) - new Date(a.fechaCierre));

        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        modalContent.innerHTML = `
            <h2>Historial de Cortes</h2>
            <div style="max-height: 400px; overflow-y: auto; margin-top: 20px;">
                <table class="modern-table">
                    <thead>
                        <tr>
                            <th>Fecha Cierre</th>
                            <th>Monto Inicial</th>
                            <th>Cierre Real</th>
                            <th>Diferencia</th>
                            <th>Notas</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${closed.length > 0 ? closed.map(s => `
                            <tr>
                                <td>${new Date(s.fechaCierre).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                <td>$${s.montoInicial.toFixed(2)}</td>
                                <td><strong>$${(s.montoFinalReal || 0).toFixed(2)}</strong></td>
                                <td>
                                    <span style="color: ${s.diferencia >= 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: bold;">
                                        ${s.diferencia > 0 ? '+' : ''}${(s.diferencia || 0).toFixed(2)}
                                    </span>
                                </td>
                                <td style="font-size: 0.8em; color: #666;">${s.notas || '-'}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="5" style="text-align: center;">No hay historial</td></tr>'}
                    </tbody>
                </table>
            </div>
            <button class="btn-primary" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="width: 100%; margin-top: 20px;">Cerrar</button>
        `;
        modal.classList.remove('hidden');
    }
};
