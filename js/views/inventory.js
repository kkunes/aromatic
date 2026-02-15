const inventoryView = {
    productos: [],
    insumos: [],
    categorias: [],
    filterQuery: '',
    selectedCategoryIcon: 'package',
    editingCategoryId: null,

    async render() {
        this.productos = await db.getCollection('productos');
        this.insumos = await db.getCollection('insumos');
        this.categorias = await db.getCollection('categorias');

        const filtered = this.productos.filter(p =>
            p.nombre.toLowerCase().includes((this.filterQuery || '').toLowerCase()) ||
            p.categoria.toLowerCase().includes((this.filterQuery || '').toLowerCase())
        );

        return `
            <div class="inventory-container fade-in" style="height: 100%; display: flex; flex-direction: column;">
                <div class="view-header" style="flex-shrink: 0; margin-bottom: 20px;">
                    <div>
                        <h1 style="margin: 0;">Inventario de Productos</h1>
                        <p style="color: var(--text-muted); margin-top: 5px;">Gestiona tu menú y recetas.</p>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn-secondary" onclick="app.switchView('supplies')" style="display: flex; align-items: center; gap: 8px; background: #fff7ed; color: #ea580c; border: 1px solid #ffedd5;">
                            <i data-lucide="carrot"></i> Gestionar Insumos
                        </button>
                        <button class="btn-secondary" id="manageCategoriesBtn" style="display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="tag"></i> Categorías
                        </button>
                        <button class="btn-primary" id="addProductoBtn">
                            <i data-lucide="plus"></i> Nuevo Producto
                        </button>
                    </div>
                </div>
                
                <div id="inventory-table-container" class="table-container hide-scrollbar" style="flex: 1; overflow-y: auto; margin-top: 0;">
                    <table class="modern-table">
                        <thead style="position: sticky; top: 0; background: white; z-index: 10;">
                            <tr>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Precio Venta</th>
                                <th>Costo / Margen</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.map(p => {
            const costo = this.calculateCost(p);
            const margen = p.precio - costo;
            const margenPercent = p.precio > 0 ? (margen / p.precio) * 100 : 0;
            const tieneReceta = p.insumos && p.insumos.length > 0;

            return `
                                <tr>
                                    <td>
                                        <div class="table-product">
                                            <img src="${p.imagen || 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=200&h=200&fit=crop'}" class="table-thumb" loading="lazy">
                                            <div style="display: flex; flex-direction: column;">
                                                <span style="font-weight: 600;">${p.nombre}</span>
                                                ${!tieneReceta ? '<small style="color: #f59e0b; font-size: 0.75rem;">Sin receta</small>' : ''}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <div style="width: 28px; height: 28px; background: ${this.getCategoryColor(p.categoria, 0.1)}; color: ${this.getCategoryColor(p.categoria, 1)}; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                                <i data-lucide="${this.categorias.find(c => c.nombre === p.categoria)?.icono || 'package'}" style="width: 14px;"></i>
                                            </div>
                                            <span class="badge" style="background: ${this.getCategoryColor(p.categoria, 0.1)}; color: ${this.getCategoryColor(p.categoria, 1)}; margin: 0;">
                                                ${p.categoria}
                                            </span>
                                        </div>
                                    </td>
                                    <td style="font-weight: 700;">$${p.precio.toFixed(2)}</td>
                                    <td>
                                        ${tieneReceta ? `
                                            <div style="display: flex; flex-direction: column; font-size: 0.85rem;">
                                                <span style="color: var(--text-muted);">Costo: $${costo.toFixed(2)}</span>
                                                <span style="color: ${margen > 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">
                                                    Margen: ${margenPercent.toFixed(0)}% ($${margen.toFixed(2)})
                                                </span>
                                            </div>
                                        ` : '<span style="color: #cbd5e1;">-</span>'}
                                    </td>
                                    <td>
                                        <div style="display: flex; gap: 8px;">
                                            <button class="btn-icon-small" onclick="inventoryView.editProducto('${p.id}')">
                                                <i data-lucide="edit-2"></i>
                                            </button>
                                            <button class="btn-icon-small danger" onclick="inventoryView.deleteProducto('${p.id}')">
                                                <i data-lucide="trash-2"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    filter(query) {
        this.filterQuery = query;
        this.refreshGrid();
    },

    async refreshGrid() {
        const resultsContainer = document.getElementById('inventory-table-container');
        if (resultsContainer) {
            this.productos = await db.getCollection('productos');
            this.insumos = await db.getCollection('insumos');
            this.categorias = await db.getCollection('categorias');

            const filtered = this.productos.filter(p =>
                p.nombre.toLowerCase().includes((this.filterQuery || '').toLowerCase()) ||
                p.categoria.toLowerCase().includes((this.filterQuery || '').toLowerCase())
            );

            resultsContainer.innerHTML = `
                <table class="modern-table">
                    <thead style="position: sticky; top: 0; background: white; z-index: 10;">
                        <tr>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Precio Venta</th>
                            <th>Costo / Margen</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(p => {
                const costo = this.calculateCost(p);
                const margen = p.precio - costo;
                const margenPercent = p.precio > 0 ? (margen / p.precio) * 100 : 0;
                const tieneReceta = p.insumos && p.insumos.length > 0;

                return `
                                <tr>
                                    <td>
                                        <div class="table-product">
                                            <img src="${p.imagen || 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=200&h=200&fit=crop'}" class="table-thumb" loading="lazy">
                                            <div style="display: flex; flex-direction: column;">
                                                <span style="font-weight: 600;">${p.nombre}</span>
                                                ${!tieneReceta ? '<small style="color: #f59e0b; font-size: 0.75rem;">Sin receta</small>' : ''}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <div style="width: 28px; height: 28px; background: ${this.getCategoryColor(p.categoria, 0.1)}; color: ${this.getCategoryColor(p.categoria, 1)}; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                                <i data-lucide="${this.categorias.find(c => c.nombre === p.categoria)?.icono || 'package'}" style="width: 14px;"></i>
                                            </div>
                                            <span class="badge" style="background: ${this.getCategoryColor(p.categoria, 0.1)}; color: ${this.getCategoryColor(p.categoria, 1)}; margin: 0;">
                                                ${p.categoria}
                                            </span>
                                        </div>
                                    </td>
                                    <td style="font-weight: 700;">$${p.precio.toFixed(2)}</td>
                                    <td>
                                        ${tieneReceta ? `
                                            <div style="display: flex; flex-direction: column; font-size: 0.85rem;">
                                                <span style="color: var(--text-muted);">Costo: $${costo.toFixed(2)}</span>
                                                <span style="color: ${margen > 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">
                                                    Margen: ${margenPercent.toFixed(0)}% ($${margen.toFixed(2)})
                                                </span>
                                            </div>
                                        ` : '<span style="color: #cbd5e1;">-</span>'}
                                    </td>
                                    <td>
                                        <div style="display: flex; gap: 8px;">
                                            <button class="btn-icon-small" onclick="inventoryView.editProducto('${p.id}')">
                                                <i data-lucide="edit-2"></i>
                                            </button>
                                            <button class="btn-icon-small danger" onclick="inventoryView.deleteProducto('${p.id}')">
                                                <i data-lucide="trash-2"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
            }).join('')}
                    </tbody>
                </table>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            const container = document.getElementById('view-container');
            if (this.app && this.app.currentView === 'inventory') {
                const html = await this.render();
                container.innerHTML = `<div class="view-enter">${html}</div>`;
                container.scrollTop = 0;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                this.bindEvents(this.app);
            }
        }
    },

    getCategoryColor(category, opacity = 1) {
        const normalized = (category || '').toLowerCase().trim();
        const colors = {
            'café': `rgba(226, 150, 93, ${opacity})`,
            'repostería': `rgba(221, 160, 221, ${opacity})`,
            'especiales': `rgba(240, 230, 140, ${opacity})`,
            'bebidas frías': `rgba(173, 216, 230, ${opacity})`,
            'comida': `rgba(144, 238, 144, ${opacity})`
        };
        return colors[normalized] || `rgba(141, 119, 101, ${opacity})`;
    },

    calculateCost(producto) {
        if (!producto.insumos || producto.insumos.length === 0) return 0;
        return producto.insumos.reduce((total, item) => {
            const insumo = this.insumos.find(i => i.id === item.idInsumo);
            return total + (item.cantidad * (insumo?.costoUnitario || 0));
        }, 0);
    },

    bindEvents(appInstance) {
        this.app = appInstance;
        const addBtn = document.getElementById('addProductoBtn');
        const catBtn = document.getElementById('manageCategoriesBtn');

        if (addBtn) addBtn.onclick = () => this.showProductoModal();
        if (catBtn) catBtn.onclick = () => this.showCategoriesModal();
    },

    async showCategoriesModal(id = null) {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');
        this.categorias = await db.getCollection('categorias');

        this.editingCategoryId = id;
        const currentCat = id ? this.categorias.find(c => c.id === id) : null;
        this.selectedCategoryIcon = currentCat ? (currentCat.icono || 'package') : 'package';

        // Catálogo de iconos Lucide recomendados para el sistema
        const iconCatalog = [
            'package', 'coffee', 'cup-soda', 'beer', 'glass-water', 'utensils',
            'pizza', 'burger', 'sandwich', 'soup', 'beef', 'fish', 'egg',
            'cake', 'ice-cream', 'cookie', 'donut', 'croissant', 'candy',
            'apple', 'cherry', 'grape', 'strawberry', 'carrot', 'leaf',
            'star', 'flame', 'sparkles', 'heart', 'shopping-bag', 'gift'
        ];

        modalContent.innerHTML = `
            <div class="categories-modal" style="width: 500px; max-width: 95vw;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                    <h2 style="margin: 0; display: flex; align-items: center; gap: 10px; font-family: 'Playfair Display', serif;">
                        <i data-lucide="tag" style="color: var(--primary);"></i>
                        ${id ? 'Editar Categoría' : 'Gestionar Categorías'}
                    </h2>
                    <button class="btn-icon-small" id="closeCatModal">
                        <i data-lucide="x"></i>
                    </button>
                </div>

                <div class="card" style="margin-bottom: 25px; padding: 20px; border: 1px solid #f1f5f9; background: #fafafa;">
                    <div class="input-group">
                        <label style="font-size: 0.8rem; font-weight: 700; margin-bottom: 8px; display: block; color: var(--text-muted);">NOMBRE DE LA CATEGORÍA</label>
                        <input type="text" id="newCategoryName" value="${currentCat ? currentCat.nombre : ''}" placeholder="Ej: Bebidas Frías, Postres..." class="large-input" style="padding: 12px; font-size: 1rem; width: 100%;">
                    </div>
                    
                    <label style="font-size: 0.8rem; font-weight: 700; margin: 15px 0 10px 0; display: block; color: var(--text-muted);">SELECCIONAR ICONO</label>
                    <div id="iconSelectorGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(40px, 1fr)); gap: 8px; max-height: 150px; overflow-y: auto; padding: 10px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;" class="hide-scrollbar">
                        ${iconCatalog.map(icon => `
                            <div class="icon-option ${this.selectedCategoryIcon === icon ? 'selected' : ''}" 
                                 onclick="inventoryView.selectCategoryIcon('${icon}')"
                                 data-icon="${icon}"
                                 style="width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; border: 2px solid transparent;">
                                <i data-lucide="${icon}" style="width: 20px;"></i>
                            </div>
                        `).join('')}
                    </div>

                    <div style="margin-top: 20px; display: flex; gap: 10px;">
                        ${id ? `
                            <button class="btn-secondary" onclick="inventoryView.showCategoriesModal()" style="flex: 1;">Cancelar Edición</button>
                            <button class="btn-primary" id="saveCatBtn" style="flex: 2;">GUARDAR CAMBIOS</button>
                        ` : `
                            <button class="btn-primary" id="addCatBtnSave" style="width: 100%; height: 50px; border-radius: 14px; font-weight: 800;">
                                <i data-lucide="plus"></i> AÑADIR NUEVA CATEGORÍA
                            </button>
                        `}
                    </div>
                </div>

                <div id="modalCategoriesList" class="hide-scrollbar" style="display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto;">
                    <h3 style="font-size: 0.85rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Categorías Actuales</h3>
                    ${this.categorias.map(cat => `
                        <div style="display: flex; align-items: center; justify-content: space-between; background: white; padding: 12px 16px; border-radius: 16px; border: 1px solid #f1f5f9; transition: all 0.2s;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 40px; height: 40px; background: rgba(75, 54, 33, 0.05); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
                                    <i data-lucide="${cat.icono || 'package'}" style="width: 20px;"></i>
                                </div>
                                <span style="font-weight: 700; color: var(--primary);">${cat.nombre}</span>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn-icon-small" onclick="inventoryView.showCategoriesModal('${cat.id}')" title="Editar">
                                    <i data-lucide="edit-3" style="width: 16px;"></i>
                                </button>
                                <button class="btn-icon-small danger" onclick="inventoryView.deleteCategory('${cat.id}')" title="Eliminar">
                                    <i data-lucide="trash-2" style="width: 16px;"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <style>
                .icon-option:hover { background: #f8fafc; border-color: #e2e8f0; }
                .icon-option.selected { background: var(--primary); color: white; border-color: var(--primary); box-shadow: 0 4px 10px rgba(75, 54, 33, 0.2); }
            </style>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        modal.classList.remove('hidden');
        if (!id) audioService.playPop(); // Solo sonar si no es edición

        document.getElementById('closeCatModal').onclick = () => modal.classList.add('hidden');

        const saveAction = async () => {
            const nameInput = document.getElementById('newCategoryName');
            const nombre = nameInput.value.trim();
            if (!nombre) return;

            const data = { nombre, icono: this.selectedCategoryIcon };

            if (this.editingCategoryId) {
                await db.updateDocument('categorias', this.editingCategoryId, data);
                app.showToast('Categoría actualizada');
            } else {
                await db.addDocument('categorias', data);
                app.showToast('Categoría añadida');
            }

            this.showCategoriesModal(); // Refresh modal
            this.app.renderView('inventory'); // Refresh background view
        };

        if (document.getElementById('addCatBtnSave')) {
            document.getElementById('addCatBtnSave').onclick = saveAction;
        }
        if (document.getElementById('saveCatBtn')) {
            document.getElementById('saveCatBtn').onclick = saveAction;
        }
    },

    selectCategoryIcon(icon) {
        this.selectedCategoryIcon = icon;
        document.querySelectorAll('.icon-option').forEach(opt => {
            opt.classList.remove('selected');
            if (opt.dataset.icon === icon) opt.classList.add('selected');
        });
        if (typeof audioService !== 'undefined') audioService.playClick();
    },

    async deleteCategory(id) {
        if (confirm('¿Deseas eliminar esta categoría?')) {
            await db.deleteDocument('categorias', id);
            this.showCategoriesModal();
        }
    },

    async showProductoModal(producto = null) {
        const isEdit = !!producto;
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        if (this.insumos.length === 0) this.insumos = await db.getCollection('insumos');
        if (this.categorias.length === 0) this.categorias = await db.getCollection('categorias');

        let recipeItems = isEdit && producto.insumos ? [...producto.insumos] : [];

        // Agrupar insumos por categoría para el select
        const insumosByCat = {};
        this.insumos.forEach(i => {
            const cat = i.categoria || 'General';
            if (!insumosByCat[cat]) insumosByCat[cat] = [];
            insumosByCat[cat].push(i);
        });

        const updateCostProfit = () => {
            const price = parseFloat(document.getElementById('prodPrecio')?.value) || 0;
            const cost = recipeItems.reduce((acc, item) => {
                const ins = this.insumos.find(i => i.id === item.idInsumo);
                return acc + (item.cantidad * (ins?.costoUnitario || 0));
            }, 0);
            const profit = price - cost;
            const percentage = price > 0 ? (profit / price) * 100 : 0;

            const display = document.getElementById('costProfitDisplay');
            if (display) {
                display.innerHTML = `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0;">
                        <div>
                            <small style="color: var(--text-muted); display: block; margin-bottom: 4px;">Costo Receta</small>
                            <span style="font-weight: 700; color: #ef4444; font-size: 1.1rem;">$${cost.toFixed(2)}</span>
                        </div>
                        <div>
                            <small style="color: var(--text-muted); display: block; margin-bottom: 4px;">Ganancia Est.</small>
                            <span style="font-weight: 700; color: ${profit >= 0 ? 'var(--success)' : 'var(--danger)'}; font-size: 1.1rem;">
                                $${profit.toFixed(2)} <span style="font-size: 0.8rem; font-weight: 500;">(${percentage.toFixed(0)}%)</span>
                            </span>
                        </div>
                    </div>
                `;
            }
        };

        const renderRecipeList = () => {
            const container = document.getElementById('recipeItemsList');
            if (!container) return;

            updateCostProfit(); // Recalcular costos

            if (recipeItems.length === 0) {
                container.innerHTML = '<p style="color: #94a3b8; font-size: 0.9rem; text-align: center; padding: 20px; border: 2px dashed #e2e8f0; border-radius: 12px;">No hay ingredientes agregados.</p>';
                return;
            }

            container.innerHTML = recipeItems.map((item, idx) => {
                const insumo = this.insumos.find(i => i.id === item.idInsumo);
                const costoItem = (item.cantidad * (insumo?.costoUnitario || 0)).toFixed(2);
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; background: #fff; padding: 12px; border-radius: 12px; margin-bottom: 8px; border: 1px solid #f1f5f9; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        <div>
                            <span style="font-weight: 500; color: #334155; display: block;">${insumo ? insumo.nombre : 'Desconocido'}</span>
                            <small style="color: #94a3b8;">$${insumo?.costoUnitario?.toFixed(2) || '0.00'} / ${insumo?.unidad}</small>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="text-align: right;">
                                <span style="font-weight: 700; font-size: 0.95rem; display: block;">${item.cantidad} ${insumo ? insumo.unidad : ''}</span>
                                <small style="color: #ef4444; font-weight: 500;">-$${costoItem}</small>
                            </div>
                            <button type="button" class="btn-icon-small danger" onclick="inventoryView.removeRecipeItem(${idx})" style="background: #fee2e2; color: #ef4444;">
                                <i data-lucide="trash-2" style="width: 14px;"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        };

        window.inventoryView = this;
        this.removeRecipeItem = (idx) => {
            recipeItems.splice(idx, 1);
            renderRecipeList();
        };

        modalContent.innerHTML = `
            <div class="product-form-modal" style="width: 700px; max-width: 95vw;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0;">${isEdit ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                    <button class="btn-icon-small" id="closeProdModalTop"><i data-lucide="x"></i></button>
                </div>
                
                <form id="productForm">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div class="input-group">
                            <label>Nombre del Producto</label>
                            <input type="text" id="prodNombre" value="${isEdit ? producto.nombre : ''}" required class="large-input">
                        </div>
                        <div class="input-group">
                            <label>Categoría</label>
                            <select id="prodCategoria" required class="large-input">
                                ${this.categorias.map(cat => `
                                    <option value="${cat.nombre}" ${isEdit && producto.categoria === cat.nombre ? 'selected' : ''}>${cat.nombre}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="input-group">
                            <label>Precio Venta ($)</label>
                            <input type="number" id="prodPrecio" step="0.01" value="${isEdit ? producto.precio : ''}" required class="large-input">
                        </div>
                        <div class="input-group">
                            <label>Imagen del Producto</label>
                            <div style="display: flex; gap: 8px;">
                                <input type="text" id="prodImagen" value="${isEdit ? (producto.imagen || '') : ''}" class="large-input" style="font-size: 0.9rem; padding: 12px; flex: 1;" placeholder="Pega URL o sube archivo...">
                                <button type="button" class="btn-secondary" onclick="document.getElementById('fileInProd').click()" title="Subir archivo" style="padding: 0 15px;">
                                    <i data-lucide="upload"></i>
                                </button>
                                <input type="file" id="fileInProd" hidden accept="image/*" onchange="inventoryView.handleImageUpload(this)">
                            </div>
                        </div>
                        <div class="input-group" style="grid-column: span 2;">
                            <label>Descripción para el Menú</label>
                            <textarea id="prodDescripcion" class="large-input" style="height: 80px; padding: 12px; font-size: 0.9rem; resize: none;" placeholder="Escribe una descripción atractiva para el menú digital y PDF...">${isEdit ? (producto.descripcion || '') : ''}</textarea>
                        </div>
                    </div>

                    <!-- Costeo Section -->
                    <div id="costProfitDisplay"></div>

                    <!-- Recipe Section -->
                    <div style="background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
                        <div style="padding: 15px 20px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; background: #fff;">
                            <h3 style="font-size: 1rem; margin: 0; display: flex; align-items: center; gap: 8px; color: var(--primary);">
                                <i data-lucide="chef-hat" style="width: 18px;"></i>
                                Configuración de Receta
                            </h3>
                            <label class="switch">
                                <input type="checkbox" id="tieneReceta" ${recipeItems.length > 0 ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>

                        <div id="recipeSection" style="padding: 20px; ${recipeItems.length > 0 ? '' : 'display: none;'}">
                            <div style="display: grid; grid-template-columns: 2fr 1fr auto; gap: 10px; margin-bottom: 15px;">
                                <div>
                                    <label style="font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; display: block;">Ingrediente</label>
                                    <select id="recipeInsumo" class="large-input" style="font-size: 0.9rem; padding: 10px;">
                                        <option value="">Seleccionar...</option>
                                        ${Object.keys(insumosByCat).map(cat => `
                                            <optgroup label="${cat}">
                                                ${insumosByCat[cat].map(i => `<option value="${i.id}">${i.nombre} (${i.unidad}) - $${(i.costoUnitario || 0).toFixed(2)}</option>`).join('')}
                                            </optgroup>
                                        `).join('')}
                                    </select>
                                </div>
                                <div>
                                    <label style="font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; display: block;">Cantidad</label>
                                    <input type="number" id="recipeCantidad" placeholder="0.00" class="large-input" style="font-size: 0.9rem; padding: 10px;">
                                </div>
                                <div style="display: flex; align-items: end;">
                                    <button type="button" class="btn-primary" id="addRecipeItem" style="height: 42px; width: 42px; padding: 0; border-radius: 10px; display: flex; align-items: center; justify-content: center;">
                                        <i data-lucide="plus"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div id="recipeItemsList" class="hide-scrollbar" style="max-height: 200px; overflow-y: auto;"></div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 15px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                        <button type="button" class="btn-secondary" id="closeProdModalBtn" style="flex: 1; padding: 15px;">Cancelar</button>
                        <button type="submit" class="btn-primary" style="flex: 2; padding: 15px;">
                            ${isEdit ? 'Guardar Producto' : 'Crear Producto'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        modal.classList.remove('hidden');
        audioService.playPop(); // Premium sound
        if (typeof lucide !== 'undefined') lucide.createIcons();

        renderRecipeList(); // Initial render

        // Listeners para recalcular costos
        document.getElementById('prodPrecio').addEventListener('input', updateCostProfit);

        const toggleRecipe = document.getElementById('tieneReceta');
        const recipeSec = document.getElementById('recipeSection');
        toggleRecipe.onchange = (e) => {
            recipeSec.style.display = e.target.checked ? 'block' : 'none';
            if (!e.target.checked) {
                recipeItems = [];
                renderRecipeList();
            }
        };

        document.getElementById('addRecipeItem').onclick = () => {
            const insumoId = document.getElementById('recipeInsumo').value;
            const cantidad = parseFloat(document.getElementById('recipeCantidad').value);

            if (!insumoId || isNaN(cantidad) || cantidad <= 0) {
                alert('Selecciona un insumo y una cantidad válida.');
                return;
            }

            const existing = recipeItems.find(i => i.idInsumo === insumoId);
            if (existing) {
                existing.cantidad += cantidad;
            } else {
                recipeItems.push({ idInsumo: insumoId, cantidad });
            }

            document.getElementById('recipeCantidad').value = '';
            renderRecipeList();
        };

        const closeModal = () => modal.classList.add('hidden');
        document.getElementById('closeProdModalTop').onclick = closeModal;
        document.getElementById('closeProdModalBtn').onclick = closeModal;

        document.getElementById('productForm').onsubmit = async (e) => {
            e.preventDefault();
            const data = {
                nombre: document.getElementById('prodNombre').value,
                categoria: document.getElementById('prodCategoria').value,
                precio: parseFloat(document.getElementById('prodPrecio').value),
                imagen: document.getElementById('prodImagen').value || undefined,
                descripcion: document.getElementById('prodDescripcion').value.trim() || undefined,
                insumos: toggleRecipe.checked ? recipeItems : []
            };

            if (isEdit) {
                await db.updateDocument('productos', producto.id, data);
                await db.logAction('inventario', 'actualizar_producto', `Producto: "${data.nombre}", Precio: $${data.precio}`);
                app.showToast('Producto actualizado');
            } else {
                await db.addDocument('productos', data);
                await db.logAction('inventario', 'crear_producto', `Producto: "${data.nombre}", Categoría: ${data.categoria}`);
                app.showToast('Producto creado');
            }

            modal.classList.add('hidden');
            this.app.renderView('inventory');
        };
    },

    editProducto(id) {
        const producto = this.productos.find(p => p.id === id);
        if (producto) this.showProductoModal(producto);
    },

    async deleteProducto(id) {
        const currentUser = db.getCurrentUser();
        if (currentUser.rol !== 'admin') {
            return alert('Solo el administrador puede eliminar productos del catálogo.');
        }

        const prod = this.productos.find(p => p.id === id);
        if (confirm(`¿Estás seguro de que deseas eliminar "${prod?.nombre}"?`)) {
            await db.deleteDocument('productos', id);
            await db.logAction('inventario', 'eliminar_producto', `Producto: "${prod?.nombre}"`);
            this.app.renderView('inventory');
        }
    },

    async handleImageUpload(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const dataUrl = e.target.result;
            // Compress automatically
            const compressed = await db.compressImage(dataUrl, 500, 0.6);

            // Try cloud upload if key exists
            const cloudUrl = await db.uploadToCloud(compressed);

            document.getElementById('prodImagen').value = cloudUrl || compressed;
            app.showToast(cloudUrl ? 'Imagen alojada en la nube' : 'Imagen comprimida localmente');
        };
        reader.readAsDataURL(file);
    }
};
