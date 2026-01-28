const settingsView = {
    activeSubView: 'menu', // 'menu', 'profile', 'fiscal', 'ticket', 'loyalty', 'users'
    usuarios: [],

    async render() {
        const settings = db.getSettings();

        if (this.activeSubView === 'menu') {
            return this.renderMenu();
        } else if (this.activeSubView === 'profile') {
            return this.renderProfileForm(settings);
        } else if (this.activeSubView === 'fiscal') {
            return this.renderFiscalForm(settings);
        } else if (this.activeSubView === 'ticket') {
            return this.renderTicketForm(settings);
        } else if (this.activeSubView === 'loyalty') {
            return this.renderLoyaltyForm(settings);
        } else if (this.activeSubView === 'users') {
            return this.renderUsersSection();
        } else if (this.activeSubView === 'maintenance') {
            return this.renderMaintenanceSection();
        } else if (this.activeSubView === 'promotions') {
            return this.renderPromotionsSection();
        }
    },

    renderMenu() {
        return `
            <div class="settings-container fade-in">
                <div class="view-header">
                    <h1>Configuración del Sistema</h1>
                    <p style="color: var(--text-muted); margin-top: 4px;">Personalice la experiencia de su establecimiento</p>
                </div>

                <div class="settings-menu-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-top: 40px;">
                    
                    <button class="settings-nav-card" onclick="settingsView.switchSubView('profile')" style="border: none; background: white; padding: 32px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); cursor: pointer; transition: all 0.3s ease; text-align: left; display: flex; flex-direction: column; gap: 20px;">
                        <div style="width: 60px; height: 60px; background: rgba(75, 54, 33, 0.08); border-radius: 18px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
                            <i data-lucide="store" style="width: 30px; height: 30px;"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0 0 8px 0; font-size: 1.25rem;">Perfil del Negocio</h3>
                            <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem; line-height: 1.4;">Nombre, logotipo, dirección y datos de contacto.</p>
                        </div>
                        <div style="margin-top: auto; display: flex; align-items: center; gap: 8px; color: var(--primary); font-weight: 600; font-size: 0.9rem;">
                            Configurar <i data-lucide="chevron-right" style="width: 16px;"></i>
                        </div>
                    </button>

                    <button class="settings-nav-card" onclick="settingsView.switchSubView('promotions')" style="border: none; background: white; padding: 32px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); cursor: pointer; transition: all 0.3s ease; text-align: left; display: flex; flex-direction: column; gap: 20px;">
                        <div style="width: 60px; height: 60px; background: rgba(226, 150, 93, 0.1); border-radius: 18px; display: flex; align-items: center; justify-content: center; color: var(--accent);">
                            <i data-lucide="sparkles" style="width: 30px; height: 30px;"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0 0 8px 0; font-size: 1.25rem;">Promociones y reglas</h3>
                            <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem; line-height: 1.4;">Configura Happy Hours, 2x1 y descuentos automáticos.</p>
                        </div>
                        <div style="margin-top: auto; display: flex; align-items: center; gap: 8px; color: var(--accent); font-weight: 600; font-size: 0.9rem;">
                            Gestionar Reglas <i data-lucide="chevron-right" style="width: 16px;"></i>
                        </div>
                    </button>

                    <button class="settings-nav-card" onclick="settingsView.switchSubView('fiscal')" style="border: none; background: white; padding: 32px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); cursor: pointer; transition: all 0.3s ease; text-align: left; display: flex; flex-direction: column; gap: 20px;">
                        <div style="width: 60px; height: 60px; background: rgba(34, 197, 94, 0.08); border-radius: 18px; display: flex; align-items: center; justify-content: center; color: #22c55e;">
                            <i data-lucide="percent" style="width: 30px; height: 30px;"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0 0 8px 0; font-size: 1.25rem;">Configuración Fiscal</h3>
                            <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem; line-height: 1.4;">Gestión de IVA, tasas impositivas y RFC.</p>
                        </div>
                        <div style="margin-top: auto; display: flex; align-items: center; gap: 8px; color: #22c55e; font-weight: 600; font-size: 0.9rem;">
                            Configurar <i data-lucide="chevron-right" style="width: 16px;"></i>
                        </div>
                    </button>

                    <button class="settings-nav-card" onclick="settingsView.testPrint()" style="border: none; background: white; padding: 32px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); cursor: pointer; transition: all 0.3s ease; text-align: left; display: flex; flex-direction: column; gap: 20px;">
                        <div style="width: 60px; height: 60px; background: rgba(59, 130, 246, 0.08); border-radius: 18px; display: flex; align-items: center; justify-content: center; color: #3b82f6;">
                            <i data-lucide="printer" style="width: 30px; height: 30px;"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0 0 8px 0; font-size: 1.25rem;">Prueba de Impresión</h3>
                            <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem; line-height: 1.4;">Verifica el formato del ticket antes de atender clientes.</p>
                        </div>
                        <div style="margin-top: auto; display: flex; align-items: center; gap: 8px; color: #3b82f6; font-weight: 600; font-size: 0.9rem;">
                            Probar Impresora <i data-lucide="chevron-right" style="width: 16px;"></i>
                        </div>
                    </button>

                    <button class="settings-nav-card" onclick="settingsView.switchSubView('ticket')" style="border: none; background: white; padding: 32px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); cursor: pointer; transition: all 0.3s ease; text-align: left; display: flex; flex-direction: column; gap: 20px;">
                        <div style="width: 60px; height: 60px; background: rgba(75, 54, 33, 0.08); border-radius: 18px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
                            <i data-lucide="receipt" style="width: 30px; height: 30px;"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0 0 8px 0; font-size: 1.25rem;">Editor de Ticket</h3>
                            <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem; line-height: 1.4;">Personaliza qué información se muestra y el diseño del ticket.</p>
                        </div>
                        <div style="margin-top: auto; display: flex; align-items: center; gap: 8px; color: var(--primary); font-weight: 600; font-size: 0.9rem;">
                            Personalizar <i data-lucide="chevron-right" style="width: 16px;"></i>
                        </div>
                    </button>

                    <button class="settings-nav-card" onclick="settingsView.switchSubView('loyalty')" style="border: none; background: white; padding: 32px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); cursor: pointer; transition: all 0.3s ease; text-align: left; display: flex; flex-direction: column; gap: 20px;">
                        <div style="width: 60px; height: 60px; background: rgba(226, 150, 93, 0.1); border-radius: 18px; display: flex; align-items: center; justify-content: center; color: var(--accent);">
                            <i data-lucide="award" style="width: 30px; height: 30px;"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0 0 8px 0; font-size: 1.25rem;">Programa de Lealtad</h3>
                            <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem; line-height: 1.4;">Configura cómo tus clientes ganan y canjean sus puntos.</p>
                        </div>
                        <div style="margin-top: auto; display: flex; align-items: center; gap: 8px; color: var(--accent); font-weight: 600; font-size: 0.9rem;">
                            Configurar <i data-lucide="chevron-right" style="width: 16px;"></i>
                        </div>
                    </button>

                    <button class="settings-nav-card" onclick="settingsView.switchSubView('users')" style="border: none; background: white; padding: 32px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); cursor: pointer; transition: all 0.3s ease; text-align: left; display: flex; flex-direction: column; gap: 20px;">
                        <div style="width: 60px; height: 60px; background: rgba(99, 102, 241, 0.08); border-radius: 18px; display: flex; align-items: center; justify-content: center; color: #6366f1;">
                            <i data-lucide="shield" style="width: 30px; height: 30px;"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0 0 8px 0; font-size: 1.25rem;">Usuarios y Seguridad</h3>
                            <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem; line-height: 1.4;">Gestione el personal, sus roles, permisos y códigos de acceso.</p>
                        </div>
                        <div style="margin-top: auto; display: flex; align-items: center; gap: 8px; color: #6366f1; font-weight: 600; font-size: 0.9rem;">
                            Gestionar Equipo <i data-lucide="chevron-right" style="width: 16px;"></i>
                        </div>
                    </button>

                    <button class="settings-nav-card" onclick="settingsView.switchSubView('maintenance')" style="border: none; background: white; padding: 32px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); cursor: pointer; transition: all 0.3s ease; text-align: left; display: flex; flex-direction: column; gap: 20px;">
                        <div style="width: 60px; height: 60px; background: rgba(239, 68, 68, 0.08); border-radius: 18px; display: flex; align-items: center; justify-content: center; color: #ef4444;">
                            <i data-lucide="database" style="width: 30px; height: 30px;"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0 0 8px 0; font-size: 1.25rem;">Mantenimiento y Nube</h3>
                            <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem; line-height: 1.4;">Respaldos, migración entre navegadores y optimización en la nube.</p>
                        </div>
                        <div style="margin-top: auto; display: flex; align-items: center; gap: 8px; color: #ef4444; font-weight: 600; font-size: 0.9rem;">
                            Gestionar Datos <i data-lucide="chevron-right" style="width: 16px;"></i>
                        </div>
                    </button>

                </div>
            </div>
        `;
    },

    renderMaintenanceSection() {
        const settings = db.getSettings();
        return `
            <div class="settings-container fade-in">
                <div class="view-header" style="margin-bottom: 30px;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <button class="btn-icon-small" onclick="settingsView.switchSubView('menu')">
                            <i data-lucide="arrow-left"></i>
                        </button>
                        <div>
                            <h1>Mantenimiento y Datos</h1>
                            <p style="color: var(--text-muted);">Gestione la integridad y portabilidad de su información</p>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                    
                    <!-- Backup / Restore -->
                    <div class="card" style="padding: 30px;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                            <div style="width: 42px; height: 42px; background: #fee2e2; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #ef4444;">
                                <i data-lucide="save" style="width: 24px;"></i>
                            </div>
                            <h2 style="margin: 0; font-size: 1.4rem;">Respaldo Local</h2>
                        </div>
                        
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px;">Exporte toda su base de datos (productos, ventas, clientes) para moverla a otro navegador o computadora.</p>
                        
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <button class="btn-primary" onclick="settingsView.handleExport()" style="width: 100%; padding: 16px; border-radius: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px;">
                                <i data-lucide="download"></i> EXPORTAR BASE DE DATOS (.JSON)
                            </button>
                            
                            <label class="btn-secondary" style="width: 100%; padding: 16px; border-radius: 14px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; text-align: center;">
                                <i data-lucide="upload"></i> IMPORTAR RESPALDO
                                <input type="file" id="importFile" hidden accept=".json" onchange="settingsView.handleImport(this)">
                            </label>
                        </div>
                    </div>

                    <!-- Cloud Optimization -->
                    <div class="card" style="padding: 30px;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                            <div style="width: 42px; height: 42px; background: #e0f2fe; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #0ea5e9;">
                                <i data-lucide="cloud" style="width: 24px;"></i>
                            </div>
                            <h2 style="margin: 0; font-size: 1.4rem;">Optimización en la Nube</h2>
                        </div>
                        
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 24px;">Sube tus imágenes a la nube para ahorrar espacio local y asegurar que se vean en cualquier dispositivo.</p>
                        
                        <div class="input-group">
                            <label>ImgBB API Key (Gratis)</label>
                            <input type="password" id="imgbbKey" value="${settings.imgbb_api_key || ''}" placeholder="Ingresa tu API Key de ImgBB" class="large-input" style="font-family: monospace;">
                            <p style="font-size: 0.75rem; color: #94a3b8; margin-top: 8px;">Obtén una llave gratis en <a href="https://api.imgbb.com/" target="_blank" style="color: #0ea5e9;">api.imgbb.com</a> para habilitar el hosting de imágenes.</p>
                        </div>

                        <button class="btn-primary" onclick="settingsView.saveCloudConfig()" style="margin-top: 20px; width: 100%; border-radius: 14px; background: #0ea5e9; border-color: #0ea5e9; padding: 14px;">
                            GUARDAR CONFIGURACIÓN NUBE
                        </button>
                    </div>

                </div>
            </div>
        `;
    },


    renderProfileForm(settings) {
        return `
            <div class="settings-container fade-in">
                <div class="view-header">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <button class="btn-icon-small" onclick="settingsView.switchSubView('menu')">
                            <i data-lucide="arrow-left"></i>
                        </button>
                        <div>
                            <h1 style="margin:0;">Perfil del Negocio</h1>
                            <p style="color: var(--text-muted); font-size: 0.9rem;">Información pública y de contacto</p>
                        </div>
                    </div>
                </div>

                <div class="card" style="max-width: 800px; margin: 30px auto; padding: 40px;">
                    <form id="businessForm">
                        <div style="display: grid; grid-template-columns: 200px 1fr; gap: 40px;">
                            <div class="input-group" style="text-align: center;">
                                <label>Logotipo</label>
                                <div id="logoPreviewContainer" style="width: 160px; height: 160px; border: 2px dashed #eee; border-radius: 30px; margin: 15px auto; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fdfdfd; transition: all 0.3s ease;">
                                    ${settings.negocio.logo ? `<img src="${settings.negocio.logo}" style="width: 100%; height: 100%; object-fit: contain;">` : '<i data-lucide="image" style="color: #ccc; width: 50px; height: 50px;"></i>'}
                                </div>
                                <div style="display: flex; gap: 8px;">
                                    <input type="text" id="negLogo" value="${settings.negocio.logo || ''}" placeholder="URL del logo" class="large-input" style="font-size: 0.8rem; padding: 10px; flex: 1;">
                                    <button type="button" class="btn-secondary" onclick="document.getElementById('fileInLogo').click()" style="padding: 0 12px; border-radius: 10px;"><i data-lucide="upload" style="width: 16px;"></i></button>
                                    <input type="file" id="fileInLogo" hidden accept="image/*" onchange="settingsView.handleLogoUpload(this)">
                                </div>
                                <p style="font-size: 0.7rem; color: #999; margin-top: 8px;">Las imágenes se comprimen automáticamente.</p>
                            </div>

                            <div style="display: flex; flex-direction: column; gap: 20px;">
                                <div class="input-group">
                                    <label>Nombre del Establecimiento</label>
                                    <input type="text" id="negNombre" value="${settings.negocio.nombre}" required class="large-input">
                                </div>
                                <div class="input-group">
                                    <label>Eslogan Comercial</label>
                                    <input type="text" id="negEslogan" value="${settings.negocio.eslogan}" class="large-input" placeholder="Ej: El mejor café de la ciudad">
                                </div>
                                <div class="input-group">
                                    <label>Dirección</label>
                                    <textarea id="negDireccion" style="height: 80px; padding: 12px; font-size: 1rem;">${settings.negocio.direccion}</textarea>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                    <div class="input-group">
                                        <label>Teléfono</label>
                                        <input type="text" id="negTelefono" value="${settings.negocio.telefono}" class="large-input">
                                    </div>
                                    <div class="input-group">
                                        <label>RFC / ID Fiscal</label>
                                        <input type="text" id="negRfc" value="${settings.negocio.rfc}" class="large-input">
                                    </div>
                                </div>
                                <div class="input-group">
                                    <label>Mensaje Personalizado (Pie de Ticket)</label>
                                    <input type="text" id="negMensaje" value="${settings.negocio.mensajeTicket}" class="large-input">
                                </div>
                                
                                <div style="display: flex; gap: 12px; margin-top: 20px;">
                                    <button type="button" class="btn-secondary" onclick="settingsView.switchSubView('menu')" style="flex: 1;">Cancelar</button>
                                    <button type="submit" class="btn-primary" style="flex: 2;">Guardar Cambios</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    renderFiscalForm(settings) {
        return `
            <div class="settings-container fade-in">
                <div class="view-header">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <button class="btn-icon-small" onclick="settingsView.switchSubView('menu')">
                            <i data-lucide="arrow-left"></i>
                        </button>
                        <div>
                            <h1 style="margin:0;">Configuración Fiscal</h1>
                            <p style="color: var(--text-muted); font-size: 0.9rem;">Gestión de impuestos y facturación</p>
                        </div>
                    </div>
                </div>

                <div class="card" style="max-width: 600px; margin: 30px auto; padding: 40px;">
                    <form id="taxForm">
                        <div class="input-group" style="display: flex; align-items: center; justify-content: space-between; background: #f0fdf4; padding: 24px; border-radius: 20px; border: 1px solid #bbf7d0; margin-bottom: 30px;">
                            <div>
                                <h4 style="margin: 0; color: #166534; font-size: 1.1rem;">Desglosar IVA</h4>
                                <p style="margin: 4px 0 0 0; color: #15803d; font-size: 0.85rem; opacity: 0.8;">Habilitar el cálculo automático de impuestos.</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="manejarIVA" ${settings.manejarIVA ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>

                        <div id="ivaInputGroup" style="opacity: ${settings.manejarIVA ? '1' : '0.5'}; transition: all 0.3s ease;">
                            <div class="input-group">
                                <label style="font-weight: 600;">Porcentaje de IVA (%)</label>
                                <div style="position: relative;">
                                    <input type="number" id="porcentajeIVA" value="${settings.porcentajeIVA}" step="0.01" min="0" max="100" class="large-input" style="padding-left: 45px; font-size: 1.5rem;" ${!settings.manejarIVA ? 'disabled' : ''}>
                                    <i data-lucide="percent" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); width: 20px; color: #22c55e;"></i>
                                </div>
                                <small style="color: var(--text-muted); display: block; margin-top: 8px;">Este valor se aplicará al subtotal de todas las ventas.</small>
                            </div>
                        </div>

                        <div class="input-group" style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #f1f5f9;">
                            <label style="font-weight: 600; display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="hash" style="width: 18px; color: var(--primary);"></i>
                                Folio Consecutivo
                            </label>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px;">
                                <div>
                                    <label style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; display: block;">Folio Actual</label>
                                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center;">
                                        <span style="font-size: 2rem; font-weight: 800; color: var(--primary); font-family: 'Courier New', monospace;">#${String(settings.folioActual || 1).padStart(6, '0')}</span>
                                    </div>
                                    <small style="color: var(--text-muted); display: block; margin-top: 8px; text-align: center;">Próximo ticket</small>
                                </div>
                                <div>
                                    <label style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; display: block;">Reiniciar desde</label>
                                    <input type="number" id="folioInicio" value="${settings.folioActual || 1}" min="1" step="1" class="large-input" style="font-size: 1.3rem; text-align: center; font-family: 'Courier New', monospace;">
                                    <small style="color: #f59e0b; display: block; margin-top: 8px;">⚠️ Cambia con precaución</small>
                                </div>
                            </div>
                            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 12px; background: #fffbeb; padding: 12px; border-radius: 8px; border-left: 3px solid #f59e0b;">
                                <strong>Nota:</strong> El folio se incrementa automáticamente con cada venta. Solo modifica este valor si necesitas ajustar la numeración.
                            </p>
                        </div>

                        <div style="display: flex; gap: 12px; margin-top: 40px;">
                            <button type="button" class="btn-secondary" onclick="settingsView.switchSubView('menu')" style="flex: 1;">Volver</button>
                            <button type="submit" class="btn-primary" style="flex: 2; background: #22c55e; border-color: #22c55e;">Guardar Configuración</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    renderTicketForm(settings) {
        const config = settings.ticketConfig;
        return `
            <div class="settings-container fade-in">
                <div class="view-header">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <button class="btn-icon-small" onclick="settingsView.switchSubView('menu')">
                            <i data-lucide="arrow-left"></i>
                        </button>
                        <div>
                            <h1 style="margin:0;">Personalizar Ticket</h1>
                            <p style="color: var(--text-muted); font-size: 0.9rem;">Diseña la apariencia de tus recibos impresos</p>
                        </div>
                    </div>
                </div>

                <div class="ticket-editor-grid" style="display: grid; grid-template-columns: 1fr 380px; gap: 30px; margin-top: 30px;">
                    <!-- Controls -->
                    <div class="card" style="padding: 30px; margin-bottom: 0;">
                        <form id="ticketConfigForm">
                            <h3 style="margin-bottom: 20px; font-size: 1.1rem; border-bottom: 1px solid #eee; padding-bottom: 10px;">Contenido del Ticket</h3>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                                <div class="input-group" style="grid-column: span 2;">
                                    <label>Nombre del Negocio</label>
                                    <input type="text" id="confNombre" value="${settings.negocio.nombre}" class="large-input" style="font-size: 1rem;">
                                </div>
                                <div class="input-group">
                                    <label>Eslogan / Subtítulo</label>
                                    <input type="text" id="confEsloganText" value="${settings.negocio.eslogan}" class="large-input" style="font-size: 1rem;">
                                </div>
                                <div class="input-group">
                                    <label>Teléfono</label>
                                    <input type="text" id="confTelefonoText" value="${settings.negocio.telefono}" class="large-input" style="font-size: 1rem;">
                                </div>
                                <div class="input-group" style="grid-column: span 2;">
                                    <label>Dirección</label>
                                    <input type="text" id="confDireccionText" value="${settings.negocio.direccion}" class="large-input" style="font-size: 1rem;">
                                </div>
                                <div class="input-group">
                                    <label>RFC / ID Fiscal</label>
                                    <input type="text" id="confRFCText" value="${settings.negocio.rfc}" class="large-input" style="font-size: 1rem;">
                                </div>
                                <div class="input-group">
                                    <label>Tamaño de Fuente</label>
                                    <div style="display: flex; align-items: center; gap: 15px;">
                                        <input type="range" id="confFontSize" min="10" max="18" value="${config.tamanoFuente}" style="flex: 1; accent-color: var(--primary);">
                                        <span id="fontSizeDisplay" style="font-weight: 700; min-width: 40px;">${config.tamanoFuente}px</span>
                                    </div>
                                </div>
                            </div>

                            <h3 style="margin-bottom: 20px; font-size: 1.1rem; border-bottom: 1px solid #eee; padding-bottom: 10px;">Visibilidad de Secciones</h3>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 30px;">
                                ${this.renderToggle('Logo', 'confLogo', config.mostrarLogo)}
                                ${this.renderToggle('Eslogan', 'confEslogan', config.mostrarEslogan)}
                                ${this.renderToggle('Dirección', 'confDireccion', config.mostrarDireccion)}
                                ${this.renderToggle('Teléfono', 'confTelefono', config.mostrarTelefono)}
                                ${this.renderToggle('RFC', 'confRFC', config.mostrarRFC)}
                                ${this.renderToggle('Notas', 'confNotas', config.mostrarNotas)}
                                ${this.renderToggle('Extras', 'confExtras', config.mostrarExtras)}
                            </div>

                            <div class="input-group">
                                <label>Mensaje de Agradecimiento (Pie de Ticket)</label>
                                <textarea id="confMensaje" style="height: 60px; font-size: 0.95rem; padding: 12px;">${settings.negocio.mensajeTicket}</textarea>
                            </div>

                            <div style="display: flex; gap: 12px; margin-top: 40px;">
                                <button type="button" class="btn-secondary" onclick="settingsView.switchSubView('menu')" style="flex: 1;">Cancelar</button>
                                <button type="submit" class="btn-primary" style="flex: 2;">Guardar Diseño</button>
                            </div>
                        </form>
                    </div>

                    <!-- Live Preview -->
                    <div style="position: sticky; top: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3 style="font-size: 1rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">Vista Previa</h3>
                            <span class="badge secondary">58mm</span>
                        </div>
                        <div id="ticketLivePreview" style="background: white; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border: 1px solid #eee; border-radius: 4px; overflow: hidden; transform: scale(0.95); transform-origin: top center;">
                            <!-- Preview injected here -->
                        </div>
                        <p style="text-align: center; font-size: 0.8rem; color: #999; margin-top: 15px;">Esta es una representación aproximada del ticket impreso.</p>
                    </div>
                </div>
            </div>
        `;
    },

    renderToggle(label, id, checked) {
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; background: #fafafa; padding: 12px 16px; border-radius: 12px; border: 1px solid #f0f0f0;">
                <span style="font-size: 0.9rem; font-weight: 500;">${label}</span>
                <label class="switch">
                    <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} class="preview-trigger">
                    <span class="slider round"></span>
                </label>
            </div>
        `;
    },

    renderLoyaltyForm(settings) {
        const loyalty = settings.fidelizacion;
        return `
            <div class="settings-container fade-in">
                <div class="view-header">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <button class="btn-icon-small" onclick="settingsView.switchSubView('menu')">
                            <i data-lucide="arrow-left"></i>
                        </button>
                        <div>
                            <h1 style="margin:0;">Programa de Fidelidad</h1>
                            <p style="color: var(--text-muted); font-size: 0.9rem;">Reglas de acumulación y canje de puntos</p>
                        </div>
                    </div>
                </div>

                <div class="card" style="max-width: 600px; margin: 30px auto; padding: 40px;">
                    <form id="loyaltyForm">
                        <div class="input-group" style="display: flex; align-items: center; justify-content: space-between; background: #fdfaf6; padding: 24px; border-radius: 20px; border: 1px solid #f9731633; margin-bottom: 30px;">
                            <div>
                                <h4 style="margin: 0; color: var(--primary); font-size: 1.1rem;">Estado del Programa</h4>
                                <p style="margin: 4px 0 0 0; color: var(--text-muted); font-size: 0.85rem;">Activar o desactivar el sistema de puntos.</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="loyaltyActivo" ${loyalty.activo ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>

                        <div id="loyaltyInputs" style="opacity: ${loyalty.activo ? '1' : '0.5'}; transition: all 0.3s ease;">
                            <div class="input-group">
                                <label style="font-weight: 600;">Puntos ganados por cada $10.00 MXN</label>
                                <div style="position: relative;">
                                    <input type="number" id="loyaltyPuntosXDinero" value="${loyalty.puntosPorDinero}" min="1" class="large-input" style="padding-left: 45px; font-size: 1.5rem;" ${!loyalty.activo ? 'disabled' : ''}>
                                    <i data-lucide="coins" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); width: 20px; color: var(--accent);"></i>
                                </div>
                                <small style="color: var(--text-muted); display: block; margin-top: 8px;">Ej: '1' significa que una compra de $100 da 10 puntos.</small>
                            </div>

                            <div class="input-group" style="margin-top: 25px;">
                                <label style="font-weight: 600;">Valor monetario de cada punto ($)</label>
                                <div style="position: relative;">
                                    <input type="number" id="loyaltyValorPunto" value="${loyalty.valorPunto}" step="0.01" class="large-input" style="padding-left: 45px; font-size: 1.5rem;" ${!loyalty.activo ? 'disabled' : ''}>
                                    <i data-lucide="banknote" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); width: 20px; color: var(--success);"></i>
                                </div>
                                <small style="color: var(--text-muted); display: block; margin-top: 8px;">Ej: '0.50' significa que 10 puntos descuentan $5.00 MXN.</small>
                            </div>

                            <div class="input-group" style="margin-top: 25px;">
                                <label style="font-weight: 600;">Puntos mínimos para canjear</label>
                                <div style="position: relative;">
                                    <input type="number" id="loyaltyMinimo" value="${loyalty.puntosParaCanje}" min="0" class="large-input" style="padding-left: 45px; font-size: 1.5rem;" ${!loyalty.activo ? 'disabled' : ''}>
                                    <i data-lucide="shield-check" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); width: 20px; color: var(--primary);"></i>
                                </div>
                                <small style="color: var(--text-muted); display: block; margin-top: 8px;">El cliente no podrá usar sus puntos hasta alcanzar esta cifra.</small>
                            </div>
                        </div>

                        <div style="display: flex; gap: 12px; margin-top: 40px;">
                            <button type="button" class="btn-secondary" onclick="settingsView.switchSubView('menu')" style="flex: 1;">Volver</button>
                            <button type="submit" class="btn-primary" style="flex: 2;">Guardar Reglas</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    async renderUsersSection() {
        this.usuarios = await db.getCollection('usuarios');
        return `
            <div class="settings-container fade-in">
                <div class="view-header" style="margin-bottom: 32px;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <button class="btn-icon-small" onclick="settingsView.switchSubView('menu')">
                            <i data-lucide="arrow-left"></i>
                        </button>
                        <div>
                            <h1 style="margin:0;">Usuarios y Seguridad</h1>
                            <p style="color: var(--text-muted); font-size: 0.9rem;">Control de acceso y perfiles del equipo</p>
                        </div>
                    </div>
                    <button class="btn-primary" onclick="settingsView.showUserAddModal()" style="display: flex; align-items: center; gap: 10px; padding: 12px 24px; border-radius: 14px;">
                        <i data-lucide="user-plus"></i> NUEVO USUARIO
                    </button>
                </div>

                <div class="users-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;">
                    ${this.usuarios.map(user => `
                        <div class="card" style="padding: 24px; display: flex; align-items: center; gap: 20px; transition: all 0.3s ease; border: 1px solid #f1f5f9;">
                            <div style="width: 64px; height: 64px; background: var(--bg-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; color: var(--primary); flex-shrink: 0;">
                                ${user.avatar || user.nombre.charAt(0)}
                            </div>
                            <div style="flex: 1;">
                                <h3 style="margin: 0 0 4px 0; font-size: 1.1rem;">${user.nombre}</h3>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; padding: 3px 10px; border-radius: 20px; background: ${this.getRoleBadge(user.rol).bg}; color: ${this.getRoleBadge(user.rol).color};">
                                        ${user.rol}
                                    </span>
                                    <span style="color: #94a3b8; font-size: 0.8rem;">@${user.usuario}</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 6px;">
                                <button class="btn-icon-small" onclick="settingsView.showUserAddModal('${user.id}')" title="Editar">
                                    <i data-lucide="edit-3" style="width: 14px;"></i>
                                </button>
                                ${user.rol !== 'admin' ? `
                                <button class="btn-icon-small danger" onclick="settingsView.deleteUser('${user.id}')" title="Eliminar">
                                    <i data-lucide="trash-2" style="width: 14px;"></i>
                                </button>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>

                    </div>
                </div>

                <!-- Audit Log Section -->
                <div style="margin-top: 50px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                        <div>
                            <h2 style="font-family: 'Playfair Display', serif; margin: 0;">Registro de Actividad</h2>
                            <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">Historial de acciones críticas del sistema</p>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px; background: white; padding: 12px 20px; border-radius: 16px; border: 1px solid #f1f5f9;">
                            <span style="font-weight: 600; font-size: 0.9rem; color: var(--primary);">Habilitar Auditoría</span>
                            <label class="switch">
                                <input type="checkbox" id="auditActive" ${db.getSettings().auditoria?.activo ? 'checked' : ''} onchange="settingsView.toggleAudit(this.checked)">
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>

                    <div class="card" style="padding: 0; overflow: hidden; border: 1px solid #f1f5f9;">
                        <div style="max-height: 400px; overflow-y: auto;">
                            <table class="modern-table" style="margin: 0;">
                                <thead style="position: sticky; top: 0; background: #f8fafc; z-index: 10;">
                                    <tr>
                                        <th>Fecha / Hora</th>
                                        <th>Usuario</th>
                                        <th>Acción</th>
                                        <th>Módulo</th>
                                        <th>Detalle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(await db.getMockData('audit_logs') || []).length > 0 ? (await db.getMockData('audit_logs')).map(log => `
                                        <tr>
                                            <td style="font-size: 0.8rem; color: var(--text-muted);">${new Date(log.timestamp).toLocaleString()}</td>
                                            <td style="font-weight: 600;">${log.usuarioNombre} <small style="display:block; opacity: 0.6; font-size:0.7rem;">${log.rol.toUpperCase()}</small></td>
                                            <td><span class="badge ${this.getAuditBadge(log.action)}">${log.action}</span></td>
                                            <td style="text-transform: capitalize;">${log.context}</td>
                                            <td style="font-size: 0.85rem; color: #64748b;">${log.details}</td>
                                        </tr>
                                    `).join('') : `<tr><td colspan="5" style="text-align:center; padding: 40px; color: #94a3b8;">No hay registros de actividad recientes</td></tr>`}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    getAuditBadge(action) {
        if (action.includes('eliminar') || action.includes('borrar') || action.includes('anular')) return 'danger';
        if (action.includes('actualizar') || action.includes('editar')) return 'warning';
        return 'secondary';
    },

    toggleAudit(active) {
        const settings = db.getSettings();
        settings.auditoria = { activo: active };
        db.saveSettings(settings);
        db.logAction('config', active ? 'auditoria_habilitada' : 'auditoria_deshabilitada', 'El usuario cambió la preferencia de logs.');
    },


    getRoleBadge(rol) {
        switch (rol) {
            case 'admin': return { bg: '#dcfce7', color: '#166534' };
            case 'cajero': return { bg: '#fef9c3', color: '#854d0e' };
            case 'mesero': return { bg: '#dbeafe', color: '#1e40af' };
            default: return { bg: '#f1f5f9', color: '#475569' };
        }
    },

    async showUserAddModal(id = null) {
        const user = id ? this.usuarios.find(u => u.id === id) : null;
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        modalContent.innerHTML = `
            <div style="width: 420px;">
                <h2 style="margin-bottom: 24px; font-family: 'Playfair Display', serif;">${user ? 'Editar Perfil' : 'Nuevo Integrante'}</h2>
                <form id="userSettingsForm">
                    <div class="input-group">
                        <label>Nombre Real</label>
                        <input type="text" id="uRealName" value="${user ? user.nombre : ''}" required class="large-input" style="font-size: 1rem; padding: 12px;">
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div class="input-group">
                            <label>Usuario</label>
                            <input type="text" id="uName" value="${user ? user.usuario : ''}" required class="large-input" style="font-size: 1rem; padding: 12px;">
                        </div>
                        <div class="input-group">
                            <label>Rol</label>
                            <select id="uRole" class="large-input" style="font-size: 1rem; padding: 12px;">
                                <option value="mesero" ${user?.rol === 'mesero' ? 'selected' : ''}>Mesero</option>
                                <option value="cajero" ${user?.rol === 'cajero' ? 'selected' : ''}>Cajero</option>
                                <option value="admin" ${user?.rol === 'admin' ? 'selected' : ''}>Admin</option>
                            </select>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>PIN de Acceso (4 dígitos)</label>
                        <input type="password" id="uPass" value="${user ? user.clave : ''}" required maxlength="4" class="large-input" style="font-size: 1.2rem; text-align: center; letter-spacing: 5px;">
                    </div>
                    <div style="display: flex; gap: 12px; margin-top: 20px;">
                        <button type="button" class="btn-secondary" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="flex:1;">Cancelar</button>
                        <button type="submit" class="btn-primary" style="flex:2;">${user ? 'GUARDAR' : 'CREAR'}</button>
                    </div>
                </form>
            </div>
        `;

        modal.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();

        document.getElementById('userSettingsForm').onsubmit = async (e) => {
            e.preventDefault();
            const data = {
                nombre: document.getElementById('uRealName').value,
                usuario: document.getElementById('uName').value.toLowerCase(),
                rol: document.getElementById('uRole').value,
                clave: document.getElementById('uPass').value,
                avatar: document.getElementById('uRealName').value.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            };

            if (user) {
                await db.updateDocument('usuarios', user.id, data);
            } else {
                await db.addDocument('usuarios', data);
            }

            modal.classList.add('hidden');
            app.showToast('Cambios aplicados correctamente');
            app.renderView('settings');
        };
    },

    async deleteUser(id) {
        if (id === 'U1') return; // Protect original admin
        const u = this.usuarios.find(user => user.id === id);
        if (confirm(`¿Eliminar al usuario "${u?.nombre}" definitivamente?`)) {
            await db.deleteDocument('usuarios', id);
            await db.logAction('usuarios', 'eliminar_usuario', `Usuario: "${u?.nombre}"`);
            app.renderView('settings');
        }
    },

    switchSubView(view) {
        this.activeSubView = view;
        if (this.app) {
            this.app.renderView('settings');
        }
    },

    bindEvents(appInstance) {
        this.app = appInstance;

        if (this.activeSubView === 'profile') {
            const businessForm = document.getElementById('businessForm');
            const logoInput = document.getElementById('negLogo');
            const logoPreview = document.getElementById('logoPreviewContainer');

            if (logoInput) {
                logoInput.oninput = (e) => {
                    const path = e.target.value;
                    if (path) {
                        logoPreview.innerHTML = `<img src="${path}" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.parentElement.innerHTML = '<i data-lucide=\\'image-off\\' style=\\'color: var(--danger); width: 40px;\\'></i>'; lucide.createIcons();">`;
                    } else {
                        logoPreview.innerHTML = '<i data-lucide="image" style="color: #ccc; width: 45px; height: 45px;"></i>';
                    }
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                };
            }

            if (businessForm) {
                businessForm.onsubmit = (e) => {
                    e.preventDefault();
                    const currentSettings = db.getSettings();
                    const newSettings = {
                        ...currentSettings,
                        negocio: {
                            nombre: document.getElementById('negNombre').value,
                            eslogan: document.getElementById('negEslogan').value,
                            logo: document.getElementById('negLogo').value,
                            direccion: document.getElementById('negDireccion').value,
                            telefono: document.getElementById('negTelefono').value,
                            rfc: document.getElementById('negRfc').value,
                            mensajeTicket: document.getElementById('negMensaje').value
                        }
                    };
                    db.saveSettings(newSettings);
                    db.logAction('config', 'actualizar_perfil', `Negocio: ${newSettings.negocio.nombre}`);
                    this.showToast('¡Perfil actualizado con éxito!');
                    this.switchSubView('menu');
                    setTimeout(() => location.reload(), 1500);
                };
            }
        }

        if (this.activeSubView === 'fiscal') {
            const taxForm = document.getElementById('taxForm');
            const toggleIVA = document.getElementById('manejarIVA');
            const inputIVA = document.getElementById('porcentajeIVA');
            const inputGroup = document.getElementById('ivaInputGroup');

            if (toggleIVA) {
                toggleIVA.onchange = (e) => {
                    inputIVA.disabled = !e.target.checked;
                    inputGroup.style.opacity = e.target.checked ? '1' : '0.5';
                };
            }

            if (taxForm) {
                taxForm.onsubmit = (e) => {
                    e.preventDefault();
                    const currentSettings = db.getSettings();
                    const newFolio = parseInt(document.getElementById('folioInicio').value) || 1;
                    const newSettings = {
                        ...currentSettings,
                        manejarIVA: toggleIVA.checked,
                        porcentajeIVA: parseFloat(inputIVA.value) || 0,
                        folioActual: newFolio
                    };
                    db.saveSettings(newSettings);
                    db.logAction('config', 'actualizar_fiscal', `IVA: ${toggleIVA.checked ? newSettings.porcentajeIVA + '%' : 'Desactivado'}, Folio: ${newFolio}`);
                    this.showToast('Configuración fiscal guardada');
                    this.switchSubView('menu');
                };
            }
        }

        if (this.activeSubView === 'ticket') {
            const form = document.getElementById('ticketConfigForm');
            const fontSizeInput = document.getElementById('confFontSize');
            const fontSizeDisplay = document.getElementById('fontSizeDisplay');

            const refreshPreview = async () => {
                const settings = db.getSettings();
                // Override with current form values for preview
                settings.ticketConfig = {
                    mostrarLogo: document.getElementById('confLogo').checked,
                    mostrarEslogan: document.getElementById('confEslogan').checked,
                    mostrarDireccion: document.getElementById('confDireccion').checked,
                    mostrarTelefono: document.getElementById('confTelefono').checked,
                    mostrarRFC: document.getElementById('confRFC').checked,
                    mostrarNotas: document.getElementById('confNotas').checked,
                    mostrarExtras: document.getElementById('confExtras').checked,
                    tamanoFuente: parseInt(fontSizeInput.value),
                    anchoPapel: 58
                };
                settings.negocio = {
                    ...settings.negocio,
                    nombre: document.getElementById('confNombre').value,
                    eslogan: document.getElementById('confEsloganText').value,
                    direccion: document.getElementById('confDireccionText').value,
                    telefono: document.getElementById('confTelefonoText').value,
                    rfc: document.getElementById('confRFCText').value,
                    mensajeTicket: document.getElementById('confMensaje').value
                };

                const dummyVenta = {
                    id: 'PREVIEW-123',
                    fecha: new Date().toISOString(),
                    total: 125.00,
                    metodoPago: 'Efectivo',
                    pagadoCon: 150.00,
                    cambio: 25.00,
                    items: [
                        { nombre: 'Cappuccino Grande', precio: 65.00, quantity: 1, nota: 'Sin azúcar', extras: [{ nombre: 'Canela', precio: 5 }] },
                        { nombre: 'Croissant Mantequilla', precio: 55.00, quantity: 1 }
                    ]
                };

                const container = document.getElementById('ticketLivePreview');
                if (container) {
                    container.innerHTML = await ticketView.generateHTML(dummyVenta, settings);
                }
            };

            // Bind triggers for live preview
            document.querySelectorAll('.preview-trigger').forEach(el => el.onchange = refreshPreview);
            document.querySelectorAll('#ticketConfigForm input[type="text"], #ticketConfigForm textarea').forEach(el => el.oninput = refreshPreview);
            fontSizeInput.oninput = (e) => {
                fontSizeDisplay.textContent = `${e.target.value}px`;
                refreshPreview();
            };

            // Initial preview
            refreshPreview();

            if (form) {
                form.onsubmit = (e) => {
                    e.preventDefault();
                    const currentSettings = db.getSettings();
                    const newSettings = {
                        ...currentSettings,
                        ticketConfig: {
                            mostrarLogo: document.getElementById('confLogo').checked,
                            mostrarEslogan: document.getElementById('confEslogan').checked,
                            mostrarDireccion: document.getElementById('confDireccion').checked,
                            mostrarTelefono: document.getElementById('confTelefono').checked,
                            mostrarRFC: document.getElementById('confRFC').checked,
                            mostrarNotas: document.getElementById('confNotas').checked,
                            mostrarExtras: document.getElementById('confExtras').checked,
                            tamanoFuente: parseInt(fontSizeInput.value),
                            anchoPapel: 58
                        },
                        negocio: {
                            ...currentSettings.negocio,
                            nombre: document.getElementById('confNombre').value,
                            eslogan: document.getElementById('confEsloganText').value,
                            direccion: document.getElementById('confDireccionText').value,
                            telefono: document.getElementById('confTelefonoText').value,
                            rfc: document.getElementById('confRFCText').value,
                            mensajeTicket: document.getElementById('confMensaje').value
                        }
                    };
                    db.saveSettings(newSettings);
                    db.logAction('config', 'actualizar_ticket', 'Cambios guardados en diseño de ticket');
                    this.showToast('Configuración del ticket guardada');
                    this.switchSubView('menu');
                };
            }
        }

        if (this.activeSubView === 'loyalty') {
            const form = document.getElementById('loyaltyForm');
            const toggle = document.getElementById('loyaltyActivo');
            const inputs = document.getElementById('loyaltyInputs');

            if (toggle) {
                toggle.onchange = (e) => {
                    inputs.style.opacity = e.target.checked ? '1' : '0.5';
                    inputs.querySelectorAll('input').forEach(i => i.disabled = !e.target.checked);
                };
            }

            if (form) {
                form.onsubmit = (e) => {
                    e.preventDefault();
                    const currentSettings = db.getSettings();
                    const newSettings = {
                        ...currentSettings,
                        fidelizacion: {
                            activo: toggle.checked,
                            puntosPorDinero: parseInt(document.getElementById('loyaltyPuntosXDinero').value) || 1,
                            valorPunto: parseFloat(document.getElementById('loyaltyValorPunto').value) || 0,
                            puntosParaCanje: parseInt(document.getElementById('loyaltyMinimo').value) || 0
                        }
                    };
                    db.saveSettings(newSettings);
                    this.showToast('Configuración de lealtad guardada');
                    this.switchSubView('menu');
                };
            }
        }
    },

    showToast(message) {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        modalContent.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="width: 70px; height: 70px; background: #f0fdf4; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                    <i data-lucide="check-circle" style="color: #22c55e; width: 40px; height: 40px;"></i>
                </div>
                <h2 style="margin-bottom: 10px; color: #1e293b;">¡Hecho!</h2>
                <p style="color: #64748b; font-size: 1.1rem;">${message}</p>
                <button class="btn-primary" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="width: 100%; margin-top: 30px; padding: 16px;">Entendido</button>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        modal.classList.remove('hidden');
    },

    async testPrint() {
        const dummyVenta = {
            id: 'TEST-0001',
            fecha: new Date().toISOString(),
            total: 155.50,
            metodoPago: 'Efectivo',
            pagadoCon: 200,
            cambio: 44.50,
            items: [
                { nombre: 'Cappuccino', precio: 55, quantity: 2, nota: 'Caliente' },
                { nombre: 'Muffin Arándano', precio: 45.50, quantity: 1, extras: [{ nombre: 'Extra Queso', precio: 10 }] }
            ]
        };
        const settings = db.getSettings();
        await ticketView.print('test', dummyVenta, settings);
    },

    async handleLogoUpload(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const dataUrl = e.target.result;
            const compressed = await db.compressImage(dataUrl, 400, 0.7);

            const cloudUrl = await db.uploadToCloud(compressed);
            const finalPath = cloudUrl || compressed;

            document.getElementById('negLogo').value = finalPath;
            // Trigger preview update
            const logoPreview = document.getElementById('logoPreviewContainer');
            if (logoPreview) {
                logoPreview.innerHTML = `<img src="${finalPath}" style="width: 100%; height: 100%; object-fit: contain;">`;
            }
            app.showToast(cloudUrl ? 'Logo subido a la nube' : 'Logo comprimido localmente');
        };
        reader.readAsDataURL(file);
    },

    async handleExport() {
        const data = await db.exportAllData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aromatic_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        db.logAction('config', 'exportar_datos', 'Se generó un respaldo de la base de datos.');
    },

    async handleImport(input) {
        const file = input.files[0];
        if (!file) return;

        if (confirm('¿Estás seguro de importar este respaldo? Se SOBRESCRIBIRÁ toda la información actual (productos, ventas, configuraciones).')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const success = await db.importAllData(e.target.result);
                if (success) {
                    db.logAction('config', 'importar_datos', 'Se restauró la base de datos desde un archivo.');
                    alert('Importación exitosa. La aplicación se reiniciará.');
                    location.reload();
                } else {
                    alert('Error al importar el archivo. Asegúrate de que sea un respaldo válido de Aromatic POS.');
                }
            };
            reader.readAsDataURL(file);
        }
        input.value = ''; // Reset input
    },

    saveCloudConfig() {
        const key = document.getElementById('imgbbKey').value.trim();
        const settings = db.getSettings();
        settings.imgbb_api_key = key;
        db.saveSettings(settings);
        db.logAction('config', 'actualizar_nube', `API Key de imágenes actualizada: ${key ? 'Configurada' : 'Eliminada'}`);
        this.showToast('Configuración de nube guardada con éxito.');
    },

    async renderPromotionsSection() {
        const settings = db.getSettings();
        const promos = await db.getCollection('promociones');
        const activo = settings.promociones?.activo ?? true;

        return `
            <div class="settings-container fade-in">
                <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <button class="btn-icon-small" onclick="settingsView.switchSubView('menu')">
                            <i data-lucide="arrow-left"></i>
                        </button>
                        <div>
                            <h1>Promociones y Reglas</h1>
                            <p style="color: var(--text-muted);">Automatiza descuentos y Happy Hours</p>
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 20px; background: white; padding: 10px 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Sistema General</span>
                            <span style="font-weight: 700; color: ${activo ? 'var(--success)' : 'var(--danger)'}">${activo ? 'ACTIVO' : 'DESACTIVADO'}</span>
                        </div>
                        <label class="switch">
                            <input type="checkbox" ${activo ? 'checked' : ''} onchange="settingsView.togglePromotionSystem(this.checked)">
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr; gap: 24px;">
                    <div class="card" style="padding: 0; overflow: hidden;">
                        <div style="padding: 20px 25px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #fafafa;">
                            <h2 style="margin:0; font-size: 1.1rem; display: flex; align-items: center; gap: 10px;">
                                <i data-lucide="list-checks" style="color: var(--primary);"></i> Reglas Configuradas
                            </h2>
                            <button class="btn-primary" onclick="settingsView.showPromotionModal()" style="padding: 10px 20px; border-radius: 12px; font-size: 0.9rem;">
                                <i data-lucide="plus"></i> NUEVA REGLA
                            </button>
                        </div>
                        
                        <div class="table-container" style="max-height: 500px; overflow-y: auto;">
                            <table class="modern-table">
                                <thead>
                                    <tr>
                                        <th>Nombre / Tipo</th>
                                        <th>Horario y Días</th>
                                        <th>Aplica A</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${promos.map(p => `
                                        <tr>
                                            <td>
                                                <div style="display: flex; flex-direction: column;">
                                                    <strong style="color: var(--primary);">${p.nombre}</strong>
                                                    <span class="badge ${p.tipo === '2x1' ? 'success' : 'primary'}" style="font-size: 0.65rem; width: fit-content; margin-top: 4px;">${p.tipo.toUpperCase()}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style="display: flex; flex-direction: column; gap: 4px;">
                                                    <div style="display: flex; align-items: center; gap: 6px; font-size: 0.85rem;">
                                                        <i data-lucide="clock" style="width: 12px;"></i> ${p.horaInicio} - ${p.horaFin}
                                                    </div>
                                                    <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: capitalize;">
                                                        ${p.dias.join(', ')}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style="font-size: 0.85rem;">
                                                    ${p.aplicaA === 'productos' ? 'Productos específicos' : 'Categoría completa'}
                                                </div>
                                            </td>
                                            <td>
                                                <span class="status-pill ${p.activo ? 'active' : 'inactive'}">
                                                    ${p.activo ? 'Vigente' : 'Pausada'}
                                                </span>
                                            </td>
                                            <td>
                                                <div style="display: flex; gap: 8px;">
                                                    <button class="btn-icon-small" onclick="settingsView.showPromotionModal(${JSON.stringify(p).replace(/"/g, '&quot;')})" style="color: var(--primary); background: #f8fafc; border: 1px solid #e2e8f0;">
                                                        <i data-lucide="edit-2"></i>
                                                    </button>
                                                    <button class="btn-icon-small danger" onclick="settingsView.deletePromotion('${p.id}')">
                                                        <i data-lucide="trash-2"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                    ${promos.length === 0 ? '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8;">No hay promociones registradas.</td></tr>' : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    togglePromotionSystem(active) {
        const settings = db.getSettings();
        if (!settings.promociones) settings.promociones = {};
        settings.promociones.activo = active;
        db.saveSettings(settings);
        db.logAction('config', active ? 'promociones_activadas' : 'promociones_desactivadas', 'Se cambió el estado maestro del sistema de descuentos.');
        app.renderView('settings');
    },

    async showPromotionModal(promo = null) {
        const isEdit = !!promo;
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        const products = await db.getCollection('productos');
        const categories = await db.getCollection('categorias');

        modalContent.innerHTML = `
            <div style="width: 550px; padding: 15px;">
                <h2 style="margin-bottom: 25px; color: var(--primary); font-family: 'Playfair Display', serif;">${isEdit ? 'Editar Regla' : 'Nueva Promoción'}</h2>
                
                <form id="promoForm" style="display: flex; flex-direction: column; gap: 20px;">
                    <div class="input-group">
                        <label>Nombre de la Promoción</label>
                        <input type="text" id="promoNombre" value="${promo?.nombre || ''}" required class="large-input" placeholder="Ej: Happy Hour Lunes">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="input-group">
                            <label>Tipo de Descuento</label>
                            <select id="promoTipo" class="large-input">
                                <option value="2x1" ${promo?.tipo === '2x1' ? 'selected' : ''}>2x1 (El segundo es gratis)</option>
                                <option value="porcentaje" ${promo?.tipo === 'porcentaje' ? 'selected' : ''}>Porcentaje (%)</option>
                                <option value="monto_fijo" ${promo?.tipo === 'monto_fijo' ? 'selected' : ''}>Descuento Fijo ($)</option>
                            </select>
                        </div>
                        <div class="input-group" id="valContainer" style="display: ${promo?.tipo === '2x1' ? 'none' : 'block'};">
                            <label>Valor</label>
                            <input type="number" id="promoValor" value="${promo?.valor || 0}" step="0.01" class="large-input">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="input-group">
                            <label>Hora Inicio</label>
                            <input type="time" id="promoInicio" value="${promo?.horaInicio || '00:00'}" required class="large-input">
                        </div>
                        <div class="input-group">
                            <label>Hora Fin</label>
                            <input type="time" id="promoFin" value="${promo?.horaFin || '23:59'}" required class="large-input">
                        </div>
                    </div>

                    <div class="input-group">
                        <label>Días de Aplicación</label>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
                            ${['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(d => {
            const checked = promo?.dias?.includes(d) || !promo; // Por defecto todos si es nuevo
            return `
                                    <label style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 10px; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                        <input type="checkbox" class="day-checkbox" value="${d}" ${checked ? 'checked' : ''}>
                                        ${d.substring(0, 3).toUpperCase()}
                                    </label>
                                `;
        }).join('')}
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="input-group">
                            <label>Aplica a...</label>
                            <select id="promoAplicaA" class="large-input" onchange="document.getElementById('itemsSel').style.display = this.value === 'productos' ? 'block' : 'none'; document.getElementById('catSel').style.display = this.value === 'categorias' ? 'block' : 'none';">
                                <option value="productos" ${promo?.aplicaA === 'productos' ? 'selected' : ''}>Productos Seleccionados</option>
                                <option value="categorias" ${promo?.aplicaA === 'categorias' ? 'selected' : ''}>Toda una Categoría</option>
                            </select>
                        </div>
                        <div id="itemsSel" class="input-group" style="display: ${promo?.aplicaA === 'categorias' ? 'none' : 'block'};">
                            <label>Productos</label>
                            <select id="promoItems" multiple class="large-input" style="height: 80px;">
                                ${products.map(p => `<option value="${p.id}" ${promo?.itemsIds?.includes(p.id) ? 'selected' : ''}>${p.nombre}</option>`).join('')}
                            </select>
                            <small style="color: #94a3b8;">Ctrl + Clic para varios</small>
                        </div>
                        <div id="catSel" class="input-group" style="display: ${promo?.aplicaA === 'categorias' ? 'block' : 'none'};">
                            <label>Categoría</label>
                            <select id="promoCat" class="large-input">
                                ${categories.map(c => `<option value="${c.nombre}" ${promo?.categoria === c.nombre ? 'selected' : ''}>${c.nombre}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div style="display: flex; gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                        <button type="button" class="btn-secondary" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="flex: 1;">Cancelar</button>
                        <button type="submit" class="btn-primary" style="flex: 2; font-weight: 800;">REGLA: ${isEdit ? 'GUARDAR CAMBIOS' : 'CREAR PROMOCIÓN'}</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('promoTipo').onchange = (e) => {
            document.getElementById('valContainer').style.display = e.target.value === '2x1' ? 'none' : 'block';
        };

        if (typeof lucide !== 'undefined') lucide.createIcons();
        modal.classList.remove('hidden');

        document.getElementById('promoForm').onsubmit = async (e) => {
            e.preventDefault();

            const dias = [];
            modal.querySelectorAll('.day-checkbox:checked').forEach(cb => dias.push(cb.value));

            const itemsIds = Array.from(document.getElementById('promoItems').selectedOptions).map(opt => opt.value);

            const data = {
                nombre: document.getElementById('promoNombre').value,
                tipo: document.getElementById('promoTipo').value,
                valor: parseFloat(document.getElementById('promoValor').value) || 0,
                horaInicio: document.getElementById('promoInicio').value,
                horaFin: document.getElementById('promoFin').value,
                dias: dias,
                aplicaA: document.getElementById('promoAplicaA').value,
                itemsIds: itemsIds,
                categoria: document.getElementById('promoCat').value,
                activo: promo ? promo.activo : true
            };

            if (isEdit) {
                await db.updateDocument('promociones', promo.id, data);
                db.logAction('config', 'editar_promocion', `Se actualizó la regla: ${data.nombre}`);
            } else {
                await db.addDocument('promociones', data);
                db.logAction('config', 'crear_promocion', `Nueva promoción: ${data.nombre}`);
            }

            modal.classList.add('hidden');
            this.app.renderView('settings');
        };
    },

    async deletePromotion(id) {
        if (confirm('¿Eliminar esta promoción definitivamente?')) {
            await db.deleteDocument('promociones', id);
            db.logAction('config', 'eliminar_promocion', `ID: ${id}`);
            app.renderView('settings');
        }
    }
};
