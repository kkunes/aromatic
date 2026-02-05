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

        if (this.activeSubView === 'tiers') {
            return this.renderTiersConfig(settings);
        }

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
                        <button class="btn-secondary" onclick="customersView.switchSubView('tiers')" style="padding: 14px 28px; border-radius: 16px; font-weight: 700; font-size: 1rem; display: flex; align-items: center; gap: 10px; transition: all 0.3s; border: 2px solid var(--accent); color: var(--accent);">
                            <i data-lucide="award" style="width: 20px;"></i> CONFIGURAR NIVELES
                        </button>
                        <button class="btn-secondary" onclick="customersView.switchSubView('loyalty')" style="padding: 14px 28px; border-radius: 16px; font-weight: 700; font-size: 1rem; display: flex; align-items: center; gap: 10px; transition: all 0.3s; border: 2px solid var(--primary); color: var(--primary);">
                            <i data-lucide="settings" style="width: 20px;"></i> REGLAS GENERALES
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
                            <input type="text" id="customerSearch" placeholder="Buscar por nombre o teléfono..." value="${this.filterQuery}" 
                                   style="background: transparent; height: 50px; font-size: 1rem; width: 100%; border: none; outline: none; font-family: 'Outfit', sans-serif;">
                        </div>
                   </div>
                </div>

                <div id="customers-list-container">
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
                                            ${this.renderTierBadge(c, loyalty)}
                                            ${this.getExpirationStatusHTML(c, loyalty)}
                                        </div>
                                    </div>

                                    ${this.renderTierProgress(c, loyalty)}
                                    
                                    <div class="cust-card-footer">
                                        <div class="cust-monetary-val">
                                            <div class="lbl">Saldos Disponibles</div>
                                            <div class="val">$${(this.calculateTotalValue(c.puntos || 0, settings)).toFixed(2)} <span style="font-size: 0.75rem; letter-spacing: 0;">MXN</span></div>
                                            <div style="font-size: 0.65rem; color: #94a3b8; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                                <i data-lucide="calendar" style="width: 10px; height: 10px; display: inline-block; vertical-align: middle;"></i>
                                                Desde: ${c.fechaRegistro ? new Date(c.fechaRegistro).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }) : 'Antiguo'}
                                            </div>
                                        </div>
                                        <div class="cust-actions">
                                            <button class="btn-action-premium levels" onclick="customersView.showBenefitsHistory('${c.id}')" title="Historial de Beneficios">
                                                <i data-lucide="history"></i>
                                            </button>
                                            <button class="btn-action-premium whatsapp" onclick="customersView.sendWhatsAppPromo('${c.id}')" title="Enviar Promoción">
                                                <i data-lucide="message-circle"></i>
                                            </button>
                                            <button class="btn-action-premium edit" onclick="customersView.editCustomer('${c.id}')" title="Editar Perfil">
                                                <i data-lucide="settings-2"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
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
                
                .btn-action-premium:hover.whatsapp {
                    background: #f0fdf4;
                    color: #22c55e;
                    border-color: #22c55e30;
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
                                </div>

                                <div class="input-group" style="margin-top: 25px;">
                                    <label style="font-weight: 700; font-size: 0.85rem; color: #94a3b8; text-transform: uppercase;">Modo de Vencimiento de Puntos</label>
                                    <select id="loyaltyTipoVencimiento" class="premium-input" style="width: 100%; border-radius: 16px; padding: 15px; font-size: 1rem; font-weight: 700; color: var(--primary); border: 1.5px solid #e2e8f0; outline: none; margin-top: 10px; cursor: pointer;">
                                        <option value="inactividad" ${loyalty.tipoVencimiento === 'inactividad' ? 'selected' : ''}>Por Inactividad (Se pierden todos)</option>
                                        <option value="transaccion" ${loyalty.tipoVencimiento === 'transaccion' ? 'selected' : ''}>Por Vigencia Individual (Lotes)</option>
                                    </select>
                                </div>

                                <div id="vencimientoInactividadGroup" class="${loyalty.tipoVencimiento === 'transaccion' ? 'hidden' : ''}" style="margin-top: 25px;">
                                    <label style="font-weight: 700; font-size: 0.85rem; color: #94a3b8; text-transform: uppercase;">Periodo de Gracia (Meses)</label>
                                    <div style="position: relative; margin-top: 10px;">
                                        <input type="number" id="loyaltyVencimiento" value="${loyalty.vencimientoMeses || 12}" min="1" class="premium-input" style="width: 100%; border-radius: 16px; padding: 15px 15px 15px 50px; font-size: 1.5rem; font-weight: 800; color: #ef4444; border: 1.5px solid #e2e8f0; outline: none;">
                                        <i data-lucide="calendar-off" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); width: 22px; color: #ef4444;"></i>
                                    </div>
                                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 12px; line-height: 1.4;">
                                        Los puntos se reinician a 0 si el cliente no registra compras en este periodo.
                                    </p>
                                </div>

                                <div id="vencimientoTransaccionGroup" class="${loyalty.tipoVencimiento === 'transaccion' ? '' : 'hidden'}" style="margin-top: 25px;">
                                    <label style="font-weight: 700; font-size: 0.85rem; color: #94a3b8; text-transform: uppercase;">Vida de cada punto (Meses)</label>
                                    <div style="position: relative; margin-top: 10px;">
                                        <input type="number" id="loyaltyVigenciaPuntos" value="${loyalty.vigenciaPuntosMeses || 6}" min="1" class="premium-input" style="width: 100%; border-radius: 16px; padding: 15px 15px 15px 50px; font-size: 1.5rem; font-weight: 800; color: #eab308; border: 1.5px solid #e2e8f0; outline: none;">
                                        <i data-lucide="hourglass" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); width: 22px; color: #eab308;"></i>
                                    </div>
                                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 12px; line-height: 1.4;">
                                        Cada carga de puntos expira de forma independiente después del tiempo seleccionado.
                                    </p>
                                </div>
                        </div>

                        <div style="background: white; border-radius: 28px; padding: 25px; border: 1px solid #f1f5f9; text-align: center;">
                            <img src="recursos/logo efimero.png" style="width: 40px; opacity: 0.2; filter: grayscale(1); margin-bottom: 15px;">
                            <p style="font-size: 0.8rem; color: #cbd5e1; margin: 0;">Loyalty Engine v2.5<br>Sistema de Fidelización Inteligente</p>
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
        this.app = app;
        const addBtn = document.getElementById('addCustomerBtn');
        const searchInput = document.getElementById('customerSearch');

        if (addBtn) {
            addBtn.onclick = () => this.showCustomerModal();
        }

        if (searchInput) {
            const debouncedRefresh = this.app.debounce(() => this.refreshGrid(), 300);
            searchInput.oninput = (e) => {
                this.filterQuery = e.target.value;
                debouncedRefresh();
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

        const tipoSelect = document.getElementById('loyaltyTipoVencimiento');
        if (tipoSelect) {
            tipoSelect.onchange = (e) => {
                const isTrans = e.target.value === 'transaccion';
                document.getElementById('vencimientoInactividadGroup').classList.toggle('hidden', isTrans);
                document.getElementById('vencimientoTransaccionGroup').classList.toggle('hidden', !isTrans);
            };
        }

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
            vencimientoMeses: parseInt(document.getElementById('loyaltyVencimiento').value) || 12,
            tipoVencimiento: document.getElementById('loyaltyTipoVencimiento').value,
            vigenciaPuntosMeses: parseInt(document.getElementById('loyaltyVigenciaPuntos').value) || 6,
            conversiones: conversions,
            valorPunto: conversions.length > 0 ? conversions[0].valor : (settings.fidelizacion.valorPunto || 0.5)
        };

        db.saveSettings(settings);
        await db.logAction('config', 'actualizar_lealtad', 'Reglas actualizadas');

        if (typeof app !== 'undefined') app.showToast('Configuración guardada satisfactoriamente', 'success');
        if (typeof audioService !== 'undefined') audioService.playSuccess();
        this.switchSubView('list');
    },

    filter(query) {
        this.filterQuery = query;
        this.refreshGrid();
    },

    async refreshGrid() {
        const resultsContainer = document.getElementById('customers-list-container');

        // Solo usamos actualización parcial si estamos en la subvista de lista y el contenedor existe
        if (resultsContainer && this.activeSubView === 'list') {
            this.customers = await db.getCollection('clientes');
            const settings = db.getSettings();
            await this.checkExpirations(settings);

            const filtered = this.customers.filter(c =>
                c.nombre.toLowerCase().includes(this.filterQuery.toLowerCase()) ||
                (c.telefono && c.telefono.includes(this.filterQuery))
            );

            resultsContainer.innerHTML = `
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
                                        ${this.getExpirationStatusHTML(c, settings.fidelizacion)}
                                    </div>
                                </div>
                                
                                <div class="cust-card-footer">
                                    <div class="cust-monetary-val">
                                        <div class="lbl">Saldos Disponibles</div>
                                        <div class="val">$${(this.calculateTotalValue(c.puntos || 0, settings)).toFixed(2)} <span style="font-size: 0.75rem; letter-spacing: 0;">MXN</span></div>
                                        <div style="font-size: 0.65rem; color: #94a3b8; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                            <i data-lucide="calendar" style="width: 10px; height: 10px; display: inline-block; vertical-align: middle;"></i>
                                            Desde: ${c.fechaRegistro ? new Date(c.fechaRegistro).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }) : 'Antiguo'}
                                        </div>
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
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            // Recarga completa para cambios de subvista o si el contenedor no existe
            const container = document.getElementById('view-container');
            if (this.app && this.app.currentView === 'customers') {
                const html = await this.render();
                container.innerHTML = `<div class="view-enter">${html}</div>`;
                container.scrollTop = 0;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                this.bindEvents(this.app);
            }
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
                    ${customer && customer.fechaRegistro ? `
                        <div style="margin-left: auto; font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; background: #f8fafc; padding: 4px 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                            Registrado: ${new Date(customer.fechaRegistro).toLocaleDateString()}
                        </div>
                    ` : ''}
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
                data.fechaRegistro = new Date().toISOString();
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

        let baseRate = loyalty.valorPunto || 0;

        if (conversions.length > 0) {
            const sortedConv = [...conversions].sort((a, b) => b.puntos - a.puntos);
            const conversionRule = sortedConv.find(t => puntos >= t.puntos);
            if (conversionRule) baseRate = conversionRule.valor;
        }

        // Apply Tier Multiplier
        const tier = this.getCurrentTier(puntos, loyalty);
        const multiplier = tier ? (tier.multiplicadorValor || 1) : 1;

        return puntos * baseRate * multiplier;
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
    },

    async checkExpirations(settings) {
        if (!settings.fidelizacion.activo) return;

        const loyalty = settings.fidelizacion;
        const now = new Date();
        let changed = false;

        for (const customer of this.customers) {
            if ((customer.puntos || 0) <= 0) continue;

            if (loyalty.tipoVencimiento === 'transaccion') {
                // EXPIRE INDIVIDUAL BATCHES
                if (!customer.puntosLotes || customer.puntosLotes.length === 0) continue;

                const activeLotes = customer.puntosLotes.filter(lote => {
                    const expiryDate = new Date(lote.expira);
                    return expiryDate > now;
                });

                if (activeLotes.length !== customer.puntosLotes.length) {
                    const newTotal = activeLotes.reduce((sum, l) => sum + l.puntos, 0);
                    const lostPoints = (customer.puntos || 0) - newTotal;

                    await db.updateDocument('clientes', customer.id, {
                        puntos: Math.max(0, newTotal),
                        puntosLotes: activeLotes
                    });

                    if (lostPoints > 0) {
                        await db.logAction('clientes', 'expiracion_lotes', `Vencieron ${lostPoints} puntos de ${customer.nombre}`);
                    }
                    changed = true;
                }
            } else {
                // EXPIRE BY INACTIVITY (Original logic)
                if (!loyalty.vencimientoMeses) continue;

                const lastActivity = customer.ultimaActividad ? new Date(customer.ultimaActividad) : new Date(customer.createdAt || now);
                const diffMonths = (now.getFullYear() - lastActivity.getFullYear()) * 12 + (now.getMonth() - lastActivity.getMonth());

                if (diffMonths >= loyalty.vencimientoMeses) {
                    await db.updateDocument('clientes', customer.id, {
                        puntos: 0,
                        puntosLotes: [],
                        ultimaActividad: now.toISOString(),
                        puntosExpirados: true
                    });
                    await db.logAction('clientes', 'expiracion_inactividad', `Puntos reseteados por inactividad: ${customer.nombre}`);
                    changed = true;
                }
            }
        }

        if (changed) {
            this.customers = await db.getCollection('clientes');
        }
    },

    getExpirationStatusHTML(customer, loyalty) {
        if ((customer.puntos || 0) <= 0) return '';
        const now = new Date();

        if (loyalty.tipoVencimiento === 'transaccion') {
            if (!customer.puntosLotes || customer.puntosLotes.length === 0) return '';

            // Check if any bucket expires in less than 30 days
            const soonToExpire = customer.puntosLotes.some(lote => {
                const diffDays = (new Date(lote.expira) - now) / (1000 * 60 * 60 * 24);
                return diffDays > 0 && diffDays <= 30;
            });

            if (soonToExpire) {
                return `
                    <div style="margin-top: 4px; display: flex; align-items: center; gap: 4px; color: #eab308; font-size: 0.65rem; font-weight: 700;">
                        <i data-lucide="hourglass" style="width: 10px; height: 10px;"></i>
                        LOTE POR VENCER
                    </div>
                `;
            }
        } else {
            if (!loyalty.vencimientoMeses) return '';
            const lastActivity = customer.ultimaActividad ? new Date(customer.ultimaActividad) : new Date(customer.createdAt || now);
            const diffMonths = (now.getFullYear() - lastActivity.getFullYear()) * 12 + (now.getMonth() - lastActivity.getMonth());
            const monthsLeft = loyalty.vencimientoMeses - diffMonths;

            if (monthsLeft <= 1) {
                return `
                    <div style="margin-top: 4px; display: flex; align-items: center; gap: 4px; color: #ef4444; font-size: 0.65rem; font-weight: 700;">
                        <i data-lucide="alert-triangle" style="width: 10px; height: 10px;"></i>
                        VENCE PRONTO
                    </div>
                `;
            }
        }
        return '';
    },

    async sendWhatsAppPromo(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer || !customer.telefono) {
            return app.showToast('El cliente no tiene un teléfono válido registrado', 'error');
        }

        // 1. Análisis de favoritos
        const ventas = await db.getCollection('ventas');
        const customerSales = ventas.filter(v => v.cliente?.id === customerId);

        const counts = {};
        customerSales.forEach(v => {
            v.items.forEach(item => {
                const key = item.categoria || 'General';
                counts[key] = (counts[key] || 0) + 1;
            });
        });

        const sortedFavs = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const favoriteCat = sortedFavs.length > 0 ? sortedFavs[0][0] : 'nuestras delicias';

        // 2. Buscar promociones activas
        const promos = await db.getCollection('promociones');
        const activePromos = promos.filter(p => p.activo);

        // Seleccionar una promo sugerida
        let selectedPromo = activePromos.find(p => p.aplicaA === 'categorias' && p.itemsIds.includes(favoriteCat));
        if (!selectedPromo) selectedPromo = activePromos[0] || { nombre: 'Promoción Especial', descripcion: 'Descuentos exclusivos' };

        // 3. Mostrar el Modal Avanzado
        const settings = db.getSettings();
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        const initialMsg = `¡Hola ${customer.nombre.split(' ')[0]}! 👋✨\n\nNotamos que te encanta nuestra sección de *${favoriteCat}*, por eso hoy tenemos una sorpresa para ti:\n\n🔥 *${selectedPromo.nombre}*\n\n¡Te esperamos en *${settings.negocio.nombre}* para consentirte! ☕🥐`;

        modalContent.innerHTML = `
            <div class="marketing-hub fade-in" style="width: 800px; display: flex; flex-direction: column; gap: 25px;">
                <!-- Header -->
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="width: 50px; height: 50px; background: #22c55e15; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #22c55e;">
                            <i data-lucide="message-circle" style="width: 28px;"></i>
                        </div>
                        <div>
                            <h2 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 1.8rem; color: var(--primary);">Campaña WhatsApp</h2>
                            <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">Enviando a: <strong>${customer.nombre}</strong> (${customer.telefono})</p>
                        </div>
                    </div>
                    <button class="btn-clear" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="color: #94a3b8;"><i data-lucide="x"></i></button>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                    <!-- Panel Izquierdo: Editor -->
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        <div class="input-group">
                            <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--primary); margin-bottom: 10px;">
                                <i data-lucide="align-left" style="width: 16px;"></i> CONTENIDO DEL MENSAJE
                            </label>
                            <textarea id="promoMsgContent" style="width: 100%; height: 200px; border-radius: 18px; border: 2px solid #e2e8f0; padding: 15px; font-family: 'Outfit', sans-serif; font-size: 1rem; resize: none; transition: all 0.3s;" oninput="customersView.syncWhatsAppPreview()">${initialMsg}</textarea>
                        </div>

                        <div class="input-group">
                            <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--primary); margin-bottom: 10px;">
                                <i data-lucide="image" style="width: 16px;"></i> ADJUNTAR IMAGEN (OPCIONAL)
                            </label>
                            <div style="display: flex; gap: 10px;">
                                <input type="file" id="promoMsgImage" accept="image/*" style="display: none;" onchange="customersView.handlePromoImageUpload(this)">
                                <button class="btn-secondary" onclick="document.getElementById('promoMsgImage').click()" style="width: 100%; height: 50px; border-radius: 14px; display: flex; align-items: center; justify-content: center; gap: 10px; border: 2px dashed #cbd5e1; background: #f8fafc;">
                                    <i data-lucide="upload-cloud"></i> CARGAR IMAGEN
                                </button>
                                <button id="removePromoImg" class="btn-secondary danger hidden" onclick="customersView.removePromoImage()" style="width: 50px; padding:0; height: 50px; border-radius: 14px;">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Panel Derecho: Vista Previa -->
                    <div style="background: #e5ddd5; border-radius: 24px; padding: 25px; position: relative; border: 6px solid #2d231a; box-shadow: 0 20px 50px rgba(0,0,0,0.15);">
                        <div style="background: rgba(255,255,255,0.9); border-radius: 0 12px 12px 12px; padding: 15px; position: relative;">
                            <div id="previewImgContainer" class="hidden" style="margin-bottom: 10px; border-radius: 8px; overflow: hidden; max-height: 200px;">
                                <img id="previewImg" src="" style="width: 100%; object-fit: cover;">
                            </div>
                            <div id="previewText" style="white-space: pre-wrap; font-size: 0.95rem; color: #333; line-height: 1.4;">${initialMsg}</div>
                            <div style="text-align: right; margin-top: 5px; font-size: 0.7rem; color: #999;">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓</div>
                        </div>
                        <div style="margin-top: 20px; text-align: center; color: rgba(0,0,0,0.3); font-size: 0.75rem; font-weight: 700;">VISTA PREVIA DE WHATSAPP</div>
                    </div>
                </div>

                <!-- Footer Acciones -->
                <div style="display: flex; gap: 15px; border-top: 1px solid #f1f5f9; padding-top: 25px;">
                    <button class="btn-secondary" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="flex: 1; height: 55px; border-radius: 16px;">CANCELAR</button>
                    <button id="sendWhatsAppFinal" class="btn-primary" onclick="customersView.confirmAndSendWhatsApp('${customer.id}')" style="flex: 2; height: 55px; border-radius: 16px; background: #22c55e; border: none; font-size: 1.1rem; gap: 10px;">
                        <i data-lucide="send"></i> ENVIAR AHORA
                    </button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();
        this.currentPromoImage = null;
    },

    syncWhatsAppPreview() {
        const content = document.getElementById('promoMsgContent').value;
        const previewText = document.getElementById('previewText');
        if (previewText) {
            // Reemplazar * * por negritas visuales
            previewText.innerHTML = content.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
        }
    },

    handlePromoImageUpload(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                this.currentPromoImage = e.target.result;
                const previewImg = document.getElementById('previewImg');
                const container = document.getElementById('previewImgContainer');
                const removeBtn = document.getElementById('removePromoImg');

                if (previewImg) {
                    previewImg.src = this.currentPromoImage;
                    container.classList.remove('hidden');
                    removeBtn.classList.remove('hidden');
                }
            };
            reader.readAsDataURL(input.files[0]);
        }
    },

    removePromoImage() {
        this.currentPromoImage = null;
        document.getElementById('previewImgContainer').classList.add('hidden');
        document.getElementById('removePromoImg').classList.add('hidden');
        document.getElementById('promoMsgImage').value = '';
    },

    async confirmAndSendWhatsApp(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        const content = document.getElementById('promoMsgContent').value;
        const btn = document.getElementById('sendWhatsAppFinal');

        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span>...';

        try {
            if (this.currentPromoImage) {
                app.showToast('Copiando imagen al portapapeles...', 'info');

                try {
                    // La API de Portapapeles usualmente solo acepta PNG
                    const img = new Image();
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = this.currentPromoImage;
                    });

                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

                    if (blob) {
                        const item = new ClipboardItem({ 'image/png': blob });
                        await navigator.clipboard.write([item]);
                        app.showToast('📷 ¡Imagen copiada! Solo presiona Pegar (Ctrl+V) en WhatsApp', 'success', 6000);
                    }
                } catch (clipErr) {
                    console.error('Clipboard error:', clipErr);
                    app.showToast('No se pudo copiar la imagen automáticamente. Intenta solo con texto.', 'warning');
                }
            }

            const encodedMsg = encodeURIComponent(content);
            const phone = customer.telefono.replace(/\D/g, '');

            // Pequeña pausa para asegurar el copiado antes de abrir la ventana
            setTimeout(() => {
                window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
                document.getElementById('modalContainer').classList.add('hidden');
                db.logAction('marketing', 'whatsapp_promo_clipboard', `Promo enviada a ${customer.nombre}${this.currentPromoImage ? ' (Imagen en portapapeles)' : ''}`);
            }, 800);

        } catch (err) {
            console.error('WhatsApp flow error:', err);
            app.showToast('Error al procesar el envío', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="send"></i> REINTENTAR';
        }
    },

    // --- NEW TIER LOGIC ---

    getCurrentTier(puntos, loyalty) {
        if (!loyalty.niveles) return null;
        const sorted = [...loyalty.niveles].sort((a, b) => b.minPuntos - a.minPuntos);
        return sorted.find(n => puntos >= n.minPuntos) || sorted[sorted.length - 1];
    },

    getNextTier(puntos, loyalty) {
        if (!loyalty.niveles) return null;
        const sorted = [...loyalty.niveles].sort((a, b) => a.minPuntos - b.minPuntos);
        return sorted.find(n => n.minPuntos > puntos);
    },

    renderTierBadge(customer, loyalty) {
        const tier = this.getCurrentTier(customer.puntos || 0, loyalty);
        if (!tier) return '';
        return `
            <div style="margin-top: 5px; font-size: 0.65rem; font-weight: 800; color: ${tier.color}; text-transform: uppercase; letter-spacing: 1px; background: ${tier.color}15; padding: 2px 6px; border-radius: 6px; border: 1px solid ${tier.color}30;">
                ${tier.nombre}
            </div>
        `;
    },

    renderTierProgress(customer, loyalty) {
        const puntos = customer.puntos || 0;
        const tier = this.getCurrentTier(puntos, loyalty);
        const next = this.getNextTier(puntos, loyalty);

        if (!next) return `<div style="font-size: 0.7rem; color: #22c55e; font-weight: 700; text-align: center; margin: 5px 0;">¡NIVEL MÁXIMO ALCANZADO! ✨</div>`;

        const needed = next.minPuntos - puntos;
        const totalRange = next.minPuntos - tier.minPuntos;
        const progress = Math.min(100, ((puntos - tier.minPuntos) / totalRange) * 100);

        return `
            <div class="tier-progress-container" style="margin: 10px 0;">
                <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-bottom: 4px;">
                    <span>Progreso a ${next.nombre}</span>
                    <span>${puntos} / ${next.minPuntos}</span>
                </div>
                <div style="width: 100%; height: 6px; background: #f1f5f9; border-radius: 10px; overflow: hidden;">
                    <div style="width: ${progress}%; height: 100%; background: linear-gradient(to right, ${tier.color}, ${next.color}); border-radius: 10px; transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);"></div>
                </div>
                <div style="font-size: 0.6rem; color: var(--text-muted); margin-top: 4px; text-align: center;">Faltan <strong>${needed} puntos</strong> para subir de nivel</div>
            </div>
        `;
    },

    renderTiersConfig(settings) {
        const loyalty = settings.fidelizacion;
        return `
            <div class="loyalty-config-view fade-in" style="max-width: 1000px; margin: 0 auto; padding-bottom: 60px;">
                <div class="view-header" style="margin-bottom: 40px; display: flex; align-items: center; justify-content: space-between;">
                    <button class="btn-icon-premium" onclick="customersView.switchSubView('list')" style="width: 50px; height: 50px; background: white; border: 1px solid #e2e8f0; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: var(--primary); cursor: pointer;">
                        <i data-lucide="arrow-left" style="width: 24px;"></i>
                    </button>
                    <div style="flex: 1; margin-left: 20px;">
                        <h1 style="font-family: 'Playfair Display', serif; font-size: 2.5rem; margin: 0; color: var(--primary);">Niveles de Lealtad</h1>
                        <p style="color: var(--text-muted); margin: 0;">Define recompensas exclusivas para tus mejores clientes</p>
                    </div>
                </div>

                <div style="display: grid; gap: 20px;">
                    ${loyalty.niveles.map((n, idx) => `
                        <div class="card" style="padding: 24px; border-radius: 20px; border: 1.5px solid ${n.color}40; background: white; display: grid; grid-template-columns: 80px 1fr 1fr 1fr 1fr auto; gap: 20px; align-items: center;">
                            <div style="width: 60px; height: 60px; background: ${n.color}; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 8px 16px ${n.color}40;">
                                <i data-lucide="award" style="width: 30px; height: 30px;"></i>
                            </div>
                            <div>
                                <label style="font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Nivel</label>
                                <input type="text" value="${n.nombre}" onchange="customersView.updateTierProp(${idx}, 'nombre', this.value)" style="width: 100%; border: none; font-weight: 700; font-size: 1.1rem; color: var(--primary); outline: none;">
                            </div>
                            <div>
                                <label style="font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Min. Puntos</label>
                                <input type="number" value="${n.minPuntos}" onchange="customersView.updateTierProp(${idx}, 'minPuntos', parseInt(this.value))" style="width: 100%; border: none; font-weight: 700; font-size: 1.1rem; color: var(--primary); outline: none;">
                            </div>
                            <div>
                                <label style="font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Mult. Puntos</label>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <input type="number" step="0.1" value="${n.multiplicadorPuntos}" onchange="customersView.updateTierProp(${idx}, 'multiplicadorPuntos', parseFloat(this.value))" style="width: 50px; border: none; font-weight: 700; font-size: 1.1rem; color: #15803d; outline: none;">
                                    <span style="font-weight: 700; color: #15803d;">x</span>
                                </div>
                            </div>
                            <div>
                                <label style="font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Mult. Valor</label>
                                <div style="display: flex; align-items: center; gap: 4px;">
                                    <input type="number" step="0.1" value="${n.multiplicadorValor}" onchange="customersView.updateTierProp(${idx}, 'multiplicadorValor', parseFloat(this.value))" style="width: 50px; border: none; font-weight: 700; font-size: 1.1rem; color: #4338ca; outline: none;">
                                    <span style="font-weight: 700; color: #4338ca;">x</span>
                                </div>
                            </div>
                            <div style="flex: 2;">
                                <label style="font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Beneficio Textual</label>
                                <input type="text" value="${n.beneficios}" onchange="customersView.updateTierProp(${idx}, 'beneficios', this.value)" style="width: 100%; border: none; font-weight: 500; font-size: 0.9rem; color: #64748b; outline: none;">
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div style="margin-top: 40px; text-align: center;">
                    <button class="btn-primary" onclick="customersView.saveTierSettings()" style="padding: 18px 40px; border-radius: 20px; font-weight: 800;">
                        GUARDAR CONFIGURACIÓN DE NIVELES
                    </button>
                </div>
            </div>
        `;
    },

    updateTierProp(idx, prop, val) {
        const settings = db.getSettings();
        settings.fidelizacion.niveles[idx][prop] = val;
        db.saveSettings(settings); // Immediate save of draft
    },

    async saveTierSettings() {
        app.showToast('Niveles actualizados correctamente', 'success');
        this.switchSubView('list');
    },

    async showBenefitsHistory(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        const history = await db.getCollection('beneficios_historial') || [];
        const clientHistory = history.filter(h => h.clienteId === customerId).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        modalContent.innerHTML = `
            <div style="width: 500px; padding: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h2 style="margin: 0; font-family: 'Playfair Display', serif;">Historial de Beneficios</h2>
                    <button class="btn-icon-small" onclick="document.getElementById('modalContainer').classList.add('hidden')"><i data-lucide="x"></i></button>
                </div>

                <div style="background: #fdfaf6; padding: 20px; border-radius: 16px; border: 1px solid #f9731630; margin-bottom: 24px; display: flex; align-items: center; gap: 15px;">
                    <div style="width: 48px; height: 48px; background: var(--primary); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 800;">
                        ${customer.nombre.charAt(0)}
                    </div>
                    <div>
                        <div style="font-weight: 700; color: var(--primary);">${customer.nombre}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${this.getCurrentTier(customer.puntos, db.getSettings().fidelizacion).nombre} • ${customer.puntos} puntos</div>
                    </div>
                </div>

                <div style="max-height: 400px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px;">
                    ${clientHistory.length === 0 ? `
                        <div style="text-align: center; padding: 40px; color: #94a3b8;">
                            <i data-lucide="package-open" style="width: 40px; height: 40px; margin-bottom: 10px;"></i>
                            <p>No hay beneficios registrados para este cliente.</p>
                        </div>
                    ` : clientHistory.map(h => `
                        <div style="background: white; border: 1.5px solid #f1f5f9; padding: 16px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-weight: 700; color: #1e293b;">${h.beneficio}</div>
                                <div style="font-size: 0.75rem; color: #94a3b8;">${new Date(h.fecha).toLocaleString()}</div>
                            </div>
                            <div style="font-size: 0.8rem; font-weight: 800; color: #15803d; background: #f0fdf4; padding: 4px 10px; border-radius: 8px;">ENTREGADO</div>
                        </div>
                    `).join('')}
                </div>

                <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9; display: flex; flex-direction: column; gap: 12px;">
                    <h4 style="margin: 0; font-size: 0.9rem; color: var(--primary);">Registrar Nuevo Beneficio</h4>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="newBenefitName" placeholder="Ej: Café de cortesía nivel Oro" class="large-input" style="flex: 1; font-size: 0.9rem; padding: 12px;">
                        <button class="btn-primary" onclick="customersView.confirmBenefitUsage('${customerId}')" style="padding: 0 20px;">
                            REGISTRAR
                        </button>
                    </div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        modal.classList.remove('hidden');
    },

    async confirmBenefitUsage(customerId) {
        const nameInput = document.getElementById('newBenefitName');
        const beneficio = nameInput.value.trim();
        if (!beneficio) return app.showToast('Escribe el nombre del beneficio', 'warning');

        await db.addDocument('beneficios_historial', {
            clienteId: customerId,
            beneficio,
            fecha: new Date().toISOString(),
            entregadoPor: db.getCurrentUser().nombre
        });

        app.showToast('Beneficio registrado correctamente', 'success');
        this.showBenefitsHistory(customerId); // Refresh history
    }
};
