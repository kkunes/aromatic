const cashClosingView = {
    currentSession: null,

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
                        <button type="button" class="btn-secondary" onclick="document.getElementById('montoInicial').value = '0'" style="padding: 10px; border-radius: 10px; font-size: 0.85rem; border-color: #ddd; background: #fff; font-weight: 700; color: var(--text-muted);">Sin Fondo</button>
                        <button type="button" class="btn-secondary" onclick="document.getElementById('montoInicial').value = '500'" style="padding: 10px; border-radius: 10px; font-size: 0.85rem; border-color: #ddd; background: #fff; font-weight: 700; color: var(--primary);">$500</button>
                        <button type="button" class="btn-secondary" onclick="document.getElementById('montoInicial').value = '1000'" style="padding: 10px; border-radius: 10px; font-size: 0.85rem; border-color: #ddd; background: #fff; font-weight: 700; color: var(--primary);">$1,000</button>
                        <button type="button" class="btn-secondary" onclick="document.getElementById('montoInicial').value = '2000'" style="padding: 10px; border-radius: 10px; font-size: 0.85rem; border-color: #ddd; background: #fff; font-weight: 700; color: var(--primary);">$2,000</button>
                    </div>

                    <button class="btn-primary btn-large ripple" id="btnAbrirCaja" style="width: 100%; border-radius: 16px; font-weight: 700; font-size: 1.1rem; padding: 18px; box-shadow: 0 6px 20px rgba(75, 54, 33, 0.15); display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i data-lucide="unlock" style="width: 20px; height: 20px;"></i> ABRIR CAJA Y COMENZAR
                    </button>
                    
                    <div style="margin-top: 25px; border-top: 1px solid #f1f0ee; padding-top: 20px; text-align: center;">
                         <button class="btn-secondary" onclick="cashClosingView.showHistory()" style="width: 100%; border-radius: 12px; padding: 12px; border-color: rgba(75, 54, 33, 0.15); font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 8px; color: var(--text-muted);">
                            <i data-lucide="history" style="width: 18px;"></i> Ver Cortes de Caja Anteriores
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

        const ventasTransferencia = sessionVentas
            .filter(v => v.metodoPago === 'Transferencia')
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
                        <small style="color: var(--text-muted);">Tarjeta: $${ventasTarjeta.toFixed(2)} | Transf: $${ventasTransferencia.toFixed(2)}</small>
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
                    return app.showToast(`Fondos insuficientes. Solo hay $${saldoEnCaja.toFixed(2)} en efectivo en caja.`, 'warning');
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
            app.showToast('Movimiento registrado correctamente', 'success');
            if (typeof audioService !== 'undefined') audioService.playClick();
            app.renderView('cash-closing');
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
            app.showToast('Turno cerrado correctamente.', 'success');
            if (typeof audioService !== 'undefined') audioService.playClick();
            await app.switchView('cash-closing');
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
