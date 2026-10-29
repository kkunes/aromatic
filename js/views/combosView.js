/**
 * Combos View & Manager for Aromatic POS
 * Handles interactive Combo Builder, Smart Auto-Combo detection & Upsell,
 * Margin Protection Rules, Dynamic Combo Studio in Settings, and Stock Validation.
 */

const combosView = {
    currentSelection: {}, // Temporary selection state during Combo Builder modal: { [groupId]: { optionIndex, nota, extras } }
    activeCombo: null,
    editingIndex: null,
    upsellCartIndex: null,
    editorState: null,
    cachedProducts: [],
    cachedInsumos: [],

    // Preset quick notes for barista / kitchen efficiency
    QUICK_NOTES: {
        coffee: ['Deslactosada', 'Leche Almendra', 'Leche Avena', 'Sin Azúcar', 'Caliente', 'Poco Hielo', 'Descafeinado'],
        food: ['Calentar', 'Sin Calentar', 'Para Llevar', 'Extra Servilletas'],
        general: ['Para Llevar', 'Sin Azúcar', 'Bien Frío', 'Caliente']
    },

    // ==========================================
    // 1. INTERACTIVE COMBO BUILDER MODAL (POS)
    // ==========================================

    async openBuilder(comboId, editCartIndex = null, upsellCartIndex = null) {
        // Validate cash session first
        const sesiones = await db.getCollection('caja_sesiones');
        const activeSession = sesiones.find(s => !s.fechaCierre);
        if (!activeSession) {
            app.showToast('Debe abrir la caja antes de registrar productos o combos', 'warning');
            if (typeof audioService !== 'undefined') audioService.playError();
            return;
        }

        const combos = await db.getCollection('combos');
        const combo = combos.find(c => c.id === comboId);
        if (!combo) {
            app.showToast('Combo no encontrado', 'error');
            return;
        }

        // Commercial schedule validation (business rule)
        if (combo.horario && combo.horario.activo) {
            const now = new Date();
            const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const currentTime = now.getHours() * 100 + now.getMinutes();

            const days = combo.horario.dias || [];
            const matchesDay = days.length === 0 || days.includes('todos') || days.includes(currentDay);
            let matchesTime = true;
            if (combo.horario.horaInicio && combo.horario.horaFin) {
                const start = parseInt(combo.horario.horaInicio.replace(':', ''));
                const end = parseInt(combo.horario.horaFin.replace(':', ''));
                matchesTime = (currentTime >= start && currentTime <= end);
            }

            if (!matchesDay || !matchesTime) {
                const horarioTexto = `${combo.horario.horaInicio || '00:00'} a ${combo.horario.horaFin || '23:59'}`;
                const confirmed = await app.showConfirmModal({
                    title: 'Horario Restringido de Combo',
                    message: `El "${combo.nombre}" está configurado para venderse en horario de ${horarioTexto}. ¿Deseas autorizar la venta en este momento?`,
                    confirmText: 'Autorizar y Armar',
                    cancelText: 'Volver',
                    type: 'warning',
                    icon: 'clock'
                });
                if (!confirmed) return;
            }
        }

        this.activeCombo = combo;
        this.editingIndex = editCartIndex;
        this.upsellCartIndex = upsellCartIndex;
        this.currentSelection = {};

        const products = await db.getCollection('productos');
        const insumos = await db.getCollection('insumos');
        this.cachedProducts = products;
        this.cachedInsumos = insumos;

        // Pre-fill selection based on context
        if (editCartIndex !== null && app.cart[editCartIndex]) {
            // Case 1: Editing existing combo from cart
            const existingItem = app.cart[editCartIndex];
            if (existingItem.comboItems) {
                combo.grupos.forEach((grupo, gIdx) => {
                    const match = existingItem.comboItems.find(ci =>
                        grupo.opciones.some(o => o.idProducto === ci.idProducto || o.nombre.toLowerCase() === ci.nombre.toLowerCase())
                    ) || existingItem.comboItems[gIdx];

                    let optIdx = 0;
                    if (match) {
                        optIdx = grupo.opciones.findIndex(o =>
                            o.idProducto === match.idProducto ||
                            o.nombre.toLowerCase() === match.nombre.toLowerCase()
                        );
                        if (optIdx < 0) optIdx = 0;
                    }

                    this.currentSelection[grupo.id] = {
                        optionIndex: optIdx,
                        nota: match ? (match.nota || '') : '',
                        extras: match ? (match.extras || []) : []
                    };
                });
            }
        } else if (upsellCartIndex !== null && app.cart[upsellCartIndex]) {
            // Case 2: Upselling from a standalone product already in cart
            const standaloneItem = app.cart[upsellCartIndex];
            combo.grupos.forEach((grupo) => {
                const matchOptIdx = grupo.opciones.findIndex(o =>
                    o.idProducto === standaloneItem.id ||
                    o.nombre.toLowerCase() === standaloneItem.nombre.toLowerCase()
                );

                if (matchOptIdx >= 0) {
                    this.currentSelection[grupo.id] = {
                        optionIndex: matchOptIdx,
                        nota: standaloneItem.nota || '',
                        extras: standaloneItem.extras || []
                    };
                } else {
                    const defaultIdx = Math.max(0, grupo.opciones.findIndex(o => o.default));
                    this.currentSelection[grupo.id] = {
                        optionIndex: defaultIdx,
                        nota: '',
                        extras: []
                    };
                }
            });
        } else {
            // Case 3: Fresh combo addition - set defaults or first available option
            combo.grupos.forEach(grupo => {
                let defaultIdx = grupo.opciones.findIndex(o => o.default);
                if (defaultIdx < 0) defaultIdx = 0;

                // If default is out of stock, find first in-stock option
                const opt = grupo.opciones[defaultIdx];
                const prodRef = products.find(p => p.id === opt.idProducto || p.nombre.toLowerCase() === opt.nombre.toLowerCase());
                if (prodRef && !this.checkProductStock(prodRef, insumos).inStock) {
                    const availableIdx = grupo.opciones.findIndex(o => {
                        const p = products.find(pr => pr.id === o.idProducto || pr.nombre.toLowerCase() === o.nombre.toLowerCase());
                        return p && this.checkProductStock(p, insumos).inStock;
                    });
                    if (availableIdx >= 0) defaultIdx = availableIdx;
                }

                this.currentSelection[grupo.id] = {
                    optionIndex: defaultIdx,
                    nota: '',
                    extras: []
                };
            });
        }

        this.renderBuilderModal(products, insumos);
    },

    checkProductStock(product, insumos) {
        if (!product) return { inStock: true };
        const recipe = product.insumos || [];
        if (recipe.length === 0) return { inStock: true };

        for (const item of recipe) {
            const insumo = insumos.find(i => i.id === item.idInsumo);
            if (!insumo || (insumo.stock !== undefined && insumo.stock < item.cantidad)) {
                return {
                    inStock: false,
                    reason: insumo ? `Sin stock de ${insumo.nombre}` : 'Insumo no encontrado'
                };
            }
        }
        return { inStock: true };
    },

    renderBuilderModal(products, insumos) {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');
        const combo = this.activeCombo;
        const isEditing = this.editingIndex !== null;
        const isUpsell = this.upsellCartIndex !== null;

        modalContent.innerHTML = `
            <div class="combo-builder-modal fade-in">
                <!-- Modal Header -->
                <div class="combo-modal-header">
                    <div class="combo-header-info">
                        <div class="combo-badge-gold">
                            <i data-lucide="sparkles"></i> ${isUpsell ? 'UPSELL DE COMBO' : 'COMBO ESPECIAL'}
                        </div>
                        <h2>${combo.nombre}</h2>
                        <p class="combo-desc">${combo.descripcion || 'Arma tu combinación favorita con precio preferencial y margen garantizado.'}</p>
                    </div>
                    <button class="btn-close-modal" onclick="app.closeModal()">
                        <i data-lucide="x"></i>
                    </button>
                </div>

                <!-- Step Groups Container -->
                <div class="combo-groups-scroll hide-scrollbar">
                    ${combo.grupos.map((grupo, gIdx) => {
                        const currentSel = this.currentSelection[grupo.id] || { optionIndex: 0, nota: '' };
                        
                        // Select quick notes according to group icon / title
                        const isDrink = grupo.icono === 'coffee' || grupo.titulo.toLowerCase().includes('bebida') || grupo.titulo.toLowerCase().includes('café');
                        const isFood = grupo.icono === 'croissant' || grupo.titulo.toLowerCase().includes('repostería') || grupo.titulo.toLowerCase().includes('pan');
                        const quickPills = isDrink ? this.QUICK_NOTES.coffee : (isFood ? this.QUICK_NOTES.food : this.QUICK_NOTES.general);

                        return `
                            <div class="combo-group-section" data-group-id="${grupo.id}">
                                <div class="combo-group-header">
                                    <div class="combo-group-title">
                                        <div class="group-number-pill">${gIdx + 1}</div>
                                        <i data-lucide="${grupo.icono || 'check-circle'}" class="group-icon"></i>
                                        <span>${grupo.titulo}</span>
                                    </div>
                                    <span class="group-status-badge">
                                        <i data-lucide="check" style="width: 12px; height: 12px;"></i> ${grupo.cantidad || 1} Selección requerida
                                    </span>
                                </div>

                                <div class="combo-options-grid">
                                    ${grupo.opciones.map((opt, oIdx) => {
                                        const isSelected = currentSel.optionIndex === oIdx;
                                        const prodRef = products.find(p => 
                                            p.id === opt.idProducto || 
                                            p.nombre.toLowerCase() === opt.nombre.toLowerCase()
                                        );
                                        const stockStatus = this.checkProductStock(prodRef, insumos);
                                        const isOutOfStock = !stockStatus.inStock;
                                        const imgSrc = (prodRef && prodRef.imagen) || 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=200&h=200&fit=crop';
                                        const extraPrice = opt.precioExtra || 0;

                                        return `
                                            <div class="combo-option-card ${isSelected ? 'selected' : ''} ${isOutOfStock ? 'out-of-stock' : ''}" 
                                                 onclick="combosView.selectOption('${grupo.id}', ${oIdx}, ${isOutOfStock})"
                                                 title="${isOutOfStock ? stockStatus.reason : opt.nombre}">
                                                <div class="option-check-circle">
                                                    <i data-lucide="check"></i>
                                                </div>
                                                <img src="${imgSrc}" alt="${opt.nombre}" class="option-img" loading="lazy">
                                                <div class="option-details">
                                                    <div class="option-name">${opt.nombre}</div>
                                                    <div class="option-pricing">
                                                        ${isOutOfStock 
                                                            ? `<span class="out-of-stock-badge"><i data-lucide="alert-circle" style="width: 10px; height: 10px;"></i> Agotado</span>`
                                                            : (extraPrice > 0 
                                                                ? `<span class="upgrade-badge">+ $${extraPrice.toFixed(2)}</span>`
                                                                : `<span class="included-badge">Incluido</span>`
                                                            )
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>

                                <!-- Quick Note Pills for Fast Barista / Kitchen input -->
                                <div class="combo-quick-notes">
                                    ${quickPills.map(note => `
                                        <span class="quick-pill ${(currentSel.nota || '').includes(note) ? 'active' : ''}" 
                                              onclick="combosView.toggleQuickNote('${grupo.id}', '${note}')">
                                            +${note}
                                        </span>
                                    `).join('')}
                                </div>

                                <!-- Note for this item -->
                                <div class="combo-item-note-row">
                                    <div class="note-input-wrapper">
                                        <i data-lucide="message-square" style="width: 14px; height: 14px; color: var(--text-muted);"></i>
                                        <input type="text" 
                                               id="note_input_${grupo.id}"
                                               placeholder="Instrucciones especiales para este producto (ej: deslactosada, sin azúcar...)" 
                                               value="${currentSel.nota || ''}"
                                               oninput="combosView.updateNote('${grupo.id}', this.value)">
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- Footer Summary Bar -->
                <div class="combo-builder-footer">
                    <div class="combo-footer-breakdown">
                        <div class="breakdown-line">
                            <span class="breakdown-label">Precio Base del Combo:</span>
                            <span class="breakdown-val" id="comboBasePriceDisplay">$${combo.precioBase.toFixed(2)}</span>
                        </div>
                        <div class="breakdown-line upgrades-line" id="comboUpgradesLine" style="display: none;">
                            <span class="breakdown-label">Sobrecostos de Selección:</span>
                            <span class="breakdown-val" id="comboUpgradesDisplay">+$0.00</span>
                        </div>
                        ${combo.ahorroEstimado ? `
                            <div class="savings-pill">
                                <i data-lucide="tag" style="width: 13px; height: 13px;"></i>
                                Ahorro para el cliente: <strong>~$${combo.ahorroEstimado.toFixed(2)} MXN</strong>
                            </div>
                        ` : ''}
                    </div>

                    <div class="combo-footer-actions">
                        <div class="combo-total-box">
                            <span class="total-label">Total Combo</span>
                            <span class="total-amount" id="comboFinalTotalDisplay">$${combo.precioBase.toFixed(2)}</span>
                        </div>
                        <button class="btn-confirm-combo" onclick="combosView.confirmCombo()">
                            <i data-lucide="${isEditing ? 'check' : 'plus'}"></i>
                            <span>${isEditing ? 'Actualizar Combo' : (isUpsell ? 'Aplicar Upsell a la Orden' : 'Añadir Combo a la Orden')}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        modal.classList.remove('hidden');
        this.recalculateTotal();
    },

    selectOption(groupId, optionIndex, isOutOfStock = false) {
        if (isOutOfStock) {
            app.showToast('Esta opción está agotada por falta de insumos en cocina/barra', 'warning');
            if (typeof audioService !== 'undefined') audioService.playError();
            return;
        }

        if (!this.currentSelection[groupId]) {
            this.currentSelection[groupId] = { optionIndex, nota: '', extras: [] };
        } else {
            this.currentSelection[groupId].optionIndex = optionIndex;
        }

        if (typeof audioService !== 'undefined') audioService.playClick();

        // Update cards UI visually without full redraw
        const section = document.querySelector(`.combo-group-section[data-group-id="${groupId}"]`);
        if (section) {
            const cards = section.querySelectorAll('.combo-option-card');
            cards.forEach((card, idx) => {
                card.classList.toggle('selected', idx === optionIndex);
            });
        }

        this.recalculateTotal();
    },

    toggleQuickNote(groupId, noteText) {
        if (!this.currentSelection[groupId]) {
            this.currentSelection[groupId] = { optionIndex: 0, nota: '', extras: [] };
        }

        let current = (this.currentSelection[groupId].nota || '').trim();
        const parts = current ? current.split(',').map(p => p.trim()).filter(Boolean) : [];

        const existingIdx = parts.indexOf(noteText);
        if (existingIdx >= 0) {
            parts.splice(existingIdx, 1);
        } else {
            parts.push(noteText);
        }

        const newNote = parts.join(', ');
        this.currentSelection[groupId].nota = newNote;

        const inputEl = document.getElementById(`note_input_${groupId}`);
        if (inputEl) inputEl.value = newNote;

        // Toggle pill active class visually
        const section = document.querySelector(`.combo-group-section[data-group-id="${groupId}"]`);
        if (section) {
            const pills = section.querySelectorAll('.quick-pill');
            pills.forEach(pill => {
                if (pill.textContent.replace('+', '').trim() === noteText) {
                    pill.classList.toggle('active', existingIdx < 0);
                }
            });
        }

        if (typeof audioService !== 'undefined') audioService.playClick();
    },

    updateNote(groupId, noteText) {
        if (this.currentSelection[groupId]) {
            this.currentSelection[groupId].nota = noteText.trim();
        }
    },

    recalculateTotal() {
        if (!this.activeCombo) return;
        const combo = this.activeCombo;
        let upgradesSum = 0;

        combo.grupos.forEach(grupo => {
            const sel = this.currentSelection[grupo.id];
            if (sel && grupo.opciones[sel.optionIndex]) {
                const opt = grupo.opciones[sel.optionIndex];
                upgradesSum += (opt.precioExtra || 0);
            }
        });

        const finalTotal = combo.precioBase + upgradesSum;

        const baseEl = document.getElementById('comboBasePriceDisplay');
        const upgLine = document.getElementById('comboUpgradesLine');
        const upgEl = document.getElementById('comboUpgradesDisplay');
        const totEl = document.getElementById('comboFinalTotalDisplay');

        if (baseEl) baseEl.textContent = `$${combo.precioBase.toFixed(2)}`;
        if (upgLine && upgEl) {
            if (upgradesSum > 0) {
                upgLine.style.display = 'flex';
                upgEl.textContent = `+$${upgradesSum.toFixed(2)}`;
            } else {
                upgLine.style.display = 'none';
            }
        }
        if (totEl) totEl.textContent = `$${finalTotal.toFixed(2)}`;
    },

    async confirmCombo() {
        const combo = this.activeCombo;
        if (!combo) return;

        const products = await db.getCollection('productos');
        let upgradesSum = 0;
        const comboItems = [];

        // Validate each required group
        for (const grupo of combo.grupos) {
            const sel = this.currentSelection[grupo.id];
            if (grupo.requerido && (sel === undefined || sel.optionIndex === undefined)) {
                app.showToast(`Por favor selecciona una opción en "${grupo.titulo}"`, 'warning');
                return;
            }

            const opt = grupo.opciones[sel.optionIndex];
            const extraPrice = opt.precioExtra || 0;
            upgradesSum += extraPrice;

            // Find matching product
            const prodRef = products.find(p => 
                p.id === opt.idProducto || 
                p.nombre.toLowerCase() === opt.nombre.toLowerCase()
            );

            comboItems.push({
                idProducto: prodRef ? prodRef.id : (opt.idProducto || `opt_${Date.now()}`),
                nombre: opt.nombre,
                categoria: prodRef ? prodRef.categoria : 'General',
                precioRegular: prodRef ? prodRef.precio : combo.precioBase,
                precioExtra: extraPrice,
                insumos: prodRef && prodRef.insumos ? prodRef.insumos : [],
                nota: sel.nota || '',
                extras: sel.extras || [],
                omitted: []
            });
        }

        const finalUnitPrice = combo.precioBase + upgradesSum;
        const currentQty = (this.editingIndex !== null && app.cart[this.editingIndex]) 
            ? app.cart[this.editingIndex].quantity 
            : 1;

        const prospectiveItem = {
            id: (this.editingIndex !== null && app.cart[this.editingIndex]) 
                ? app.cart[this.editingIndex].id 
                : `combo_${combo.id}_${Date.now()}`,
            comboId: combo.id,
            nombre: combo.nombre,
            precio: finalUnitPrice,
            precioBase: combo.precioBase,
            upgradesTotal: upgradesSum,
            quantity: currentQty,
            isCombo: true,
            categoria: 'Combos',
            comboItems: comboItems
        };

        // Stock Validation for Combo items (properly handles Upsell replacement)
        const isUpsell = this.upsellCartIndex !== null && app.cart[this.upsellCartIndex] !== undefined;
        const targetIndex = this.editingIndex !== null ? this.editingIndex : (isUpsell ? this.upsellCartIndex : null);
        const canAdd = await app.validateStock(prospectiveItem, targetIndex, { isUpsell, upsellIndex: isUpsell ? this.upsellCartIndex : null });
        if (!canAdd) return;

        if (this.editingIndex !== null && app.cart[this.editingIndex]) {
            app.cart[this.editingIndex] = prospectiveItem;
            app.showToast(`Combo "${combo.nombre}" actualizado`, 'success');
            this.editingIndex = null;
        } else if (isUpsell && app.cart[this.upsellCartIndex]) {
            // Replace the upsold single item with the new combo
            const oldItem = app.cart[this.upsellCartIndex];
            if (oldItem.quantity > 1) {
                oldItem.quantity--;
            } else {
                app.cart.splice(this.upsellCartIndex, 1);
            }
            app.cart.push(prospectiveItem);
            app.showToast(`¡Upsell exitoso! Convertido a "${combo.nombre}"`, 'success');
            this.upsellCartIndex = null;
        } else {
            app.cart.push(prospectiveItem);
            app.showToast(`Combo "${combo.nombre}" añadido a la orden`, 'success');
        }

        if (typeof audioService !== 'undefined') audioService.playSuccess();
        app.closeModal();
        app.updateCartUI();
    },

    // ==========================================
    // 2. SMART AUTO-COMBO & PROACTIVE UPSELL
    // ==========================================

    /**
     * Inspects cart items to detect if individual items already form an active combo.
     */
    async findComboOpportunity(cart) {
        if (!cart || cart.length < 2) return null;

        const combos = await db.getCollection('combos');
        const activeCombos = (combos || []).filter(c => c.activo !== false);
        if (activeCombos.length === 0) return null;

        const eligibleIndices = [];
        cart.forEach((item, idx) => {
            if (!item.isCombo && item.quantity >= 1) {
                eligibleIndices.push(idx);
            }
        });

        if (eligibleIndices.length < 2) return null;

        for (const combo of activeCombos) {
            if (combo.grupos && combo.grupos.length === 2) {
                const g1 = combo.grupos[0];
                const g2 = combo.grupos[1];

                let matchIdx1 = null;
                let matchOpt1 = null;
                let matchIdx2 = null;
                let matchOpt2 = null;

                // Find match for group 1
                for (const idx of eligibleIndices) {
                    const item = cart[idx];
                    const opt = g1.opciones.find(o => 
                        o.nombre.toLowerCase() === item.nombre.toLowerCase() || 
                        o.idProducto === item.id
                    );
                    if (opt) {
                        matchIdx1 = idx;
                        matchOpt1 = opt;
                        break;
                    }
                }

                if (matchIdx1 !== null) {
                    for (const idx of eligibleIndices) {
                        if (idx === matchIdx1) continue;
                        const item = cart[idx];
                        const opt = g2.opciones.find(o => 
                            o.nombre.toLowerCase() === item.nombre.toLowerCase() || 
                            o.idProducto === item.id
                        );
                        if (opt) {
                            matchIdx2 = idx;
                            matchOpt2 = opt;
                            break;
                        }
                    }
                }

                if (matchIdx1 !== null && matchIdx2 !== null) {
                    const item1 = cart[matchIdx1];
                    const item2 = cart[matchIdx2];
                    const regularTotal = item1.precio + item2.precio;
                    const comboPrice = combo.precioBase + (matchOpt1.precioExtra || 0) + (matchOpt2.precioExtra || 0);
                    const savings = regularTotal - comboPrice;

                    if (savings > 0) {
                        return {
                            combo,
                            indices: [matchIdx1, matchIdx2],
                            items: [item1, item2],
                            opts: [matchOpt1, matchOpt2],
                            savings,
                            comboPrice
                        };
                    }
                }
            }
        }

        return null;
    },

    /**
     * Proactive Upsell Opportunity:
     * When customer orders a single item that can be completed into a combo,
     * suggests adding the missing piece for a small incremental cost.
     */
    async findUpsellOpportunity(cart) {
        if (!cart || cart.length === 0) return null;

        const standaloneItems = [];
        cart.forEach((item, idx) => {
            if (!item.isCombo && item.quantity >= 1) {
                standaloneItems.push({ item, idx });
            }
        });

        if (standaloneItems.length === 0) return null;

        const combos = await db.getCollection('combos');
        const activeCombos = (combos || []).filter(c => c.activo !== false);
        if (activeCombos.length === 0) return null;

        const products = await db.getCollection('productos');

        for (const { item, idx } of standaloneItems) {
            for (const combo of activeCombos) {
                if (!combo.grupos || combo.grupos.length < 2) continue;

                // Match with Group 0
                const optG0 = combo.grupos[0].opciones.find(o => 
                    o.idProducto === item.id || 
                    o.nombre.toLowerCase() === item.nombre.toLowerCase()
                );
                // Match with Group 1
                const optG1 = combo.grupos[1].opciones.find(o => 
                    o.idProducto === item.id || 
                    o.nombre.toLowerCase() === item.nombre.toLowerCase()
                );

                if (optG0 && !optG1) {
                    const missingGroup = combo.grupos[1];
                    const suggestedOpt = missingGroup.opciones.find(o => o.default) || missingGroup.opciones[0];
                    if (!suggestedOpt) continue;

                    const prodRef = products.find(p => p.id === suggestedOpt.idProducto || p.nombre.toLowerCase() === suggestedOpt.nombre.toLowerCase());
                    const regularPriceOpt = prodRef ? prodRef.precio : 35;
                    const addCost = Math.max(10, combo.precioBase - item.precio + (suggestedOpt.precioExtra || 0));
                    const savings = (item.precio + regularPriceOpt) - (combo.precioBase + (suggestedOpt.precioExtra || 0));

                    return {
                        combo,
                        cartIndex: idx,
                        cartItem: item,
                        missingGroupName: missingGroup.titulo.replace(/^(Paso \d+: |Elige tu )/i, ''),
                        suggestedOptionName: suggestedOpt.nombre,
                        addCost,
                        savings: Math.max(savings, combo.ahorroEstimado || 15)
                    };
                } else if (optG1 && !optG0) {
                    const missingGroup = combo.grupos[0];
                    const suggestedOpt = missingGroup.opciones.find(o => o.default) || missingGroup.opciones[0];
                    if (!suggestedOpt) continue;

                    const prodRef = products.find(p => p.id === suggestedOpt.idProducto || p.nombre.toLowerCase() === suggestedOpt.nombre.toLowerCase());
                    const regularPriceOpt = prodRef ? prodRef.precio : 45;
                    const addCost = Math.max(10, combo.precioBase - item.precio + (suggestedOpt.precioExtra || 0));
                    const savings = (item.precio + regularPriceOpt) - (combo.precioBase + (suggestedOpt.precioExtra || 0));

                    return {
                        combo,
                        cartIndex: idx,
                        cartItem: item,
                        missingGroupName: missingGroup.titulo.replace(/^(Paso \d+: |Elige tu )/i, ''),
                        suggestedOptionName: suggestedOpt.nombre,
                        addCost,
                        savings: Math.max(savings, combo.ahorroEstimado || 15)
                    };
                }
            }
        }

        return null;
    },

    renderOpportunityCard(opp) {
        return `
            <div class="smart-combo-suggestion-card fade-in">
                <div class="smart-combo-card-left">
                    <div class="smart-combo-badge-sparkle">
                        <i data-lucide="sparkles"></i>
                    </div>
                    <div class="smart-combo-info">
                        <div class="smart-combo-title-row">
                            <span class="smart-combo-title">¡Oportunidad de Combo!</span>
                            <span class="smart-combo-savings-tag">Ahorra $${opp.savings.toFixed(2)}</span>
                        </div>
                        <div class="smart-combo-text">
                            Une <strong>${opp.items[0].nombre} + ${opp.items[1].nombre}</strong> en <strong>"${opp.combo.nombre}"</strong>.
                        </div>
                    </div>
                </div>
                <button class="btn-smart-combo-convert" onclick="combosView.convertItemsToCombo('${opp.combo.id}', ${opp.indices[0]}, ${opp.indices[1]})">
                    <i data-lucide="zap"></i> Aplicar (-$${opp.savings.toFixed(0)})
                </button>
            </div>
        `;
    },

    renderUpsellBanner(upsell) {
        return `
            <div class="smart-combo-suggestion-card upsell-card fade-in">
                <div class="smart-combo-card-left">
                    <div class="smart-combo-badge-sparkle upsell-sparkle">
                        <i data-lucide="trending-up"></i>
                    </div>
                    <div class="smart-combo-info">
                        <div class="smart-combo-title-row">
                            <span class="smart-combo-title" style="color: #92400e;">💡 Sugerencia Upsell (+ Ticket)</span>
                            <span class="smart-combo-savings-tag" style="background: #ecfdf5; color: #047857; border-color: #a7f3d0;">
                                Ahorro cliente: ~$${upsell.savings.toFixed(0)} MXN
                            </span>
                        </div>
                        <div class="smart-combo-text">
                            Agrega <strong>${upsell.suggestedOptionName}</strong> por solo <strong>+$${upsell.addCost.toFixed(2)}</strong> con <strong>"${upsell.combo.nombre}"</strong>.
                        </div>
                    </div>
                </div>
                <button class="btn-smart-combo-convert btn-upsell" onclick="combosView.acceptUpsell('${upsell.combo.id}', ${upsell.cartIndex})">
                    <i data-lucide="sparkles"></i> Armar Combo
                </button>
            </div>
        `;
    },

    acceptUpsell(comboId, cartIndex) {
        this.openBuilder(comboId, null, cartIndex);
    },

    async convertItemsToCombo(comboId, idx1, idx2) {
        const combo = (await db.getCollection('combos')).find(c => c.id === comboId);
        if (!combo) return;

        const cart = app.cart;
        const item1 = cart[idx1];
        const item2 = cart[idx2];
        if (!item1 || !item2) return;

        const products = await db.getCollection('productos');
        const prod1 = products.find(p => p.id === item1.id || p.nombre.toLowerCase() === item1.nombre.toLowerCase());
        const prod2 = products.find(p => p.id === item2.id || p.nombre.toLowerCase() === item2.nombre.toLowerCase());

        const opt1 = combo.grupos[0]?.opciones.find(o => o.nombre.toLowerCase() === item1.nombre.toLowerCase()) || {};
        const opt2 = combo.grupos[1]?.opciones.find(o => o.nombre.toLowerCase() === item2.nombre.toLowerCase()) || {};
        const upgrades = (opt1.precioExtra || 0) + (opt2.precioExtra || 0);
        const finalPrice = combo.precioBase + upgrades;

        const comboItem = {
            id: `combo_${combo.id}_${Date.now()}`,
            comboId: combo.id,
            nombre: combo.nombre,
            precio: finalPrice,
            precioBase: combo.precioBase,
            upgradesTotal: upgrades,
            quantity: 1,
            isCombo: true,
            categoria: 'Combos',
            comboItems: [
                {
                    idProducto: prod1 ? prod1.id : item1.id,
                    nombre: item1.nombre,
                    categoria: prod1 ? prod1.categoria : item1.categoria,
                    precioRegular: item1.precio,
                    precioExtra: opt1.precioExtra || 0,
                    insumos: prod1 && prod1.insumos ? prod1.insumos : (item1.insumos || []),
                    nota: item1.nota || '',
                    extras: item1.extras || [],
                    omitted: item1.omitted || []
                },
                {
                    idProducto: prod2 ? prod2.id : item2.id,
                    nombre: item2.nombre,
                    categoria: prod2 ? prod2.categoria : item2.categoria,
                    precioRegular: item2.precio,
                    precioExtra: opt2.precioExtra || 0,
                    insumos: prod2 && prod2.insumos ? prod2.insumos : (item2.insumos || []),
                    nota: item2.nota || '',
                    extras: item2.extras || [],
                    omitted: item2.omitted || []
                }
            ]
        };

        if (item1.quantity > 1) {
            item1.quantity--;
        } else {
            cart.splice(idx1, 1);
        }

        const adjustedIdx2 = (item1.quantity === 1 && idx1 < idx2) ? idx2 - 1 : idx2;
        const targetItem2 = cart[adjustedIdx2];
        if (targetItem2) {
            if (targetItem2.quantity > 1) {
                targetItem2.quantity--;
            } else {
                cart.splice(adjustedIdx2, 1);
            }
        }

        cart.push(comboItem);

        if (typeof audioService !== 'undefined') audioService.playSuccess();
        app.showToast(`¡Combo "${combo.nombre}" aplicado con éxito!`, 'success');
        app.updateCartUI();
    },

    // ==========================================
    // 3. COMBO MANAGEMENT IN SETTINGS (STUDIO)
    // ==========================================

    async renderSettingsCombos() {
        const combos = await db.getCollection('combos');
        const activeCount = combos.filter(c => c.activo !== false).length;

        return `
            <div class="settings-container fade-in">
                <div class="view-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <button class="btn-icon-small" onclick="settingsView.switchSubView('menu')">
                            <i data-lucide="arrow-left"></i>
                        </button>
                        <div>
                            <h1 style="font-family: 'Playfair Display', serif; font-size: 2.2rem; margin: 0; color: var(--primary);">Combos y Paquetes de Venta</h1>
                            <p style="color: var(--text-muted); margin-top: 4px;">Configura paquetes con precio especial, reglas de margen y horarios comerciales.</p>
                        </div>
                    </div>
                    
                    <button class="btn-primary" onclick="combosView.showComboEditorModal()" style="display: flex; align-items: center; gap: 10px; padding: 14px 24px; border-radius: 14px; font-weight: 700; box-shadow: 0 4px 15px rgba(75, 54, 33, 0.15);">
                        <i data-lucide="plus-circle"></i> NUEVO COMBO
                    </button>
                </div>

                <!-- Metrics Overview -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 30px;">
                    <div class="stat-card-premium" style="background: white; padding: 20px; border-radius: 18px; border: 1px solid #f1f5f9;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <div style="width: 38px; height: 38px; background: rgba(75, 54, 33, 0.08); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
                                <i data-lucide="layers" style="width: 20px;"></i>
                            </div>
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total de Paquetes</span>
                        </div>
                        <div style="font-size: 2rem; font-weight: 800; color: var(--primary);">${combos.length}</div>
                    </div>

                    <div class="stat-card-premium" style="background: white; padding: 20px; border-radius: 18px; border: 1px solid #f1f5f9;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <div style="width: 38px; height: 38px; background: #f0fdf4; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #16a34a;">
                                <i data-lucide="check-circle" style="width: 20px;"></i>
                            </div>
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Combos Activos</span>
                        </div>
                        <div style="font-size: 2rem; font-weight: 800; color: #16a34a;">${activeCount}</div>
                    </div>

                    <div class="stat-card-premium" style="background: white; padding: 20px; border-radius: 18px; border: 1px solid #f1f5f9;">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <div style="width: 38px; height: 38px; background: rgba(226, 150, 93, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--accent);">
                                <i data-lucide="sparkles" style="width: 20px;"></i>
                            </div>
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Reglas de Negocio</span>
                        </div>
                        <div style="font-size: 1rem; font-weight: 700; color: var(--accent); margin-top: 6px;">Margen & Insumos protegidos</div>
                    </div>
                </div>

                <!-- Combos Grid -->
                <div class="combos-admin-grid">
                    ${combos.map(combo => {
                        const isPaused = combo.activo === false;
                        const includedSummary = (combo.grupos || []).map(g => `${g.cantidad || 1}x ${g.titulo.replace(/^(Paso \d+: |Elige tu )/i, '')}`).join(' + ');
                        return `
                            <div class="combo-admin-card card ${isPaused ? 'paused' : ''}">
                                <div class="combo-admin-header">
                                    <div class="combo-img-wrap">
                                        <img src="${combo.imagen || 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=200&h=200&fit=crop'}" alt="${combo.nombre}">
                                        <div class="combo-price-pill">$${combo.precioBase.toFixed(2)}</div>
                                    </div>
                                    <div class="combo-title-area">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span class="badge ${!isPaused ? 'success' : 'secondary'}">
                                                ${!isPaused ? 'VIGENTE' : 'PAUSADO'}
                                            </span>
                                            <label class="switch" title="Activar/Pausar">
                                                <input type="checkbox" ${!isPaused ? 'checked' : ''} onchange="combosView.toggleComboActive('${combo.id}', this.checked)">
                                                <span class="slider round"></span>
                                            </label>
                                        </div>
                                        <h3>${combo.nombre}</h3>
                                        <p class="admin-desc">${combo.descripcion || 'Sin descripción'}</p>
                                    </div>
                                </div>

                                <div class="combo-admin-body">
                                    <div class="admin-detail-row">
                                        <i data-lucide="layers" style="width: 14px;"></i>
                                        <span><strong>Estructura:</strong> ${includedSummary || 'Sin pasos'}</span>
                                    </div>
                                    <div class="admin-detail-row">
                                        <i data-lucide="clock" style="width: 14px;"></i>
                                        <span><strong>Horario:</strong> ${combo.horario && combo.horario.activo ? `${combo.horario.horaInicio} - ${combo.horario.horaFin}` : 'Disponible Todo el Día'}</span>
                                    </div>
                                    ${combo.ahorroEstimado ? `
                                        <div class="admin-detail-row savings">
                                            <i data-lucide="tag" style="width: 14px;"></i>
                                            <span>Ahorro del cliente: <strong>~$${combo.ahorroEstimado.toFixed(2)}</strong></span>
                                        </div>
                                    ` : ''}
                                </div>

                                <div class="combo-admin-footer">
                                    <button class="btn-secondary btn-small" onclick="combosView.showComboEditorModal('${combo.id}')">
                                        <i data-lucide="edit-3"></i> Editar Reglas
                                    </button>
                                    <button class="btn-icon-small danger" onclick="combosView.deleteCombo('${combo.id}')" title="Eliminar Combo">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                    ${combos.length === 0 ? `
                        <div class="empty-combos-msg" style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: white; border-radius: 20px; border: 2px dashed #e2e8f0;">
                            <i data-lucide="layers" style="width: 48px; height: 48px; color: #94a3b8; margin-bottom: 12px;"></i>
                            <h3 style="color: var(--primary);">No tienes combos registrados</h3>
                            <p style="color: var(--text-muted); max-width: 400px; margin: 8px auto 20px;">Crea tu primer paquete de venta para incrementar el ticket promedio de tu negocio.</p>
                            <button class="btn-primary" onclick="combosView.showComboEditorModal()">+ Crear Combo Ahora</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    async toggleComboActive(comboId, isActive) {
        await db.updateDocument('combos', comboId, { activo: isActive });
        app.showToast(isActive ? 'Combo activado' : 'Combo pausado', 'info');
        app.renderView('settings');
    },

    async deleteCombo(comboId) {
        const confirmed = await app.showConfirmModal({
            title: '¿Eliminar Combo?',
            message: '¿Estás seguro de que deseas eliminar este combo? Los clientes no podrán adquirirlo en el punto de venta.',
            confirmText: 'Sí, eliminar',
            cancelText: 'Cancelar',
            type: 'danger',
            icon: 'trash-2'
        });

        if (!confirmed) return;

        await db.deleteDocument('combos', comboId);
        app.showToast('Combo eliminado', 'success');
        app.renderView('settings');
    },

    // ==========================================
    // 4. DYNAMIC COMBO STUDIO EDITOR (FULL CRUD)
    // ==========================================

    async showComboEditorModal(comboId = null) {
        const combos = await db.getCollection('combos');
        const combo = comboId ? combos.find(c => c.id === comboId) : null;
        const products = await db.getCollection('productos');
        const insumos = await db.getCollection('insumos');

        this.cachedProducts = products;
        this.cachedInsumos = insumos;

        this.editorState = {
            id: comboId,
            nombre: combo ? combo.nombre : '',
            descripcion: combo ? combo.descripcion : '',
            precioBase: combo ? combo.precioBase : 85,
            ahorroEstimado: combo ? (combo.ahorroEstimado || 15) : 15,
            imagen: combo ? combo.imagen : 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=400&h=400&fit=crop',
            activo: combo ? combo.activo !== false : true,
            horario: (combo && combo.horario) ? JSON.parse(JSON.stringify(combo.horario)) : {
                activo: false,
                horaInicio: '07:00',
                horaFin: '13:00',
                dias: ['todos']
            },
            grupos: (combo && combo.grupos) ? JSON.parse(JSON.stringify(combo.grupos)) : [
                {
                    id: 'g_1',
                    titulo: 'Paso 1: Elige tu Bebida',
                    icono: 'coffee',
                    cantidad: 1,
                    requerido: true,
                    opciones: [
                        { idProducto: (products[0] && products[0].id) || '', nombre: (products[0] && products[0].nombre) || 'Café del Día', precioExtra: 0, default: true }
                    ]
                },
                {
                    id: 'g_2',
                    titulo: 'Paso 2: Elige tu Repostería',
                    icono: 'croissant',
                    cantidad: 1,
                    requerido: true,
                    opciones: [
                        { idProducto: (products[1] && products[1].id) || '', nombre: (products[1] && products[1].nombre) || 'Pan de la Casa', precioExtra: 0, default: true }
                    ]
                }
            ]
        };

        this.renderEditorModal();
    },

    renderEditorModal() {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');
        const isEdit = !!this.editorState.id;
        const state = this.editorState;
        const products = this.cachedProducts;

        // Margin calculation in live editor
        const marginInfo = this.calculateProfitMargin();

        const diasList = [
            { id: 'monday', label: 'Lun' },
            { id: 'tuesday', label: 'Mar' },
            { id: 'wednesday', label: 'Mié' },
            { id: 'thursday', label: 'Jue' },
            { id: 'friday', label: 'Vie' },
            { id: 'saturday', label: 'Sáb' },
            { id: 'sunday', label: 'Dom' }
        ];

        modalContent.innerHTML = `
            <div class="combo-editor-modal" style="width: 760px; max-height: 88vh; display: flex; flex-direction: column;">
                <div class="editor-header" style="padding: 20px 25px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 42px; height: 42px; background: rgba(226, 150, 93, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--accent);">
                            <i data-lucide="sparkles" style="width: 22px;"></i>
                        </div>
                        <div>
                            <h2 style="font-family: 'Playfair Display', serif; font-size: 1.6rem; margin: 0; color: var(--primary);">
                                ${isEdit ? 'Editar Combo de Venta' : 'Crear Nuevo Combo de Venta'}
                            </h2>
                            <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">Define pasos interactivos, sobrecostos y protege tu margen de utilidad.</p>
                        </div>
                    </div>
                    <button class="btn-icon" onclick="app.closeModal()">
                        <i data-lucide="x"></i>
                    </button>
                </div>

                <form id="comboEditorForm" onsubmit="combosView.saveComboFromStudio(event)" style="overflow-y: auto; padding: 25px; flex: 1;" class="hide-scrollbar">
                    
                    <!-- Business Rules: Margin & Cost Intelligence Card -->
                    <div class="combo-margin-calculator" style="background: linear-gradient(135deg, #fdfbf7 0%, #f7f3ee 100%); border: 1.5px solid #ebd9c8; border-radius: 16px; padding: 16px 20px; margin-bottom: 22px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="shield-check" style="width: 18px; color: var(--accent);"></i>
                                <span style="font-weight: 700; font-size: 0.9rem; color: var(--primary);">Inteligencia de Rentabilidad & Margen</span>
                            </div>
                            <span class="margin-badge ${marginInfo.badgeClass}" style="font-size: 0.75rem; font-weight: 800; padding: 3px 10px; border-radius: 12px;">
                                ${marginInfo.badgeText}
                            </span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; text-align: center;">
                            <div style="background: white; padding: 10px; border-radius: 12px; border: 1px solid #f1f5f9;">
                                <small style="color: #64748b; font-size: 0.7rem; font-weight: 700; display: block; text-transform: uppercase;">Costo Insumos</small>
                                <span style="font-size: 1.15rem; font-weight: 800; color: #64748b;" id="liveCostDisplay">$${marginInfo.costoTotal.toFixed(2)}</span>
                            </div>
                            <div style="background: white; padding: 10px; border-radius: 12px; border: 1px solid #f1f5f9;">
                                <small style="color: #64748b; font-size: 0.7rem; font-weight: 700; display: block; text-transform: uppercase;">Precio Venta</small>
                                <span style="font-size: 1.15rem; font-weight: 800; color: var(--primary);" id="livePriceDisplay">$${state.precioBase.toFixed(2)}</span>
                            </div>
                            <div style="background: white; padding: 10px; border-radius: 12px; border: 1px solid #f1f5f9;">
                                <small style="color: #64748b; font-size: 0.7rem; font-weight: 700; display: block; text-transform: uppercase;">Utilidad Bruta</small>
                                <span style="font-size: 1.15rem; font-weight: 800; color: #16a34a;" id="liveProfitDisplay">$${marginInfo.profit.toFixed(2)}</span>
                            </div>
                            <div style="background: white; padding: 10px; border-radius: 12px; border: 1px solid #f1f5f9;">
                                <small style="color: #64748b; font-size: 0.7rem; font-weight: 700; display: block; text-transform: uppercase;">Margen Real</small>
                                <span style="font-size: 1.15rem; font-weight: 800; color: ${marginInfo.marginColor};" id="liveMarginDisplay">${marginInfo.marginPct.toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>

                    <!-- General Details -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                        <div class="input-group" style="grid-column: span 2;">
                            <label style="font-weight: 700; font-size: 0.85rem;">Nombre Comercial del Combo</label>
                            <input type="text" id="ceNombre" value="${state.nombre}" required class="large-input" placeholder="Ej: Combo Desayuno Aromatic" oninput="combosView.editorState.nombre = this.value">
                        </div>

                        <div class="input-group" style="grid-column: span 2;">
                            <label style="font-weight: 700; font-size: 0.85rem;">Descripción Corta / Atractivo Comercial</label>
                            <input type="text" id="ceDesc" value="${state.descripcion}" class="large-input" placeholder="Ej: 1 Bebida a elección + 1 Repostería horneada con precio especial" oninput="combosView.editorState.descripcion = this.value">
                        </div>

                        <div class="input-group">
                            <label style="font-weight: 700; font-size: 0.85rem;">Precio Base del Combo ($)</label>
                            <input type="number" id="cePrecioBase" value="${state.precioBase}" step="0.5" required class="large-input" style="font-weight: 800; font-size: 1.2rem; color: var(--primary);" oninput="combosView.onBasePriceChange(this.value)">
                        </div>

                        <div class="input-group">
                            <label style="font-weight: 700; font-size: 0.85rem;">Ahorro Estimado del Cliente ($)</label>
                            <input type="number" id="ceAhorro" value="${state.ahorroEstimado}" step="1" class="large-input" oninput="combosView.editorState.ahorroEstimado = parseFloat(this.value) || 0">
                        </div>

                        <div class="input-group" style="grid-column: span 2;">
                            <label style="font-weight: 700; font-size: 0.85rem;">URL de Imagen del Combo</label>
                            <input type="text" id="ceImagen" value="${state.imagen}" class="large-input" placeholder="https://..." oninput="combosView.editorState.imagen = this.value">
                        </div>
                    </div>

                    <!-- Horarios & Días Comerciales -->
                    <div style="background: #f8fafc; border-radius: 16px; padding: 18px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <i data-lucide="clock" style="width: 18px; color: var(--primary);"></i>
                                <span style="font-weight: 700; font-size: 0.95rem; color: var(--primary);">Restricción de Horario Comercial (Opcional)</span>
                            </div>
                            <label class="switch">
                                <input type="checkbox" id="ceHorarioActivo" ${state.horario && state.horario.activo ? 'checked' : ''} onchange="combosView.toggleEditorSchedule(this.checked)">
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0 0 12px 0;">Aplica solo en los días y horarios que convengan a la operación (ej: combos matutinos).</p>
                        
                        <div id="ceHorarioDetails" style="display: ${state.horario && state.horario.activo ? 'flex' : 'none'}; flex-direction: column; gap: 14px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div class="input-group">
                                    <label style="font-size: 0.8rem; font-weight: 600;">Hora Inicio</label>
                                    <input type="time" id="ceHoraInicio" value="${state.horario.horaInicio || '07:00'}" class="large-input" onchange="combosView.editorState.horario.horaInicio = this.value">
                                </div>
                                <div class="input-group">
                                    <label style="font-size: 0.8rem; font-weight: 600;">Hora Fin</label>
                                    <input type="time" id="ceHoraFin" value="${state.horario.horaFin || '13:00'}" class="large-input" onchange="combosView.editorState.horario.horaFin = this.value">
                                </div>
                            </div>

                            <div>
                                <label style="font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 6px;">Días Disponibles:</label>
                                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                    ${diasList.map(d => {
                                        const isSelected = (state.horario.dias || []).includes('todos') || (state.horario.dias || []).includes(d.id);
                                        return `
                                            <button type="button" 
                                                    class="day-pill ${isSelected ? 'active' : ''}" 
                                                    onclick="combosView.toggleEditorDay('${d.id}')"
                                                    style="padding: 6px 12px; border-radius: 8px; border: 1px solid ${isSelected ? 'var(--accent)' : '#e2e8f0'}; background: ${isSelected ? 'var(--accent)' : 'white'}; color: ${isSelected ? 'white' : '#64748b'}; font-weight: 700; font-size: 0.78rem; cursor: pointer;">
                                                ${d.label}
                                            </button>
                                        `;
                                    }).join('')}
                                    <button type="button" 
                                            class="day-pill ${(state.horario.dias || []).includes('todos') ? 'active' : ''}" 
                                            onclick="combosView.toggleEditorDay('todos')"
                                            style="padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0; background: ${(state.horario.dias || []).includes('todos') ? 'var(--primary)' : 'white'}; color: ${(state.horario.dias || []).includes('todos') ? 'white' : '#64748b'}; font-weight: 700; font-size: 0.78rem; cursor: pointer;">
                                        Todos los días
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Steps / Groups Container -->
                    <div style="margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <div>
                                <h3 style="font-size: 1.15rem; color: var(--primary); margin: 0; font-family: 'Playfair Display', serif;">Pasos de Selección del Combo</h3>
                                <p style="font-size: 0.82rem; color: var(--text-muted); margin: 2px 0 0;">Cada paso representa un producto a elegir (ej: Paso 1: Café, Paso 2: Panadería).</p>
                            </div>
                            <button type="button" class="btn-secondary btn-small" onclick="combosView.editorAddGroup()" style="font-weight: 700; display: flex; align-items: center; gap: 6px;">
                                <i data-lucide="plus"></i> AÑADIR PASO
                            </button>
                        </div>

                        <div id="ceGruposContainer" style="display: flex; flex-direction: column; gap: 16px;">
                            ${state.grupos.map((g, gIdx) => `
                                <div class="card ce-group-card" style="padding: 16px; background: white; border: 1.5px solid #e2e8f0; border-radius: 14px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                        <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                                            <span style="background: var(--primary); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 0.78rem; font-weight: 800;">${gIdx + 1}</span>
                                            <input type="text" class="ce-group-title large-input" value="${g.titulo}" style="font-weight: 700; width: 280px; padding: 6px 10px; font-size: 0.9rem;" oninput="combosView.editorUpdateGroupTitle(${gIdx}, this.value)">
                                            <select class="large-input" style="padding: 6px 10px; font-size: 0.82rem; width: 120px;" onchange="combosView.editorUpdateGroupIcon(${gIdx}, this.value)">
                                                <option value="coffee" ${g.icono === 'coffee' ? 'selected' : ''}>☕ Café</option>
                                                <option value="croissant" ${g.icono === 'croissant' ? 'selected' : ''}>🥐 Repostería</option>
                                                <option value="sandwich" ${g.icono === 'sandwich' ? 'selected' : ''}>🥪 Sandwich</option>
                                                <option value="cake" ${g.icono === 'cake' ? 'selected' : ''}>🍰 Pastel</option>
                                                <option value="cup-soda" ${g.icono === 'cup-soda' ? 'selected' : ''}>🥤 Bebida Fría</option>
                                                <option value="sparkles" ${g.icono === 'sparkles' ? 'selected' : ''}>✨ Especial</option>
                                            </select>
                                        </div>
                                        ${state.grupos.length > 1 ? `
                                            <button type="button" class="btn-icon-small danger" onclick="combosView.editorRemoveGroup(${gIdx})" title="Eliminar este paso">
                                                <i data-lucide="trash-2"></i>
                                            </button>
                                        ` : ''}
                                    </div>

                                    <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                                        <span>Productos elegibles y sobrecostos (+Upgrade):</span>
                                        <button type="button" class="btn-text" style="font-size: 0.78rem; color: var(--accent); font-weight: 700; cursor: pointer;" onclick="combosView.editorAddOption(${gIdx})">
                                            + Agregar Producto
                                        </button>
                                    </div>

                                    <div class="ce-options-list" style="display: flex; flex-direction: column; gap: 8px;">
                                        ${g.opciones.map((opt, oIdx) => `
                                            <div style="display: flex; align-items: center; gap: 10px; background: #f8fafc; padding: 8px 12px; border-radius: 10px;">
                                                <select class="large-input" style="flex: 2; padding: 6px 10px; font-size: 0.85rem;" onchange="combosView.editorUpdateOptionProduct(${gIdx}, ${oIdx}, this.value)">
                                                    ${products.map(p => `
                                                        <option value="${p.id}" ${(p.id === opt.idProducto || p.nombre.toLowerCase() === opt.nombre.toLowerCase()) ? 'selected' : ''}>
                                                            ${p.nombre} ($${p.precio.toFixed(2)})
                                                        </option>
                                                    `).join('')}
                                                </select>
                                                
                                                <div style="display: flex; align-items: center; gap: 6px; flex: 1;">
                                                    <span style="font-size: 0.75rem; color: var(--text-muted); white-space: nowrap;">Sobrecosto ($):</span>
                                                    <input type="number" class="large-input" value="${opt.precioExtra || 0}" step="1" style="padding: 6px; font-size: 0.85rem; width: 70px;" oninput="combosView.editorUpdateOptionExtra(${gIdx}, ${oIdx}, this.value)">
                                                </div>

                                                <label style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: var(--text-muted); cursor: pointer;" title="Marcar como predeterminado en este grupo">
                                                    <input type="radio" name="default_opt_${gIdx}" ${opt.default ? 'checked' : ''} onchange="combosView.editorSetDefaultOption(${gIdx}, ${oIdx})">
                                                    Default
                                                </label>

                                                ${g.opciones.length > 1 ? `
                                                    <button type="button" class="btn-icon-small danger" onclick="combosView.editorRemoveOption(${gIdx}, ${oIdx})" title="Quitar opción">
                                                        <i data-lucide="x"></i>
                                                    </button>
                                                ` : ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div style="display: flex; gap: 12px; padding-top: 15px; border-top: 1px solid #f1f5f9;">
                        <button type="button" class="btn-secondary" onclick="app.closeModal()" style="flex: 1; padding: 14px;">Cancelar</button>
                        <button type="submit" class="btn-primary" style="flex: 2; padding: 14px; font-weight: 800;">
                            ${isEdit ? 'GUARDAR REGLAS DEL COMBO' : 'CREAR COMBO COMERCIAL'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        modal.classList.remove('hidden');
    },

    calculateProfitMargin() {
        const state = this.editorState;
        const products = this.cachedProducts;
        const insumos = this.cachedInsumos;
        let costoTotal = 0;

        if (state && state.grupos) {
            state.grupos.forEach(g => {
                const opt = g.opciones.find(o => o.default) || g.opciones[0];
                if (opt) {
                    const prod = products.find(p => p.id === opt.idProducto || p.nombre.toLowerCase() === opt.nombre.toLowerCase());
                    if (prod && prod.insumos) {
                        prod.insumos.forEach(recipeItem => {
                            const insumo = insumos.find(i => i.id === recipeItem.idInsumo);
                            const costUnit = (insumo && insumo.costoUnitario) ? insumo.costoUnitario : 0;
                            costoTotal += (recipeItem.cantidad * costUnit);
                        });
                    }
                }
            });
        }

        const precioBase = state ? state.precioBase : 85;
        const profit = Math.max(0, precioBase - costoTotal);
        const marginPct = precioBase > 0 ? (profit / precioBase) * 100 : 0;

        let badgeClass = 'badge-success';
        let badgeText = 'Margen Óptimo (>60%)';
        let marginColor = '#16a34a';

        if (marginPct < 40) {
            badgeClass = 'badge-danger';
            badgeText = 'Margen Bajo (<40%)';
            marginColor = '#dc2626';
        } else if (marginPct < 60) {
            badgeClass = 'badge-warning';
            badgeText = 'Margen Aceptable (40-60%)';
            marginColor = '#d97706';
        }

        return {
            costoTotal,
            profit,
            marginPct,
            badgeClass,
            badgeText,
            marginColor
        };
    },

    onBasePriceChange(val) {
        this.editorState.precioBase = parseFloat(val) || 0;
        const margin = this.calculateProfitMargin();
        const costEl = document.getElementById('liveCostDisplay');
        const priceEl = document.getElementById('livePriceDisplay');
        const profitEl = document.getElementById('liveProfitDisplay');
        const marginEl = document.getElementById('liveMarginDisplay');

        if (costEl) costEl.textContent = `$${margin.costoTotal.toFixed(2)}`;
        if (priceEl) priceEl.textContent = `$${this.editorState.precioBase.toFixed(2)}`;
        if (profitEl) profitEl.textContent = `$${margin.profit.toFixed(2)}`;
        if (marginEl) {
            marginEl.textContent = `${margin.marginPct.toFixed(1)}%`;
            marginEl.style.color = margin.marginColor;
        }
    },

    toggleEditorSchedule(checked) {
        this.editorState.horario.activo = checked;
        const detailsEl = document.getElementById('ceHorarioDetails');
        if (detailsEl) detailsEl.style.display = checked ? 'flex' : 'none';
    },

    toggleEditorDay(day) {
        if (!this.editorState.horario.dias) this.editorState.horario.dias = [];
        let dias = this.editorState.horario.dias;

        if (day === 'todos') {
            this.editorState.horario.dias = ['todos'];
        } else {
            dias = dias.filter(d => d !== 'todos');
            const idx = dias.indexOf(day);
            if (idx >= 0) {
                dias.splice(idx, 1);
            } else {
                dias.push(day);
            }
            if (dias.length === 0) dias = ['todos'];
            this.editorState.horario.dias = dias;
        }

        this.renderEditorModal();
    },

    editorAddGroup() {
        const nextIdx = this.editorState.grupos.length + 1;
        const defaultProd = this.cachedProducts[0] || { id: 'p_def', nombre: 'Producto ' + nextIdx };
        this.editorState.grupos.push({
            id: 'g_' + Date.now(),
            titulo: `Paso ${nextIdx}: Selecciona tu producto`,
            icono: 'sparkles',
            cantidad: 1,
            requerido: true,
            opciones: [
                { idProducto: defaultProd.id, nombre: defaultProd.nombre, precioExtra: 0, default: true }
            ]
        });
        this.renderEditorModal();
    },

    editorRemoveGroup(gIdx) {
        if (this.editorState.grupos.length <= 1) return;
        this.editorState.grupos.splice(gIdx, 1);
        this.renderEditorModal();
    },

    editorUpdateGroupTitle(gIdx, title) {
        if (this.editorState.grupos[gIdx]) {
            this.editorState.grupos[gIdx].titulo = title;
        }
    },

    editorUpdateGroupIcon(gIdx, icon) {
        if (this.editorState.grupos[gIdx]) {
            this.editorState.grupos[gIdx].icono = icon;
        }
    },

    editorAddOption(gIdx) {
        const grupo = this.editorState.grupos[gIdx];
        if (!grupo) return;
        const defaultProd = this.cachedProducts[grupo.opciones.length % this.cachedProducts.length] || { id: '', nombre: 'Nuevo Producto' };
        grupo.opciones.push({
            idProducto: defaultProd.id,
            nombre: defaultProd.nombre,
            precioExtra: 0,
            default: false
        });
        this.renderEditorModal();
    },

    editorRemoveOption(gIdx, oIdx) {
        const grupo = this.editorState.grupos[gIdx];
        if (!grupo || grupo.opciones.length <= 1) return;
        grupo.opciones.splice(oIdx, 1);
        this.renderEditorModal();
    },

    editorUpdateOptionProduct(gIdx, oIdx, prodId) {
        const grupo = this.editorState.grupos[gIdx];
        if (!grupo || !grupo.opciones[oIdx]) return;
        const prod = this.cachedProducts.find(p => p.id === prodId);
        if (prod) {
            grupo.opciones[oIdx].idProducto = prod.id;
            grupo.opciones[oIdx].nombre = prod.nombre;
        }
        this.onBasePriceChange(this.editorState.precioBase);
    },

    editorUpdateOptionExtra(gIdx, oIdx, extraVal) {
        const grupo = this.editorState.grupos[gIdx];
        if (!grupo || !grupo.opciones[oIdx]) return;
        grupo.opciones[oIdx].precioExtra = parseFloat(extraVal) || 0;
    },

    editorSetDefaultOption(gIdx, oIdx) {
        const grupo = this.editorState.grupos[gIdx];
        if (!grupo) return;
        grupo.opciones.forEach((opt, idx) => {
            opt.default = (idx === oIdx);
        });
        this.onBasePriceChange(this.editorState.precioBase);
    },

    async saveComboFromStudio(e) {
        e.preventDefault();
        const state = this.editorState;

        const comboData = {
            nombre: state.nombre.trim(),
            descripcion: state.descripcion.trim(),
            precioBase: parseFloat(state.precioBase) || 0,
            ahorroEstimado: parseFloat(state.ahorroEstimado) || 0,
            imagen: state.imagen.trim(),
            categoria: 'Combos',
            activo: state.activo !== false,
            horario: state.horario,
            grupos: state.grupos
        };

        if (state.id) {
            await db.updateDocument('combos', state.id, comboData);
            app.showToast('Combo comercial actualizado con éxito', 'success');
        } else {
            await db.addDocument('combos', {
                ...comboData,
                id: `combo_${Date.now()}`
            });
            app.showToast('Nuevo combo creado exitosamente', 'success');
        }

        if (typeof audioService !== 'undefined') audioService.playSuccess();
        app.closeModal();
        app.renderView('settings');
    }
};
