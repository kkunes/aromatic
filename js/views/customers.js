/**
 * Customers and Loyalty View
 */

const customersView = {
    customers: [],
    filterQuery: '',
    activeSubView: 'list',

    async render() {
        this.customers = await db.getCollection('clientes');
        const settings = db.getSettings();
        const loyalty = settings.fidelizacion;

        if (this.activeSubView === 'loyalty') {
            return this.renderLoyaltyConfig(settings);
        }

        const filtered = this.customers.filter(c =>
            c.nombre.toLowerCase().includes(this.filterQuery.toLowerCase()) ||
            (c.telefono && c.telefono.includes(this.filterQuery))
        );

        return `
            <div class="customers-view fade-in" style="padding-bottom: 40px;">
                <div class="view-header" style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; gap: 20px; flex-wrap: wrap;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <div style="width: 42px; height: 42px; background: var(--primary); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(75, 54, 33, 0.2);">
                                <i data-lucide="users" style="width: 24px; height: 24px;"></i>
                            </div>
                            <h1 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 2.2rem; color: var(--primary);">Directorio de Clientes</h1>
                        </div>
                        <p style="color: var(--text-muted); font-size: 1rem; margin-left: 54px;">Gestión de fidelidad y perfiles exclusivos</p>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn-secondary" onclick="customersView.switchSubView('loyalty')" style="padding: 14px 28px; border-radius: 16px; font-weight: 700; font-size: 1rem; display: flex; align-items: center; gap: 10px; transition: all 0.3s; border: 2px solid var(--accent); color: var(--accent);">
                            <i data-lucide="settings" style="width: 20px;"></i> PROGRAMA DE LEALTAD
                        </button>
                        <button class="btn-primary" id="addCustomerBtn" style="padding: 14px 28px; border-radius: 16px; font-weight: 700; font-size: 1rem; display: flex; align-items: center; gap: 10px; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);">
                            <i data-lucide="user-plus" style="width: 20px;"></i> REGISTRAR CLIENTE
                        </button>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 24px; margin-bottom: 35px;">
                   <!-- Loyalty Info Card -->
                   <div class="loyalty-banner" style="background: linear-gradient(145deg, #2d231a, #4b3621); color: white; padding: 25px; border-radius: 24px; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.15); display: flex; flex-direction: column; justify-content: center;">
                        <div style="position: absolute; top: -20px; right: -20px; width: 120px; height: 120px; background: rgba(255,255,255,0.03); border-radius: 50%;"></div>
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; position: relative;">
                            <div style="background: rgba(226, 150, 93, 0.2); color: var(--accent); width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                <i data-lucide="sparkles" style="width: 18px;"></i>
                            </div>
                            <span style="letter-spacing: 2px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--accent);">Loyalty System</span>
                        </div>
                        <h3 style="margin: 0; font-size: 1.4rem; font-family: 'Playfair Display', serif;">Acumulación Premium</h3>
                        <p style="margin: 8px 0 0; opacity: 0.7; font-size: 0.9rem; line-height: 1.4;">Cada $10.00 MXN equivalen a ${loyalty.puntosPorDinero} punto. Canjea cada punto por $${loyalty.valorPunto.toFixed(2)} al pagar.</p>
                   </div>

                    <!-- Search & Filters -->
                   <div style="background: white; border-radius: 24px; border: 1px solid #f1f5f9; padding: 25px; display: flex; flex-direction: column; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
                        <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">Búsqueda Inteligente</label>
                        <div class="search-container" style="width: 100%; max-width: none; background: #f8fafc; border-radius: 16px; padding: 5px 20px; border: 1px solid #e2e8f0; transition: all 0.3s; box-shadow: none;">
                            <i data-lucide="search" style="color: #94a3b8; width: 18px;"></i>
                            <input type="text" id="customerSearch" placeholder="Buscar por nombre, apellidos o teléfono..." value="${this.filterQuery}" 
                                   style="background: transparent; height: 50px; font-size: 1rem; width: 100%; border: none; outline: none; font-family: 'Outfit', sans-serif;">
                        </div>
                   </div>
                </div>

                <div class="customers-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;">
                    ${filtered.length === 0 ? `
                        <div class="empty-state" style="grid-column: 1/-1; padding: 80px 20px; text-align: center; background: white; border-radius: 30px; border: 2px dashed #e2e8f0;">
                            <div style="width: 80px; height: 80px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #cbd5e1;">
                                <i data-lucide="user-search" style="width: 40px; height: 40px;"></i>
                            </div>
                            <h3 style="color: #64748b; font-family: 'Playfair Display', serif; font-size: 1.5rem; margin-bottom: 8px;">Sin resultados encontrados</h3>
                            <p style="color: #94a3b8;">Prueba con otros términos de búsqueda o registra un nuevo cliente.</p>
                        </div>
                    ` : filtered.map((c, idx) => `
                        <div class="premium-customer-card fade-in-up" style="animation-delay: ${idx * 0.05}s;">
                            <div class="cust-card-inner">
                                <div class="cust-card-header">
                                    <div class="cust-avatar">
                                        <div class="avatar-bg"></div>
                                        <span>${c.nombre.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div class="cust-main-info">
                                        <h3 title="${c.nombre}">${c.nombre}</h3>
                                        <div class="cust-contact">
                                            <i data-lucide="phone"></i>
                                            <span>${c.telefono || 'Sin registro'}</span>
                                        </div>
                                    </div>
                                    <div class="cust-badge-points">
                                        <div class="points-val">${c.puntos || 0}</div>
                                        <div class="points-lbl">Puntos</div>
                                    </div>
                                </div>
                                
                                <div class="cust-card-footer">
                                    <div class="cust-monetary-val">
                                        <div class="lbl">Saldos Disponibles</div>
                                        <div class="val">$${(this.calculateTotalValue(c.puntos || 0, settings)).toFixed(2)} <span style="font-size: 0.75rem; letter-spacing: 0;">MXN</span></div>
                                    </div>
                                    <div class="cust-actions">
                                        <button class="btn-action-premium edit" onclick="customersView.editCustomer('${c.id}')" title="Editar Perfil">
                                            <i data-lucide="settings-2"></i>
                                        </button>
                                        <button class="btn-action-premium delete" onclick="customersView.deleteCustomer('${c.id}')" title="Eliminar Cliente">
                                            <i data-lucide="trash-2"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <style>
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                .fade-in-up {
                    animation: fadeInUp 0.5s cubic-bezier(0.23, 1, 0.32, 1) both;
                }
                
                .premium-customer-card {
                    perspective: 1000px;
                }
                
                .cust-card-inner {
                    background: white;
                    border-radius: 28px;
                    padding: 24px;
                    border: 1px solid #f1f5f9;
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                    position: relative;
                    overflow: hidden;
                    height: 100%;
                }
                
                .premium-customer-card:hover .cust-card-inner {
                    transform: translateY(-8px);
                    box-shadow: 0 15px 35px rgba(75, 54, 33, 0.08);
                    border-color: rgba(226, 150, 93, 0.2);
                }
                
                .cust-card-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                .cust-avatar {
                    width: 56px;
                    height: 56px;
                    background: #fdfaf6;
                    border-radius: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    border: 1px solid #f973161a;
                    flex-shrink: 0;
                }
                
                .cust-avatar span {
                    color: var(--primary);
                    font-weight: 800;
                    font-size: 1.4rem;
                    position: relative;
                }
                
                .avatar-bg {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, rgba(226, 150, 93, 0.1), transparent);
                    border-radius: inherit;
                }
                
                .cust-main-info {
                    flex: 1;
                    overflow: hidden;
                }
                
                .cust-main-info h3 {
                    margin: 0;
                    font-size: 1.15rem;
                    font-weight: 700;
                    color: #1e293b;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .cust-contact {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 4px;
                    color: #94a3b8;
                    font-size: 0.85rem;
                }
                
                .cust-contact i {
                    width: 12px;
                    height: 12px;
                }
                
                .cust-badge-points {
                    text-align: right;
                    background: #fffaf5;
                    padding: 8px 12px;
                    border-radius: 14px;
                    border: 1px solid #f9731610;
                    min-width: 65px;
                }
                
                .points-val {
                    font-weight: 800;
                    color: var(--accent);
                    font-size: 1.2rem;
                    line-height: 1;
                }
                
                .points-lbl {
                    font-size: 0.6rem;
                    color: #94a3b8;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-top: 2px;
                }
                
                .cust-card-footer {
                    margin-top: auto;
                    padding-top: 18px;
                    border-top: 1px solid #f1f5f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                }
                
                .cust-monetary-val .lbl {
                    font-size: 0.7rem;
                    color: #94a3b8;
                    font-weight: 700;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                }
                
                .cust-monetary-val .val {
                    font-size: 1.25rem;
                    font-weight: 800;
                    color: #15803d;
                    display: flex;
                    align-items: baseline;
                    gap: 2px;
                }
                
                .cust-actions {
                    display: flex;
                    gap: 8px;
                }
                
                .btn-action-premium {
                    width: 38px;
                    height: 38px;
                    border-radius: 12px;
                    border: 1px solid #f1f5f9;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    color: #64748b;
                }
                
                .btn-action-premium:hover.edit {
                    background: #f0fdf9;
                    color: #059669;
                    border-color: #05966930;
                    transform: translateY(-2px);
                }
                
                .btn-action-premium:hover.delete {
                    background: #fef2f2;
                    color: #dc2626;
                    border-color: #dc262630;
                    transform: translateY(-2px);
                }
                
                .btn-action-premium i {
                    width: 16px;
                    height: 16px;
                }
            </style>
        `;
    },

    renderLoyaltyConfig(settings) {
        const loyalty = settings.fidelizacion;
        const totalClientes = this.customers.length;
        const clientesConPuntos = this.customers.filter(c => (c.puntos || 0) > 0).length;
        const totalPuntos = this.customers.reduce((sum, c) => sum + (c.puntos || 0), 0);
        const valorTotal = totalPuntos * (loyalty.valorPunto || 0);

        return `
            <div class="loyalty-config-view fade-in" style="max-width: 1000px; margin: 0 auto; padding-bottom: 60px;">
                <!-- Header -->
                <div class="view-header" style="margin-bottom: 40px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <button class="btn-icon-premium" onclick="customersView.switchSubView('list')" style="width: 50px; height: 50px; background: white; border: 1px solid #e2e8f0; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: var(--primary); cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                            <i data-lucide="arrow-left" style="width: 24px;"></i>
                        </button>
                        <div>
                            <h1 style="font-family: 'Playfair Display', serif; font-size: 2.8rem; margin: 0; color: var(--primary); letter-spacing: -1px;">Programa de Lealtad</h1>
                            <p style="color: var(--text-muted); font-size: 1.1rem; margin: 4px 0 0 0; font-weight: 500;">Configure la estructura de recompensas y fidelización</p>
                        </div>
                    </div>
                    <div style="background: white; padding: 10px 20px; border-radius: 20px; border: 1px solid #f1f5f9; display: flex; align-items: center; gap: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                        <span style="font-weight: 700; font-size: 0.9rem; color: ${loyalty.activo ? '#15803d' : '#94a3b8'}">
                            ${loyalty.activo ? 'SISTEMA ACTIVADO' : 'SISTEMA DESACTIVADO'}
                        </span>
                        <label class="switch">
                            <input type="checkbox" id="loyaltyMasterToggle" ${loyalty.activo ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>

                <!-- Metrics Dashboard -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px;">
                    <div class="glass-stat-card" style="background: linear-gradient(135deg, var(--primary) 0%, #2d231a 100%); color: white; padding: 25px; border-radius: 24px; box-shadow: 0 10px 25px rgba(45,35,26,0.15); transition: transform 0.3s ease;">
                        <i data-lucide="users" style="width: 24px; color: var(--accent); margin-bottom: 15px;"></i>
                        <div style="font-size: 2rem; font-weight: 800; font-family: 'Playfair Display', serif;">${clientesConPuntos}</div>
                        <div style="font-size: 0.8rem; opacity: 0.8; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Clientes Leales</div>
                    </div>
                    <div class="glass-stat-card" style="background: white; padding: 25px; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: 0 4px 15px rgba(0,0,0,0.02); transition: transform 0.3s ease;">
                        <i data-lucide="award" style="width: 24px; color: var(--accent); margin-bottom: 15px;"></i>
                        <div style="font-size: 2rem; font-weight: 800; font-family: 'Playfair Display', serif; color: var(--primary);">${totalPuntos.toLocaleString()}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Puntos en Circulación</div>
                    </div>
                    <div class="glass-stat-card" style="background: white; padding: 25px; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: 0 4px 15px rgba(0,0,0,0.02); transition: transform 0.3s ease;">
                        <i data-lucide="banknote" style="width: 24px; color: #15803d; margin-bottom: 15px;"></i>
                        <div style="font-size: 2rem; font-weight: 800; font-family: 'Playfair Display', serif; color: #15803d;">$${valorTotal.toFixed(2)}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Valor en Monederos</div>
                    </div>
                    <div class="glass-stat-card" style="background: white; padding: 25px; border-radius: 24px; border: 1px solid #f1f5f9; box-shadow: 0 4px 15px rgba(0,0,0,0.02); transition: transform 0.3s ease;">
                        <i data-lucide="trending-up" style="width: 24px; color: var(--primary); margin-bottom: 15px;"></i>
                        <div style="font-size: 2rem; font-weight: 800; font-family: 'Playfair Display', serif; color: var(--primary);">${totalClientes > 0 ? Math.round((clientesConPuntos / totalClientes) * 100) : 0}%</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Tasa de Retención</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 350px 1fr; gap: 30px; align-items: start;">
                    <!-- Rules Sidebar -->
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="premium-config-card" style="background: #fdfaf6; border-radius: 28px; padding: 30px; border: 1px solid rgba(226, 150, 93, 0.2);">
                            <h3 style="margin: 0 0 20px 0; font-size: 1.2rem; color: var(--primary); display: flex; align-items: center; gap: 10px;">
                                <i data-lucide="zap" style="width: 20px; color: var(--accent);"></i>
                                Reglas de Ganancia
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 15px;">
                                <div class="input-group">
                                    <label style="font-weight: 700; font-size: 0.85rem; color: #94a3b8; text-transform: uppercase;">Puntos a otorgar</label>
                                    <div style="position: relative; margin-top: 10px;">
                                        <input type="number" id="loyaltyPuntosXDinero" value="${loyalty.puntosPorDinero || 1}" min="1" class="premium-input" style="width: 100%; border-radius: 16px; padding: 15px 15px 15px 50px; font-size: 1.5rem; font-weight: 800; color: var(--primary); border: 1.5px solid #e2e8f0; outline: none;">
                                        <i data-lucide="award" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); width: 22px; color: var(--accent);"></i>
                                    </div>
                                </div>

                                <div class="input-group">
                                    <label style="font-weight: 700; font-size: 0.85rem; color: #94a3b8; text-transform: uppercase;">Por cada monto de ($)</label>
                                    <div style="position: relative; margin-top: 10px;">
                                        <input type="number" id="loyaltyDineroBase" value="${loyalty.dineroBase || 10}" min="1" class="premium-input" style="width: 100%; border-radius: 16px; padding: 15px 15px 15px 50px; font-size: 1.5rem; font-weight: 800; color: #15803d; border: 1.5px solid #e2e8f0; outline: none;">
                                        <i data-lucide="banknote" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); width: 22px; color: #15803d;"></i>
                                    </div>
                                </div>
                            </div>

                            <p id="earningHelp" style="font-size: 0.85rem; color: var(--text-muted); margin-top: 20px; padding: 15px; background: white; border-radius: 12px; border: 1px dashed #e2e8f0; line-height: 1.4;">
                                <strong>Resumen:</strong> El cliente recibirá <strong style="color: var(--accent);">${loyalty.puntosPorDinero}</strong> puntos por cada <strong style="color: #15803d;">$${loyalty.dineroBase}</strong> gastados.
                            </p>

                            <div class="input-group" style="margin-top: 25px;">
                                <label style="font-weight: 700; font-size: 0.85rem; color: #94a3b8; text-transform: uppercase;">Mínimo para Canje</label>
                                <div style="position: relative; margin-top: 10px;">
                                    <input type="number" id="loyaltyMinimo" value="${loyalty.puntosParaCanje}" min="0" class="premium-input" style="width: 100%; border-radius: 16px; padding: 15px 15px 15px 50px; font-size: 1.5rem; font-weight: 800; color: var(--primary); border: 1.5px solid #e2e8f0; outline: none;">
                                    <i data-lucide="lock" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); width: 22px; color: var(--primary);"></i>
                                </div>
                                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 12px; line-height: 1.4;">
                                    Los puntos no podrán ser usados hasta que el cliente alcance esta cifra.
                                </p>
                            </div>
                        </div>

                        <div style="background: white; border-radius: 28px; padding: 25px; border: 1px solid #f1f5f9; text-align: center;">
                            <img src="recursos/logo efimero.png" style="width: 40px; opacity: 0.2; filter: grayscale(1); margin-bottom: 15px;">
                            <p style="font-size: 0.8rem; color: #cbd5e1; margin: 0;">Aromatic Loyalty Engine v2.5<br>Sistema de Fidelización Inteligente</p>
                        </div>
                    </div>

                    <!-- Conversion Table -->
                    <div style="background: white; border-radius: 32px; padding: 40px; border: 1px solid #f1f5f9; box-shadow: 0 4px 25px rgba(0,0,0,0.02);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                            <div>
                                <h3 style="margin: 0; font-size: 1.5rem; font-family: 'Playfair Display', serif; color: var(--primary);">Valorización de Puntos</h3>
                                <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 5px;">Define cuánto vale cada punto según el nivel del cliente</p>
                            </div>
                            <button type="button" onclick="customersView.addConversionRow()" class="btn-add-row" style="background: #fdfaf6; color: var(--primary); border: 1px solid rgba(75, 54, 33, 0.1); padding: 10px 18px; border-radius: 12px; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.3s;">
                                <i data-lucide="plus" style="width: 16px;"></i> AÑADIR NIVEL
                            </button>
                        </div>

                        <div id="conversionTableContainer" style="display: flex; flex-direction: column; gap: 12px;">
                            <!-- Rows injected here -->
                        </div>

                        <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #f1f5f9; display: flex; gap: 15px;">
                            <button type="button" class="btn-secondary" onclick="customersView.switchSubView('list')" style="flex: 1; padding: 18px; border-radius: 18px; font-weight: 700; font-size: 1rem; border: 1px solid #e2e8f0; background: white; color: #64748b; cursor: pointer;">CANCELAR</button>
                            <button type="button" class="btn-primary" onclick="customersView.saveLoyaltySettings()" style="flex: 2; padding: 18px; border-radius: 18px; font-weight: 800; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 10px; border: none; background: var(--primary); color: white; cursor: pointer;">
                                <i data-lucide="check-circle" style="width: 22px;"></i> GUARDAR CAMBIOS
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    switchSubView(view) {
        this.activeSubView = view;
        this.refreshGrid();
    },

    bindEvents(app) {
        const addBtn = document.getElementById('addCustomerBtn');
        const searchInput = document.getElementById('customerSearch');

        if (addBtn) {
            addBtn.onclick = () => this.showCustomerModal();
        }

        if (searchInput) {
            searchInput.oninput = (e) => {
                this.filterQuery = e.target.value;
                this.refreshGrid();
            };
        }

        if (this.activeSubView === 'loyalty') {
            this.bindLoyaltyEvents();
        }
    },

    bindLoyaltyEvents() {
        const toggle = document.getElementById('loyaltyMasterToggle');
        const puntosInput = document.getElementById('loyaltyPuntosXDinero');
        const dineroBaseInput = document.getElementById('loyaltyDineroBase');

        const updateHelp = () => {
            const points = parseInt(puntosInput.value) || 0;
            const base = parseInt(dineroBaseInput.value) || 1;
            const helpText = document.getElementById('earningHelp');
            if (helpText) {
                helpText.innerHTML = `<strong>Resumen:</strong> El cliente recibirá <strong style="color: var(--accent);">${points}</strong> puntos por cada <strong style="color: #15803d;">$${base}</strong> gastados.`;
            }
        };

        if (toggle) {
            toggle.onchange = async (e) => {
                const settings = db.getSettings();
                settings.fidelizacion.activo = e.target.checked;
                db.saveSettings(settings);
                await db.logAction('config', e.target.checked ? 'activar_lealtad' : 'desactivar_lealtad', 'Cambio en programa de fidelización');
                this.refreshGrid();
            };
        }

        if (puntosInput) puntosInput.oninput = updateHelp;
        if (dineroBaseInput) dineroBaseInput.oninput = updateHelp;

        this.renderConversionTable();
    },

    renderConversionTable() {
        const settings = db.getSettings();
        const container = document.getElementById('conversionTableContainer');
        if (!container) return;

        const conversions = settings.fidelizacion.conversiones || [
            { puntos: 1, valor: settings.fidelizacion.valorPunto || 0.5 }
        ];

        container.innerHTML = conversions.map((conv, idx) => `
            <div class="conversion-row" style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 15px; align-items: center; background: #f8fafc; padding: 20px; border-radius: 20px; border: 1px solid transparent; transition: all 0.3s;">
                <div class="input-group" style="margin: 0;">
                    <label style="font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; display: block;">Desde (Nivel Puntos)</label>
                    <div style="position: relative;">
                        <input type="number" class="puntos-input" value="${conv.puntos}" min="0" style="width: 100%; padding: 12px 12px 12px 40px; border-radius: 12px; font-weight: 700; border: 1.5px solid #e2e8f0; outline: none;">
                        <i data-lucide="hash" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; color: #94a3b8;"></i>
                    </div>
                </div>
                <div class="input-group" style="margin: 0;">
                    <label style="font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; display: block;">Valor de cada punto</label>
                    <div style="position: relative;">
                        <input type="number" class="valor-input" value="${conv.valor}" step="0.01" min="0" style="width: 100%; padding: 12px 12px 12px 40px; border-radius: 12px; font-weight: 800; color: #15803d; border: 1.5px solid #e2e8f0; outline: none;">
                        <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-weight: 800; color: #15803d; font-size: 1.1rem;">$</span>
                    </div>
                </div>
                <div>
                    ${conversions.length > 1 ? `
                        <button type="button" class="btn-icon-small danger" onclick="customersView.removeConversionRow(${idx})" style="width: 44px; height: 44px; border-radius: 12px; border: none; background: #fee2e2; color: #dc2626; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                            <i data-lucide="trash-2" style="width: 20px;"></i>
                        </button>
                    ` : '<div style="width: 44px;"></div>'}
                </div>
            </div>
        `).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    addConversionRow() {
        const settings = db.getSettings();
        if (!settings.fidelizacion.conversiones) {
            settings.fidelizacion.conversiones = [{ puntos: 1, valor: settings.fidelizacion.valorPunto || 0.5 }];
        }

        const last = settings.fidelizacion.conversiones[settings.fidelizacion.conversiones.length - 1];
        settings.fidelizacion.conversiones.push({
            puntos: (last?.puntos || 0) + 100,
            valor: (last?.valor || 0.5) + 0.1
        });

        db.saveSettings(settings);
        this.renderConversionTable();
        if (typeof audioService !== 'undefined') audioService.playPop();
    },

    removeConversionRow(idx) {
        const settings = db.getSettings();
        if (!settings.fidelizacion.conversiones) return;
        settings.fidelizacion.conversiones.splice(idx, 1);
        db.saveSettings(settings);
        this.renderConversionTable();
    },

    async saveLoyaltySettings() {
        const settings = db.getSettings();
        const conversions = [];

        document.querySelectorAll('#conversionTableContainer .conversion-row').forEach(row => {
            const puntos = parseInt(row.querySelector('.puntos-input').value) || 0;
            const valor = parseFloat(row.querySelector('.valor-input').value) || 0;
            conversions.push({ puntos, valor });
        });

        conversions.sort((a, b) => a.puntos - b.puntos);

        settings.fidelizacion = {
            ...settings.fidelizacion,
            puntosPorDinero: parseInt(document.getElementById('loyaltyPuntosXDinero').value) || 1,
            dineroBase: parseInt(document.getElementById('loyaltyDineroBase').value) || 10,
            puntosParaCanje: parseInt(document.getElementById('loyaltyMinimo').value) || 0,
            conversiones: conversions,
            valorPunto: conversions.length > 0 ? conversions[0].valor : (settings.fidelizacion.valorPunto || 0.5)
        };

        db.saveSettings(settings);
        await db.logAction('config', 'actualizar_lealtad', 'Reglas actualizadas');

        if (typeof app !== 'undefined') app.showToast('Configuración guardada satisfactoriamente', 'success');
        if (typeof audioService !== 'undefined') audioService.playSuccess();
        this.switchSubView('list');
    },

    async refreshGrid() {
        const container = document.getElementById('view-container');
        const activeView = document.querySelector('.nav-links li.active')?.getAttribute('data-view');
        if (activeView === 'customers') {
            const html = await this.render();
            container.innerHTML = `<div class="view-enter">${html}</div>`;
            container.scrollTop = 0;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            this.bindEvents();
        }
    },

    showCustomerModal(customer = null) {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        modalContent.innerHTML = `
            <div style="width: 450px; padding: 10px;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 30px;">
                    <div style="width: 50px; height: 50px; background: rgba(75, 54, 33, 0.1); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
                        <i data-lucide="${customer ? 'user-cog' : 'user-plus'}" style="width: 28px; height: 28px;"></i>
                    </div>
                    <h2 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 1.8rem; color: var(--primary);">
                        ${customer ? 'Editar Cliente' : 'Nuevo Cliente'}
                    </h2>
                </div>

                <form id="customerForm" style="display: flex; flex-direction: column; gap: 20px;">
                    <div class="input-group">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="user" style="width: 14px; color: var(--text-muted);"></i> Nombre Completo
                        </label>
                        <input type="text" id="custNombre" value="${customer ? customer.nombre : ''}" required placeholder="Ej: Juan Pérez" class="large-input" style="font-size: 1.1rem; padding: 14px 18px;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="input-group">
                            <label style="display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="phone" style="width: 14px; color: var(--text-muted);"></i> Teléfono
                            </label>
                            <input type="tel" id="custTelefono" value="${customer ? customer.telefono || '' : ''}" placeholder="10 dígitos" class="large-input" style="font-size: 1.1rem; padding: 14px 18px;">
                        </div>
                        <div class="input-group">
                            <label style="display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="award" style="width: 14px; color: var(--accent);"></i> Puntos
                            </label>
                            <input type="number" id="custPuntos" value="${customer ? customer.puntos || 0 : 0}" step="1" class="large-input" style="font-size: 1.1rem; padding: 14px 18px; color: var(--accent);">
                        </div>
                    </div>

                    <div class="input-group">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="mail" style="width: 14px; color: var(--text-muted);"></i> Email (Opcional)
                        </label>
                        <input type="email" id="custEmail" value="${customer ? customer.email || '' : ''}" placeholder="correo@ejemplo.com" class="large-input" style="font-size: 1rem; padding: 14px 18px;">
                    </div>

                    <div style="display: flex; gap: 12px; margin-top: 15px; padding-top: 20px; border-top: 1px solid #eee;">
                        <button type="button" class="btn-secondary" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="flex: 1; padding: 16px; border-radius: 14px; border-color: #eee; color: #999;">
                            Cancelar
                        </button>
                        <button type="submit" class="btn-primary" style="flex: 2; padding: 16px; border-radius: 14px; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 700;">
                            <i data-lucide="check-circle" style="width: 20px;"></i>
                            ${customer ? 'Guardar Cambios' : 'Registrar Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        modal.classList.remove('hidden');
        audioService.playPop();

        document.getElementById('customerForm').onsubmit = async (e) => {
            e.preventDefault();
            const data = {
                nombre: document.getElementById('custNombre').value,
                telefono: document.getElementById('custTelefono').value,
                email: document.getElementById('custEmail').value,
                puntos: parseInt(document.getElementById('custPuntos').value) || 0
            };

            if (customer) {
                await db.updateDocument('clientes', customer.id, data);
            } else {
                await db.addDocument('clientes', data);
            }

            modal.classList.add('hidden');
            this.refreshGrid();
        };
    },

    calculateTotalValue(puntos, settings) {
        if (!puntos) return 0;
        const loyalty = settings.fidelizacion;
        const conversions = loyalty.conversiones || [];

        if (conversions.length === 0) return puntos * (loyalty.valorPunto || 0);

        // Find the applicable tier (the one with the most points that is <= current points)
        // Sort DESC to find the first one that fits
        const sorted = [...conversions].sort((a, b) => b.puntos - a.puntos);
        const tier = sorted.find(t => puntos >= t.puntos);

        const rate = tier ? tier.valor : (loyalty.valorPunto || 0);
        return puntos * rate;
    },

    async editCustomer(id) {
        const customer = this.customers.find(c => c.id === id);
        if (customer) this.showCustomerModal(customer);
    },

    async deleteCustomer(id) {
        const customer = this.customers.find(c => c.id === id);
        if (!customer) return;

        const confirmed = await app.showConfirmModal({
            title: 'Eliminar Cliente',
            message: `¿Estás seguro de eliminar a <strong>${customer.nombre}</strong>? Esta acción borrará permanentemente sus <strong>${customer.puntos || 0} puntos</strong> acumulados.`,
            confirmText: 'Sí, Eliminar',
            cancelText: 'Cancelar',
            type: 'danger',
            icon: 'user-minus'
        });

        if (confirmed) {
            await db.deleteDocument('clientes', id);
            await db.logAction('clientes', 'eliminar_cliente', `Cliente: "${customer.nombre}"`);
            app.showToast('Cliente eliminado correctamente', 'success');
            this.refreshGrid();
        }
    }
};
