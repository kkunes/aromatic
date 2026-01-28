const wasteView = {
    mermas: [],
    insumos: [],
    filterQuery: '',

    async render() {
        this.mermas = await db.getCollection('mermas');
        this.insumos = await db.getCollection('insumos');

        const filtered = this.mermas
            .filter(m => m.insumoNombre.toLowerCase().includes(this.filterQuery.toLowerCase()) ||
                m.motivo.toLowerCase().includes(this.filterQuery.toLowerCase()))
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        return `
            <div class="waste-view fade-in">
                <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <button class="btn-icon-small" onclick="app.switchView('supplies')" style="background: white; border: 1px solid #e2e8f0; width: 40px; height: 40px;">
                            <i data-lucide="arrow-left"></i>
                        </button>
                        <div>
                            <h1 style="margin: 0; font-family: 'Playfair Display', serif;">Gestión de Mermas</h1>
                            <p style="color: var(--text-muted); margin-top: 4px;">Registra y supervisa pérdidas de inventario o desperdicios.</p>
                        </div>
                    </div>
                    <button class="btn-primary" onclick="wasteView.showWasteModal()" style="padding: 12px 24px; border-radius: 14px; font-weight: 700; display: flex; align-items: center; gap: 8px; background: #e11d48; border-color: #e11d48; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.2);">
                        <i data-lucide="plus-circle"></i> NUEVO REGISTRO
                    </button>
                </div>

                <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div class="stat-card" style="background: white; padding: 20px; border-radius: 20px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                        <span style="color: var(--text-muted); font-size: 0.9rem; font-weight: 500;">Mermas Hoy</span>
                        <h2 style="margin: 8px 0 0; font-size: 1.8rem; color: #e11d48;">${this.getTodayStats().count}</h2>
                    </div>
                    <div class="stat-card" style="background: white; padding: 20px; border-radius: 20px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                        <span style="color: var(--text-muted); font-size: 0.9rem; font-weight: 500;">Valor Estimado Hoy</span>
                        <h2 style="margin: 8px 0 0; font-size: 1.8rem; color: #64748b;">$${this.getTodayStats().value.toFixed(2)}</h2>
                    </div>
                </div>

                <div class="card" style="padding: 0; overflow: hidden; border-radius: 24px;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Insumo</th>
                                <th>Cantidad</th>
                                <th>Motivo</th>
                                <th>Costo Est.</th>
                                <th>Registrado por</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.map(m => `
                                <tr>
                                    <td style="font-weight: 600; color: #64748b;">${new Date(m.fecha).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                                    <td><span style="font-weight: 700; color: var(--primary);">${m.insumoNombre}</span></td>
                                    <td><span class="badge danger" style="font-weight: 800;">-${m.cantidad} ${m.unidad}</span></td>
                                    <td><span style="font-style: italic;">${m.motivo}</span></td>
                                    <td style="font-weight: 700;">$${(m.costoUnitario * m.cantidad).toFixed(2)}</td>
                                    <td><small style="color: #94a3b8;">${m.usuario || 'Admin'}</small></td>
                                </tr>
                            `).join('')}
                            ${filtered.length === 0 ? '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #94a3b8;">No hay mermas registradas.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    getTodayStats() {
        const today = new Date().toLocaleDateString();
        const todayMermas = this.mermas.filter(m => new Date(m.fecha).toLocaleDateString() === today);
        return {
            count: todayMermas.length,
            value: todayMermas.reduce((acc, m) => acc + (m.costoUnitario * m.cantidad), 0)
        };
    },

    bindEvents() {
        // No special global events for this view yet
    },

    async showWasteModal() {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        modalContent.innerHTML = `
            <div style="width: 480px; padding: 10px;">
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 30px;">
                    <div style="width: 55px; height: 55px; background: rgba(225, 29, 72, 0.1); border-radius: 18px; display: flex; align-items: center; justify-content: center; color: #e11d48; border: 1px solid rgba(225, 29, 72, 0.15);">
                        <i data-lucide="trash-2" style="width: 30px; height: 30px;"></i>
                    </div>
                    <div>
                        <h2 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 1.8rem; color: var(--primary);">Registrar Merma</h2>
                        <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">Registrar pérdida o desperdicio de inventario</p>
                    </div>
                </div>
                
                <form id="wasteForm" style="display: flex; flex-direction: column; gap: 20px;">
                    <div class="input-group">
                        <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #475569; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;">
                            <i data-lucide="package" style="width: 14px;"></i> Insumo / Producto afectado
                        </label>
                        <select id="wasteInsumoId" required class="large-input" style="width: 100%; border-radius: 14px; font-family: 'Outfit', sans-serif; cursor: pointer;">
                            <option value="">Seleccione un insumo...</option>
                            ${this.insumos.map(i => `<option value="${i.id}" data-unidad="${i.unidad}" data-precio="10">${i.nombre} (${i.stock} ${i.unidad} en stock)</option>`).join('')}
                        </select>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="input-group">
                            <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #475569; font-size: 0.85rem; text-transform: uppercase;">
                                <i data-lucide="binary" style="width: 14px;"></i> Cantidad
                            </label>
                            <div style="position: relative;">
                                <input type="number" id="wasteCantidad" placeholder="0.00" step="0.01" min="0.01" required 
                                       class="large-input" style="padding-right: 50px; font-weight: 700; width: 100%; border-radius: 14px;">
                                <span id="wasteUnidadLabel" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-weight: 700; font-size: 0.8rem;">-</span>
                            </div>
                        </div>

                        <div class="input-group">
                            <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #475569; font-size: 0.85rem; text-transform: uppercase;">
                                <i data-lucide="alert-circle" style="width: 14px;"></i> Motivo
                            </label>
                            <select id="wasteMotivo" required class="large-input" style="width: 100%; border-radius: 14px; font-family: 'Outfit', sans-serif; cursor: pointer;">
                                <option value="">Seleccione motivo...</option>
                                <option value="Caducidad">📅 Caducidad</option>
                                <option value="Derrame/Accidente">💥 Accidente</option>
                                <option value="Error Preparación">☕ Error Prep.</option>
                                <option value="Robo/Faltante">🔍 Faltante</option>
                                <option value="Otro">❓ Otro</option>
                            </select>
                        </div>
                    </div>

                    <div class="input-group">
                        <label style="display: flex; align-items: center; gap: 8px; font-weight: 700; color: #475569; font-size: 0.85rem; text-transform: uppercase;">
                            <i data-lucide="message-square" style="width: 14px;"></i> Notas adicionales
                        </label>
                        <textarea id="wasteNotas" placeholder="Detalles adicionales del incidente..." class="large-input" 
                                  style="height: 100px; resize: none; border-radius: 14px; padding: 14px; font-size: 0.95rem; line-height: 1.5;"></textarea>
                    </div>

                    <div style="display: flex; gap: 12px; margin-top: 15px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                        <button type="button" class="btn-secondary" onclick="document.getElementById('modalContainer').classList.add('hidden')" 
                                style="flex: 1; padding: 16px; border-radius: 14px; font-weight: 600; color: #64748b; background: #f8fafc; border-color: #e2e8f0;">
                            Cancelar
                        </button>
                        <button type="submit" class="btn-primary" 
                                style="flex: 2; padding: 16px; border-radius: 14px; background: #e11d48; border: none; font-weight: 800; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.25); display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <i data-lucide="check-circle" style="width: 20px;"></i> GUARDAR REGISTRO
                        </button>
                    </div>
                </form>
            </div>
        `;

        const selectInsumo = document.getElementById('wasteInsumoId');
        const unidadLabel = document.getElementById('wasteUnidadLabel');
        selectInsumo.onchange = (e) => {
            const opt = e.target.options[e.target.selectedIndex];
            unidadLabel.textContent = opt.dataset.unidad || '-';
        };

        document.getElementById('wasteForm').onsubmit = async (e) => {
            e.preventDefault();
            const insumoId = document.getElementById('wasteInsumoId').value;
            const cantidad = parseFloat(document.getElementById('wasteCantidad').value);
            const motivo = document.getElementById('wasteMotivo').value;
            const notas = document.getElementById('wasteNotas').value;

            const insumo = this.insumos.find(i => i.id === insumoId);
            if (!insumo) return;

            if (insumo.stock < cantidad) {
                app.showToast('No puedes mermar más del stock disponible', 'error');
                return;
            }

            const registro = {
                fecha: new Date().toISOString(),
                insumoId,
                insumoNombre: insumo.nombre,
                cantidad,
                unidad: insumo.unidad,
                motivo,
                notas,
                costoUnitario: 0, // En un sistema real vendría del costo de compra
                usuario: 'Administrador'
            };

            try {
                //Guardar registro de merma
                await db.addDocument('mermas', registro);

                //Descontar del inventario
                await db.updateDocument('insumos', insumoId, {
                    stock: insumo.stock - cantidad
                });

                app.showToast('Merma registrada y stock actualizado', 'success');
                modal.classList.add('hidden');
                app.renderView('waste');
            } catch (error) {
                console.error(error);
                app.showToast('Error al registrar merma', 'error');
            }
        };

        if (typeof lucide !== 'undefined') lucide.createIcons();
        modal.classList.remove('hidden');
        if (typeof audioService !== 'undefined') audioService.playPop();
    }
};
