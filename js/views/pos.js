const posView = {
    products: [],
    filteredProducts: [],
    combos: [],
    filteredCombos: [],
    currentCategory: 'all',

    async render() {
        this.products = await db.getCollection('productos');
        // Load combos and evaluate commercial schedule rules
        const allCombos = await db.getCollection('combos');
        const now = new Date();
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const currentTime = now.getHours() * 100 + now.getMinutes();

        this.combos = (allCombos || []).filter(c => c.activo !== false).map(c => {
            let isOutsideHours = false;
            let scheduleNotice = '';
            if (c.horario && c.horario.activo) {
                const days = c.horario.dias || [];
                const matchesDay = days.length === 0 || days.includes('todos') || days.includes(currentDay);
                let matchesTime = true;
                if (c.horario.horaInicio && c.horario.horaFin) {
                    const start = parseInt(c.horario.horaInicio.replace(':', ''));
                    const end = parseInt(c.horario.horaFin.replace(':', ''));
                    matchesTime = (currentTime >= start && currentTime <= end);
                }
                if (!matchesDay || !matchesTime) {
                    isOutsideHours = true;
                    scheduleNotice = `${c.horario.horaInicio || '00:00'} - ${c.horario.horaFin || '23:59'}`;
                }
            }
            return { ...c, isOutsideHours, scheduleNotice };
        });
        const dbCategories = await db.getCollection('categorias');
        this.filteredProducts = [...this.products];
        this.filteredCombos = [...this.combos];
        this.currentCategory = 'all';

        // Respect custom order from Menu Config
        const menuConfigRaw = localStorage.getItem('aromatic_menu_config');
        if (menuConfigRaw) {
            const menuConfig = JSON.parse(menuConfigRaw);

            // Sort categories
            if (menuConfig.categoryOrder && menuConfig.categoryOrder.length > 0) {
                dbCategories.sort((a, b) => {
                    const idxA = menuConfig.categoryOrder.indexOf(a.nombre);
                    const idxB = menuConfig.categoryOrder.indexOf(b.nombre);
                    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
                });
            }

            // Sort products global
            this.products.sort((a, b) => {
                const orderA = menuConfig.productOrder?.[a.categoria] || [];
                const orderB = menuConfig.productOrder?.[b.categoria] || [];
                const idxA = orderA.indexOf(a.id);
                const idxB = orderB.indexOf(b.id);

                if (a.categoria === b.categoria) {
                    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
                }
                const catIdxA = menuConfig.categoryOrder?.indexOf(a.categoria) ?? 999;
                const catIdxB = menuConfig.categoryOrder?.indexOf(b.categoria) ?? 999;
                return catIdxA - catIdxB;
            });
            this.filteredProducts = [...this.products];
        }

        return `
            <style>
                .category-filters .chip {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 20px;
                    border-radius: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    white-space: nowrap;
                    background: white;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.02);
                    color: #64748b;
                }
                .category-filters .chip:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    border-color: var(--primary-light);
                }
                .category-filters .chip.active {
                    background: var(--primary);
                    color: white;
                    border-color: var(--primary);
                    box-shadow: 0 10px 20px rgba(75, 54, 33, 0.2);
                }
                .category-filters .chip.combo-chip {
                    background: linear-gradient(135deg, rgba(226, 150, 93, 0.1) 0%, rgba(212, 129, 64, 0.15) 100%);
                    border: 1.5px solid var(--accent);
                    color: var(--primary);
                }
                .category-filters .chip.combo-chip.active {
                    background: linear-gradient(135deg, #E2965D 0%, #D48140 100%);
                    color: white;
                    border-color: #D48140;
                    box-shadow: 0 10px 20px rgba(226, 150, 93, 0.3);
                }
                .category-filters .chip.combo-chip .combo-badge-pill {
                    background: #fff;
                    color: var(--primary);
                    font-size: 0.7rem;
                    font-weight: 800;
                    padding: 2px 7px;
                    border-radius: 10px;
                    margin-left: 2px;
                }
                .category-filters .chip.combo-chip.active .combo-badge-pill {
                    background: rgba(0,0,0,0.2);
                    color: #fff;
                }
                .category-filters {
                    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%);
                    mask-image: linear-gradient(to right, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%);
                }
            </style>
            <div class="pos-container fade-in">
                <div class="category-filters hide-scrollbar" style="display: flex; gap: 12px; overflow-x: auto; padding: 5px 20px 15px 20px; margin-bottom: 20px;">
                    <div class="chip active" data-category="all">
                        <i data-lucide="layout-grid" style="width: 18px;"></i> Todos
                    </div>
                    <div class="chip combo-chip" data-category="combos">
                        <i data-lucide="sparkles" style="width: 18px;"></i> Combos
                        <span class="combo-badge-pill">${this.combos.length}</span>
                    </div>
                    ${dbCategories.map(cat => `
                        <div class="chip" data-category="${cat.nombre}">
                            <i data-lucide="${cat.icono || 'package'}" style="width: 18px;"></i> ${cat.nombre}
                        </div>
                    `).join('')}
                    <div class="chip special-chip" onclick="app.showCustomItemModal()" style="border-style: dashed; border-color: var(--accent); color: var(--accent); background: rgba(226, 150, 93, 0.05);">
                        <i data-lucide="plus-circle" style="width: 18px;"></i> Personalizado
                    </div>
                </div>
                <div class="product-grid" id="productGrid">
                    ${this.renderCurrentView()}
                </div>
            </div>
        `;
    },

    renderCurrentView() {
        if (this.currentCategory === 'combos') {
            return this.renderCombos(this.filteredCombos);
        }

        if (this.currentCategory === 'all') {
            const combosHTML = this.filteredCombos.length > 0 
                ? `<div class="combos-section-header" style="grid-column: 1/-1; display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; padding-top: 5px;">
                       <div style="display: flex; align-items: center; gap: 8px;">
                           <div style="width: 28px; height: 28px; background: rgba(226,150,93,0.15); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--accent);">
                               <i data-lucide="sparkles" style="width: 16px;"></i>
                           </div>
                           <h3 style="font-family: 'Playfair Display', serif; font-size: 1.3rem; margin: 0; color: var(--primary);">Combos & Paquetes Especiales</h3>
                       </div>
                       <span style="font-size: 0.8rem; color: var(--text-muted);">Armados con precio preferencial</span>
                   </div>
                   ${this.renderCombos(this.filteredCombos)}
                   <div class="products-section-header" style="grid-column: 1/-1; display: flex; align-items: center; gap: 8px; margin-top: 15px; margin-bottom: 4px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
                       <h3 style="font-family: 'Playfair Display', serif; font-size: 1.3rem; margin: 0; color: var(--primary);">Catálogo de Productos</h3>
                   </div>`
                : '';
            return combosHTML + this.renderProductsList(this.filteredProducts);
        }

        return this.renderProductsList(this.filteredProducts);
    },

    renderCombos(list) {
        if (!list || list.length === 0) {
            return '<p class="no-results" style="grid-column: 1/-1; text-align: center; padding: 40px; color: #94a3b8;">No hay combos disponibles en este momento.</p>';
        }

        return list.map(combo => {
            const includedPills = combo.grupos.map(g => {
                const shortTitle = g.titulo.replace(/^(Paso \d+: |Elige tu )/i, '');
                return `<span class="combo-micro-pill"><i data-lucide="${g.icono || 'check'}" style="width: 10px; height: 10px;"></i> ${shortTitle}</span>`;
            }).join('');

            return `
                <div class="product-card combo-card ripple ${combo.isOutsideHours ? 'outside-schedule' : ''}" 
                     onclick="combosView.openBuilder('${combo.id}')">
                    <div class="combo-ribbon">
                        <i data-lucide="sparkles" style="width: 12px; height: 12px;"></i> COMBO
                    </div>
                    ${combo.isOutsideHours ? `
                        <div class="combo-schedule-ribbon" title="Horario: ${combo.scheduleNotice}">
                            <i data-lucide="clock" style="width: 10px; height: 10px;"></i> ${combo.scheduleNotice}
                        </div>
                    ` : ''}
                    <img src="${combo.imagen || 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=300&h=300&fit=crop'}" alt="${combo.nombre}" class="product-image" loading="lazy">
                    <div class="product-info">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <span class="category" style="color: var(--accent); font-weight: 700;">Paquete Ahorro</span>
                            ${combo.ahorroEstimado ? `<span class="combo-save-tag">Ahorras ~$${combo.ahorroEstimado}</span>` : ''}
                        </div>
                        <h4 style="font-size: 1.05rem; line-height: 1.25; margin-bottom: 6px;">${combo.nombre}</h4>
                        <div class="combo-items-summary" style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px;">
                            ${includedPills}
                        </div>
                        <div class="combo-card-footer" style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; padding-top: 6px; border-top: 1px solid #f8fafc;">
                            <div>
                                <small style="display: block; font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Desde</small>
                                <span class="product-price" style="color: var(--primary); font-size: 1.35rem; font-weight: 800;">$${combo.precioBase.toFixed(2)}</span>
                            </div>
                            <button class="btn-armar-combo" style="background: var(--primary); color: white; border: none; border-radius: 10px; padding: 6px 14px; font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <i data-lucide="sliders" style="width: 13px; height: 13px;"></i> Armar
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderProductsList(list) {
        if (!list || list.length === 0) {
            return '<p class="no-results" style="grid-column: 1/-1; text-align: center; padding: 40px; color: #94a3b8;">No se encontraron productos.</p>';
        }

        const categoryMap = {
            'café': 'cat-cafe',
            'repostería': 'cat-reposteria',
            'especiales': 'cat-especiales',
            'bebidas frías': 'cat-frias',
            'comida': 'cat-comida'
        };

        return list.map(product => {
            const normalizedCat = (product.categoria || '').toLowerCase().trim();
            const catClass = categoryMap[normalizedCat] || '';

            return `
                <div class="product-card ripple premium-category ${catClass}" 
                     onclick="posView.handleProductClick(event, {id:'${product.id}', nombre:'${product.nombre}', precio:${product.precio}, categoria:'${product.categoria}'})">
                    <div class="cat-marker"></div>
                    <img src="${product.imagen || 'https://cdn-icons-png.flaticon.com/512/924/924412.png'}" alt="${product.nombre}" class="product-image" loading="lazy">
                    <div class="product-info">
                        <span class="category">${product.categoria}</span>
                        <h4>${product.nombre}</h4>
                        <span class="product-price">$${product.precio.toFixed(2)}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    handleProductClick(event, product) {
        this.createRipple(event);
        app.addToCart(product);
    },

    createRipple(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        ripple.style.width = ripple.style.height = `${diameter}px`;
        ripple.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
        ripple.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
        ripple.classList.add('ripple-effect');

        const oldRipple = button.getElementsByClassName('ripple-effect')[0];
        if (oldRipple) oldRipple.remove();

        button.appendChild(ripple);
    },

    bindEvents() {
        // Category filtering
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                if (chip.classList.contains('special-chip')) return;
                document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                const cat = chip.getAttribute('data-category');
                this.filterByCategory(cat);
            });
        });

        // Mouse wheel scroll to slide categories horizontally
        const filtersContainer = document.querySelector('.category-filters');
        if (filtersContainer) {
            let targetScroll = filtersContainer.scrollLeft;
            let currentScroll = filtersContainer.scrollLeft;
            let animationFrameId = null;

            const updateScroll = () => {
                const diff = targetScroll - currentScroll;
                if (Math.abs(diff) > 0.5) {
                    currentScroll += diff * 0.12;
                    filtersContainer.scrollLeft = currentScroll;
                    animationFrameId = requestAnimationFrame(updateScroll);
                } else {
                    filtersContainer.scrollLeft = targetScroll;
                    currentScroll = targetScroll;
                    animationFrameId = null;
                }
            };

            filtersContainer.addEventListener('wheel', (e) => {
                e.preventDefault();
                const maxScroll = filtersContainer.scrollWidth - filtersContainer.clientWidth;
                targetScroll = Math.max(0, Math.min(maxScroll, targetScroll + e.deltaY));
                
                if (!animationFrameId) {
                    animationFrameId = requestAnimationFrame(updateScroll);
                }
            }, { passive: false });
        }
    },

    filterByCategory(category) {
        this.currentCategory = category;
        if (category === 'all') {
            this.filteredProducts = [...this.products];
            this.filteredCombos = [...this.combos];
        } else if (category === 'combos') {
            this.filteredCombos = [...this.combos];
            this.filteredProducts = [];
        } else {
            this.filteredProducts = this.products.filter(p => p.categoria === category);
            this.filteredCombos = [];
        }
        document.getElementById('productGrid').innerHTML = this.renderCurrentView();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    filter(query) {
        const q = query.toLowerCase();
        this.filteredProducts = this.products.filter(p =>
            p.nombre.toLowerCase().includes(q) ||
            p.categoria.toLowerCase().includes(q)
        );
        this.filteredCombos = this.combos.filter(c =>
            c.nombre.toLowerCase().includes(q) ||
            (c.descripcion && c.descripcion.toLowerCase().includes(q))
        );
        const grid = document.getElementById('productGrid');
        if (grid) {
            grid.innerHTML = this.renderCurrentView();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }
};
