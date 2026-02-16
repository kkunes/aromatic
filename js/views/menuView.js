/**
 * Menu Management View
 */

const menuView = {
    products: [],
    categories: [],
    menuConfig: {
        includedProducts: [], // IDs
        featuredProducts: [], // IDs
        categoryOrder: [], // Array of category names
        productOrder: {}, // Map of categoryName -> Array of product IDs
        theme: {
            primaryColor: '#4b3621',
            secondaryColor: '#e2965d',
            backgroundColor: '#fdfaf6',
            textColor: '#2d231a',
            fontFamily: "'Playfair Display', serif",
            layout: 'modern' // 'classic', 'minimal'
        },
        showDescriptions: true,
        showImages: true,
        publicUrl: window.location.href.replace('index.html', 'menu.html')
    },

    async render() {
        this.products = await db.getCollection('productos');
        this.categories = await db.getCollection('categorias');
        this.loadConfig();

        return `
            <div class="menu-management-view fade-in" style="padding-bottom: 50px;">
                <div class="view-header" style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; gap: 20px; flex-wrap: wrap;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                            <div style="width: 42px; height: 42px; background: var(--primary); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(75, 54, 33, 0.2);">
                                <i data-lucide="book-open" style="width: 24px; height: 24px;"></i>
                            </div>
                            <h1 style="margin: 0; font-family: 'Playfair Display', serif; font-size: 2.2rem; color: var(--primary);">Diseñador de Menú</h1>
                        </div>
                        <p style="color: var(--text-muted); font-size: 1rem; margin-left: 54px;">Crea y personaliza la carta visual de tu negocio</p>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <button class="btn-secondary" onclick="menuView.selectAllProducts()" style="padding: 14px 24px; border-radius: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; border: 2px solid var(--primary); color: var(--primary);">
                            <i data-lucide="check-square"></i> TODO EL CATÁLOGO
                        </button>
                        <button class="btn-secondary" onclick="menuView.generatePDF()" style="padding: 14px 24px; border-radius: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; border: 2px solid #ef4444; color: #ef4444;">
                            <i data-lucide="file-text"></i> EXPORTAR PDF
                        </button>
                        <button class="btn-primary" onclick="menuView.saveConfig()" style="padding: 14px 28px; border-radius: 16px; font-weight: 700; display: flex; align-items: center; gap: 10px; box-shadow: 0 8px 20px rgba(75, 54, 33, 0.25);">
                            <i data-lucide="save"></i> GUARDAR CAMBIOS
                        </button>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 400px; gap: 30px; align-items: start;">
                    <!-- Configuration Tabs -->
                    <div class="card" style="padding: 30px; border-radius: 28px; background: white; border: 1px solid #f1f5f9;">
                        <div class="menu-tabs" style="display: flex; gap: 20px; border-bottom: 1px solid #f1f5f9; margin-bottom: 25px; padding-bottom: 10px;">
                            <button class="menu-tab-btn active" data-tab="selection" style="background: none; border: none; font-weight: 700; color: var(--primary); cursor: pointer; padding-bottom: 10px; border-bottom: 2px solid var(--primary);">Selección de Productos</button>
                            <button class="menu-tab-btn" data-tab="design" style="background: none; border: none; font-weight: 700; color: #94a3b8; cursor: pointer; padding-bottom: 10px; border-bottom: 2px solid transparent;">Estilo y Diseño</button>
                            <button class="menu-tab-btn" data-tab="qr" style="background: none; border: none; font-weight: 700; color: #94a3b8; cursor: pointer; padding-bottom: 10px; border-bottom: 2px solid transparent;">Código QR</button>
                        </div>

                        <!-- Tab Content: Selection -->
                        <div id="tab-selection" class="menu-tab-content">
                            <div style="margin-bottom: 20px; background: #f0fdf4; padding: 15px; border-radius: 12px; border: 1px solid #dcfce7; display: flex; align-items: center; gap: 10px;">
                                <i data-lucide="info" style="color: #16a34a; width: 20px;"></i>
                                <span style="font-size: 0.9rem; color: #16a34a; font-weight: 600;">Usa las flechas para personalizar el orden de aparición en el menú.</span>
                            </div>
                            
                            ${this.getSortedCategories().map((cat, catIdx) => {
            const productsInCat = this.getSortedProductsForCategory(cat.nombre);
            return `
                                    <div class="category-config-block" style="margin-bottom: 35px; background: #f8fafc; padding: 20px; border-radius: 24px; border: 1px solid #e2e8f0;">
                                        <h3 style="font-family: 'Playfair Display', serif; color: var(--primary); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                                            <div style="display: flex; align-items: center; gap: 12px;">
                                                <div style="display: flex; flex-direction: column; gap: 2px;">
                                                    <button onclick="menuView.moveCategory(${catIdx}, -1)" class="order-btn" title="Subir Categoría" ${catIdx === 0 ? 'disabled style="opacity:0.3; cursor:default;"' : ''}>
                                                        <i data-lucide="chevron-up" style="width: 14px;"></i>
                                                    </button>
                                                    <button onclick="menuView.moveCategory(${catIdx}, 1)" class="order-btn" title="Bajar Categoría" ${catIdx === this.categories.length - 1 ? 'disabled style="opacity:0.3; cursor:default;"' : ''}>
                                                        <i data-lucide="chevron-down" style="width: 14px;"></i>
                                                    </button>
                                                </div>
                                                <i data-lucide="${cat.icono || 'package'}" style="width: 20px; color: var(--accent);"></i>
                                                <span style="font-size: 1.3rem;">${cat.nombre}</span>
                                            </div>
                                            <label style="font-size: 0.8rem; font-family: 'Outfit', sans-serif; cursor: pointer; display: flex; align-items: center; gap: 8px; background: white; padding: 6px 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
                                                <input type="checkbox" onchange="menuView.toggleCategory('${cat.nombre}', this.checked)" style="accent-color: var(--accent);"> Seleccionar Todo
                                            </label>
                                        </h3>
                                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 15px;">
                                            ${productsInCat.map((p, pIdx) => {
                const isIncluded = this.menuConfig.includedProducts.includes(p.id);
                const isFeatured = this.menuConfig.featuredProducts.includes(p.id);
                return `
                                                    <div class="menu-item-config" style="padding: 12px; border: 1.5px solid ${isIncluded ? 'var(--primary)30' : '#f1f5f9'}; border-radius: 18px; display: flex; align-items: center; gap: 12px; transition: all 0.2s; background: ${isIncluded ? 'white' : '#f8fafc'}">
                                                        <div style="display: flex; flex-direction: column; gap: 4px;">
                                                            <button onclick="menuView.moveProduct('${cat.nombre}', ${pIdx}, -1)" class="order-btn-mini" ${pIdx === 0 ? 'disabled style="opacity:0.2"' : ''}>
                                                                <i data-lucide="arrow-up" style="width: 12px;"></i>
                                                            </button>
                                                            <button onclick="menuView.moveProduct('${cat.nombre}', ${pIdx}, 1)" class="order-btn-mini" ${pIdx === productsInCat.length - 1 ? 'disabled style="opacity:0.2"' : ''}>
                                                                <i data-lucide="arrow-down" style="width: 12px;"></i>
                                                            </button>
                                                        </div>
                                                        <img src="${p.imagen}" style="width: 45px; height: 45px; border-radius: 10px; object-fit: cover;">
                                                        <div style="flex: 1; overflow: hidden;">
                                                            <div style="font-weight: 700; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.nombre}</div>
                                                            <div style="font-size: 0.8rem; color: #15803d; font-weight: 600;">$${p.precio.toFixed(2)}</div>
                                                        </div>
                                                        <div style="display: flex; align-items: center; gap: 10px;">
                                                            <button onclick="menuView.toggleProduct('${p.id}', 'feature')" style="border: none; background: none; cursor: pointer; color: ${isFeatured ? '#eab308' : '#cbd5e1'}; transition: all 0.2s;" title="${isFeatured ? 'Destacado' : 'Marcar como recomendado'}">
                                                                <i data-lucide="star" style="width: 18px; fill: ${isFeatured ? '#eab308' : 'none'};"></i>
                                                            </button>
                                                            <label title="Incluir en Menú" style="cursor: pointer; display: flex; align-items: center;">
                                                                <input type="checkbox" class="product-include-check" data-id="${p.id}" ${isIncluded ? 'checked' : ''} onchange="menuView.toggleProduct('${p.id}', 'include')" style="width: 20px; height: 20px; accent-color: var(--primary);">
                                                            </label>
                                                        </div>
                                                    </div>
                                                `;
            }).join('')}
                                        </div>
                                    </div>
                                `;
        }).join('')}
                            <style>
                                .order-btn, .order-btn-mini {
                                    background: white;
                                    border: 1px solid #e2e8f0;
                                    color: #64748b;
                                    cursor: pointer;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    transition: all 0.2s;
                                }
                                .order-btn { width: 28px; height: 24px; border-radius: 6px; }
                                .order-btn:hover:not(:disabled) { background: var(--primary); color: white; border-color: var(--primary); }
                                .order-btn-mini { width: 22px; height: 20px; border-radius: 4px; border: none; background: #f1f5f9; }
                                .order-btn-mini:hover:not(:disabled) { background: #e2e8f0; color: var(--primary); }
                            </style>
                        </div>

                        <!-- Tab Content: Design -->
                        <div id="tab-design" class="menu-tab-content hidden">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                                <div class="input-group">
                                    <label>Color Principal (Cabeceras)</label>
                                    <input type="color" value="${this.menuConfig.theme.primaryColor}" onchange="menuView.updateTheme('primaryColor', this.value)" style="width: 100%; height: 50px; border-radius: 12px; border: 1.5px solid #e2e8f0; padding: 5px; cursor: pointer;">
                                </div>
                                <div class="input-group">
                                    <label>Color de Acento</label>
                                    <input type="color" value="${this.menuConfig.theme.secondaryColor}" onchange="menuView.updateTheme('secondaryColor', this.value)" style="width: 100%; height: 50px; border-radius: 12px; border: 1.5px solid #e2e8f0; padding: 5px; cursor: pointer;">
                                </div>
                                <div class="input-group">
                                    <label>Tipografía</label>
                                    <select onchange="menuView.updateTheme('fontFamily', this.value)" class="premium-input" style="width: 100%; padding: 15px; border-radius: 12px;">
                                        <option value="'Playfair Display', serif" ${this.menuConfig.theme.fontFamily.includes('Playfair') ? 'selected' : ''}>Elegante (Playfair Display)</option>
                                        <option value="'Outfit', sans-serif" ${this.menuConfig.theme.fontFamily.includes('Outfit') ? 'selected' : ''}>Moderno (Outfit)</option>
                                        <option value="'Georgia', serif" ${this.menuConfig.theme.fontFamily.includes('Georgia') ? 'selected' : ''}>Clásico (Georgia)</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label>Estilo Visual</label>
                                    <select onchange="menuView.updateTheme('layout', this.value)" class="premium-input" style="width: 100%; padding: 15px; border-radius: 12px;">
                                        <option value="modern" ${this.menuConfig.theme.layout === 'modern' ? 'selected' : ''}>Moderno (Cuadrícula)</option>
                                        <option value="classic" ${this.menuConfig.theme.layout === 'classic' ? 'selected' : ''}>Clásico (Lista)</option>
                                        <option value="minimal" ${this.menuConfig.theme.layout === 'minimal' ? 'selected' : ''}>Minimalista</option>
                                    </select>
                                </div>
                            </div>

                            <div style="margin-top: 30px; display: flex; gap: 40px; background: #f8fafc; padding: 25px; border-radius: 20px; border: 1px dashed #e2e8f0;">
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 600;">
                                    <input type="checkbox" ${this.menuConfig.showDescriptions ? 'checked' : ''} onchange="menuView.updateConfig('showDescriptions', this.checked)" style="width: 20px; height: 20px; accent-color: var(--primary);"> Mostrar Descripciones
                                </label>
                                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 600;">
                                    <input type="checkbox" ${this.menuConfig.showImages ? 'checked' : ''} onchange="menuView.updateConfig('showImages', this.checked)" style="width: 20px; height: 20px; accent-color: var(--primary);"> Mostrar Imágenes
                                </label>
                            </div>
                        </div>

                        <!-- Tab Content: QR -->
                        <div id="tab-qr" class="menu-tab-content hidden" style="text-align: center; padding: 40px;">
                            <div style="max-width: 400px; margin: 0 auto; background: #f8fafc; padding: 40px; border-radius: 32px; border: 1px solid #e2e8f0;">
                                <h3 style="font-family: 'Playfair Display', serif; margin-bottom: 10px;">Tu Menú Digital en Mesa</h3>
                                <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 20px;">Escanea para ver el menú en tiempo real</p>
                                
                                <div class="input-group" style="text-align: left; margin-bottom: 25px;">
                                    <label style="font-size: 0.75rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; display: block;">Enlace Público del Menú (GitHub Pages)</label>
                                    <input type="url" id="menuPublicUrlInput" value="${this.menuConfig.publicUrl}" placeholder="https://tu-usuario.github.io/tu-repo/menu.html" 
                                        oninput="menuView.updateConfig('publicUrl', this.value); menuView.renderQR();"
                                        style="width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 0.85rem; outline: none; transition: border-color 0.2s;">
                                </div>
                                
                                <div id="menuQRCode" style="display: inline-block; padding: 20px; background: white; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-bottom: 30px;"></div>
                                
                                <div style="display: flex; flex-direction: column; gap: 12px;">
                                    <button class="btn-primary" onclick="menuView.downloadQR()" style="width: 100%; padding: 15px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                        <i data-lucide="download"></i> DESCARGAR QR
                                    </button>
                                    <button class="btn-secondary" onclick="menuView.copyPublicUrl()" style="width: 100%; padding: 15px; display: flex; align-items: center; justify-content: center; gap: 8px; border-color: #e2e8f0; background: white;">
                                        <i data-lucide="copy"></i> COPIAR ENLACE
                                    </button>
                                </div>
                            </div>
                            <p style="margin-top: 30px; font-size: 0.9rem; color: #94a3b8; max-width: 500px; margin-left: auto; margin-right: auto;">
                                Nota: Para que el QR funcione en mesas de clientes reales, debes alojar el archivo <strong>menu.html</strong> en una dirección pública (como GitHub Pages o Firebase Hosting).
                            </p>
                        </div>
                    </div>

                    <!-- Live Preview Panel -->
                    <div id="menuLivePreview" style="position: sticky; top: 20px; height: fit-content;">
                        <div style="background: #1e293b; color: white; padding: 15px 25px; border-radius: 24px 24px 0 0; display: flex; align-items: center; gap: 10px;">
                            <i data-lucide="eye" style="width: 20px;"></i>
                            <span style="font-weight: 700; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px;">Vista Previa en Vivo</span>
                        </div>
                        <div id="menuPreviewContent" style="background: ${this.menuConfig.theme.backgroundColor}; height: 750px; overflow-y: auto; border-radius: 0 0 24px 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;" class="preview-scroll">
                            ${this.renderMenuMarkup()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    loadConfig() {
        const saved = localStorage.getItem('aromatic_menu_config');
        if (saved) {
            this.menuConfig = JSON.parse(saved);
        } else {
            // Default: include all products
            this.menuConfig.includedProducts = this.products.map(p => p.id);
        }

        // Ensure category order exists
        if (!this.menuConfig.categoryOrder || this.menuConfig.categoryOrder.length === 0) {
            this.menuConfig.categoryOrder = this.categories.map(c => c.nombre);
        } else {
            // Check for new categories not in order
            this.categories.forEach(c => {
                if (!this.menuConfig.categoryOrder.includes(c.nombre)) {
                    this.menuConfig.categoryOrder.push(c.nombre);
                }
            });
            // Remove deleted categories from order
            const catNames = this.categories.map(c => c.nombre);
            this.menuConfig.categoryOrder = this.menuConfig.categoryOrder.filter(n => catNames.includes(n));
        }

        // Initialize productOrder if missing
        if (!this.menuConfig.productOrder) this.menuConfig.productOrder = {};
        this.categories.forEach(cat => {
            const catProds = this.products.filter(p => p.categoria === cat.nombre).map(p => p.id);
            if (!this.menuConfig.productOrder[cat.nombre]) {
                this.menuConfig.productOrder[cat.nombre] = catProds;
            } else {
                // Sync new products
                catProds.forEach(pid => {
                    if (!this.menuConfig.productOrder[cat.nombre].includes(pid)) {
                        this.menuConfig.productOrder[cat.nombre].push(pid);
                    }
                });
                // Remove deleted products
                this.menuConfig.productOrder[cat.nombre] = this.menuConfig.productOrder[cat.nombre].filter(pid => catProds.includes(pid));
            }
        });
    },

    getSortedCategories() {
        return [...this.menuConfig.categoryOrder].map(name =>
            this.categories.find(c => c.nombre === name)
        ).filter(Boolean);
    },

    getSortedProductsForCategory(catName) {
        const order = this.menuConfig.productOrder[catName] || [];
        const catProds = this.products.filter(p => p.categoria === catName);

        return [...order].map(id =>
            catProds.find(p => p.id === id)
        ).filter(Boolean);
    },

    moveCategory(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.menuConfig.categoryOrder.length) return;

        const arr = this.menuConfig.categoryOrder;
        [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];

        // Persist change so renderView doesn't overwrite it
        localStorage.setItem('aromatic_menu_config', JSON.stringify(this.menuConfig));

        this.refreshSelectionTab();
        if (typeof audioService !== 'undefined') audioService.playClick();
    },

    moveProduct(catName, index, direction) {
        const order = this.menuConfig.productOrder[catName];
        if (!order) return;

        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= order.length) return;

        [order[index], order[newIndex]] = [order[newIndex], order[index]];

        // Persist change so renderView doesn't overwrite it
        localStorage.setItem('aromatic_menu_config', JSON.stringify(this.menuConfig));

        this.refreshSelectionTab();
        if (typeof audioService !== 'undefined') audioService.playClick();
    },

    refreshSelectionTab() {
        // Instead of full app.renderView, just update the selection tab content and preview
        const container = document.getElementById('tab-selection');
        if (container) {
            // Re-render the selection content
            container.innerHTML = `
                <div style="margin-bottom: 20px; background: #f0fdf4; padding: 15px; border-radius: 12px; border: 1px solid #dcfce7; display: flex; align-items: center; gap: 10px;">
                    <i data-lucide="info" style="color: #16a34a; width: 20px;"></i>
                    <span style="font-size: 0.9rem; color: #16a34a; font-weight: 600;">Usa las flechas para personalizar el orden de aparición en el menú.</span>
                </div>
                
                ${this.getSortedCategories().map((cat, catIdx) => {
                const productsInCat = this.getSortedProductsForCategory(cat.nombre);
                return `
                        <div class="category-config-block" style="margin-bottom: 35px; background: #f8fafc; padding: 20px; border-radius: 24px; border: 1px solid #e2e8f0;">
                            <h3 style="font-family: 'Playfair Display', serif; color: var(--primary); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="display: flex; flex-direction: column; gap: 2px;">
                                        <button onclick="menuView.moveCategory(${catIdx}, -1)" class="order-btn" title="Subir Categoría" ${catIdx === 0 ? 'disabled style="opacity:0.3; cursor:default;"' : ''}>
                                            <i data-lucide="chevron-up" style="width: 14px;"></i>
                                        </button>
                                        <button onclick="menuView.moveCategory(${catIdx}, 1)" class="order-btn" title="Bajar Categoría" ${catIdx === this.menuConfig.categoryOrder.length - 1 ? 'disabled style="opacity:0.3; cursor:default;"' : ''}>
                                            <i data-lucide="chevron-down" style="width: 14px;"></i>
                                        </button>
                                    </div>
                                    <i data-lucide="${cat.icono || 'package'}" style="width: 20px; color: var(--accent);"></i>
                                    <span style="font-size: 1.3rem;">${cat.nombre}</span>
                                </div>
                                <label style="font-size: 0.8rem; font-family: 'Outfit', sans-serif; cursor: pointer; display: flex; align-items: center; gap: 8px; background: white; padding: 6px 12px; border-radius: 10px; border: 1px solid #e2e8f0;">
                                    <input type="checkbox" onchange="menuView.toggleCategory('${cat.nombre}', this.checked)" style="accent-color: var(--accent);"> Seleccionar Todo
                                </label>
                            </h3>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 15px;">
                                ${productsInCat.map((p, pIdx) => {
                    const isIncluded = this.menuConfig.includedProducts.includes(p.id);
                    const isFeatured = this.menuConfig.featuredProducts.includes(p.id);
                    return `
                                        <div class="menu-item-config" style="padding: 12px; border: 1.5px solid ${isIncluded ? 'var(--primary)30' : '#f1f5f9'}; border-radius: 18px; display: flex; align-items: center; gap: 12px; transition: all 0.2s; background: ${isIncluded ? 'white' : '#f8fafc'}">
                                            <div style="display: flex; flex-direction: column; gap: 4px;">
                                                <button onclick="menuView.moveProduct('${cat.nombre}', ${pIdx}, -1)" class="order-btn-mini" ${pIdx === 0 ? 'disabled style="opacity:0.2"' : ''}>
                                                    <i data-lucide="arrow-up" style="width: 12px;"></i>
                                                </button>
                                                <button onclick="menuView.moveProduct('${cat.nombre}', ${pIdx}, 1)" class="order-btn-mini" ${pIdx === productsInCat.length - 1 ? 'disabled style="opacity:0.2"' : ''}>
                                                    <i data-lucide="arrow-down" style="width: 12px;"></i>
                                                </button>
                                            </div>
                                            <img src="${p.imagen}" style="width: 45px; height: 45px; border-radius: 10px; object-fit: cover;">
                                            <div style="flex: 1; overflow: hidden;">
                                                <div style="font-weight: 700; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.nombre}</div>
                                                <div style="font-size: 0.8rem; color: #15803d; font-weight: 600;">$${p.precio.toFixed(2)}</div>
                                            </div>
                                            <div style="display: flex; align-items: center; gap: 10px;">
                                                <button onclick="menuView.toggleProduct('${p.id}', 'feature')" style="border: none; background: none; cursor: pointer; color: ${isFeatured ? '#eab308' : '#cbd5e1'}; transition: all 0.2s;" title="${isFeatured ? 'Destacado' : 'Marcar como recomendado'}">
                                                    <i data-lucide="star" style="width: 18px; fill: ${isFeatured ? '#eab308' : 'none'};"></i>
                                                </button>
                                                <label title="Incluir en Menú" style="cursor: pointer; display: flex; align-items: center;">
                                                    <input type="checkbox" class="product-include-check" data-id="${p.id}" ${isIncluded ? 'checked' : ''} onchange="menuView.toggleProduct('${p.id}', 'include')" style="width: 20px; height: 20px; accent-color: var(--primary);">
                                                </label>
                                            </div>
                                        </div>
                                    `;
                }).join('')}
                            </div>
                        </div>
                    `;
            }).join('')}
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            this.refreshPreview();
        }
    },

    async saveConfig() {
        localStorage.setItem('aromatic_menu_config', JSON.stringify(this.menuConfig));
        await db.setCollection('menu_config', [this.menuConfig]);
        app.showToast('Configuración del menú guardada y sincronizada', 'success');
        if (typeof audioService !== 'undefined') audioService.playSuccess();
    },

    selectAllProducts() {
        this.menuConfig.includedProducts = this.products.map(p => p.id);
        localStorage.setItem('aromatic_menu_config', JSON.stringify(this.menuConfig));
        app.showToast('Todo el catálogo seleccionado para el menú', 'info');
        this.refreshSelectionTab();
    },

    updateConfig(key, val) {
        this.menuConfig[key] = val;
        localStorage.setItem('aromatic_menu_config', JSON.stringify(this.menuConfig));
        this.refreshPreview();
    },

    updateTheme(key, val) {
        this.menuConfig.theme[key] = val;
        localStorage.setItem('aromatic_menu_config', JSON.stringify(this.menuConfig));
        this.refreshPreview();
    },

    toggleProduct(id, type) {
        if (type === 'include') {
            const idx = this.menuConfig.includedProducts.indexOf(id);
            if (idx === -1) this.menuConfig.includedProducts.push(id);
            else this.menuConfig.includedProducts.splice(idx, 1);
        } else if (type === 'feature') {
            const idx = this.menuConfig.featuredProducts.indexOf(id);
            if (idx === -1) this.menuConfig.featuredProducts.push(id);
            else this.menuConfig.featuredProducts.splice(idx, 1);
        }

        localStorage.setItem('aromatic_menu_config', JSON.stringify(this.menuConfig));
        this.refreshSelectionTab(); // Better to refresh tab too for consistent styling (bg colors)
        if (typeof audioService !== 'undefined') audioService.playClick();
    },

    toggleCategory(catName, checked) {
        const catProducts = this.products.filter(p => p.categoria === catName);
        catProducts.forEach(p => {
            const idx = this.menuConfig.includedProducts.indexOf(p.id);
            if (checked && idx === -1) this.menuConfig.includedProducts.push(p.id);
            else if (!checked && idx !== -1) this.menuConfig.includedProducts.splice(idx, 1);
        });

        localStorage.setItem('aromatic_menu_config', JSON.stringify(this.menuConfig));
        this.refreshSelectionTab();
        if (typeof audioService !== 'undefined') audioService.playClick();

        // Update checkboxes visually
        document.querySelectorAll('.product-include-check').forEach(cb => {
            const id = cb.getAttribute('data-id');
            const p = this.products.find(prod => prod.id === id);
            if (p && p.categoria === catName) cb.checked = checked;
        });
    },

    refreshPreview() {
        const container = document.getElementById('menuPreviewContent');
        if (container) {
            container.innerHTML = this.renderMenuMarkup();
            container.style.backgroundColor = this.menuConfig.theme.backgroundColor;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    },

    bindEvents(app) {
        window.menuView = this; // Ensure global access for onclick events
        const tabs = document.querySelectorAll('.menu-tab-btn');
        tabs.forEach(btn => {
            btn.onclick = () => {
                const target = btn.getAttribute('data-tab');
                // UI update
                tabs.forEach(b => {
                    b.classList.remove('active');
                    b.style.color = '#94a3b8';
                    b.style.borderBottomColor = 'transparent';
                });
                btn.classList.add('active');
                btn.style.color = 'var(--primary)';
                btn.style.borderBottomColor = 'var(--primary)';

                // Content update
                document.querySelectorAll('.menu-tab-content').forEach(c => c.classList.add('hidden'));
                document.getElementById(`tab-${target}`).classList.remove('hidden');

                if (target === 'qr') this.renderQR();
            };
        });
    },

    renderMenuMarkup(isForPrint = false) {
        const conf = this.menuConfig;
        const theme = conf.theme;
        const included = this.products.filter(p => conf.includedProducts.includes(p.id));

        // Group by category
        const groups = {};
        included.forEach(p => {
            if (!groups[p.categoria]) groups[p.categoria] = [];
            groups[p.categoria].push(p);
        });

        // Respect custom product order within each group
        Object.keys(groups).forEach(catName => {
            const order = this.menuConfig.productOrder[catName] || [];
            groups[catName].sort((a, b) => {
                const idxA = order.indexOf(a.id);
                const idxB = order.indexOf(b.id);
                return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
            });
        });

        const headerColor = theme.primaryColor;
        const accentColor = theme.secondaryColor;

        const settings = db.getSettings();
        const biz = settings.negocio || { nombre: 'Nuestra Carta', eslogan: 'Sabor con Alma & Corazón', logo: 'recursos/logo efimero.png' };

        if (isForPrint) {
            // HIGH-END PREMIUM PRINT LAYOUT (Standard Letter Page - Bordered)
            return `
                <div id="printableMenu" style="
                    font-family: ${theme.fontFamily || 'Outfit, sans-serif'}, sans-serif, system-ui;
                    color: ${theme.textColor || '#333'};
                    padding: 0.5in;
                    background: white;
                    width: 6.5in; 
                    margin: 0 auto;
                    box-sizing: border-box;
                    position: relative;
                ">
                    <!-- Elegant Border Frame -->
                    <div style="position: absolute; top: 0.25in; left: 0.25in; right: 0.25in; bottom: 0.25in; border: 1px solid ${headerColor}20; pointer-events: none;"></div>
                    <div style="position: absolute; top: 0.3in; left: 0.3in; right: 0.3in; bottom: 0.3in; border: 2px solid ${headerColor}08; pointer-events: none;"></div>

                    <!-- Premium Header -->
                    <div style="text-align: center; padding-top: 20px; margin-bottom: 50px; position: relative; z-index: 10;">
                        <div style="display: inline-block; margin-bottom: 15px;">
                            <img src="${biz.logo}" style="width: 80px; height: 80px; object-fit: contain;">
                        </div>
                        <h1 style="font-size: 3rem; margin: 0; color: ${headerColor}; font-weight: 700; letter-spacing: -1px;">${biz.nombre}</h1>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-top: 10px;">
                            <div style="height: 1px; width: 40px; background: ${accentColor}50;"></div>
                            <p style="text-transform: uppercase; letter-spacing: 4px; font-size: 0.75rem; font-weight: 700; color: ${accentColor}; margin: 0;">${biz.eslogan}</p>
                            <div style="height: 1px; width: 40px; background: ${accentColor}50;"></div>
                        </div>
                    </div>

                    <!-- Product Groups -->
                    <div style="width: 100%; position: relative; z-index: 10;">
                        ${this.getSortedCategories().map(cat => {
                const group = groups[cat.nombre];
                if (!group || group.length === 0) return '';
                return `
                                <div style="margin-bottom: 40px; break-inside: avoid; page-break-inside: avoid;">
                                    <h2 style="font-size: 1.4rem; color: ${headerColor}; border-bottom: 2px solid ${accentColor}30; padding-bottom: 8px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 10px;">
                                        ${cat.nombre}
                                    </h2>
                                    <div style="display: flex; flex-direction: column; gap: 18px;">
                                        ${group.map(p => {
                    const isFeatured = conf.featuredProducts.includes(p.id);
                    return `
                                                <div style="display: flex; align-items: flex-start; gap: 12px; break-inside: avoid; margin-bottom: 2px;">
                                                    ${conf.showImages && p.imagen ? `
                                                        <img src="${p.imagen}" style="width: 55px; height: 55px; border-radius: 8px; object-fit: cover; border: 1px solid #eee;">
                                                    ` : ''}
                                                    <div style="flex: 1;">
                                                        <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 10px;">
                                                            <div style="font-weight: 700; font-size: 1rem; color: ${headerColor};">
                                                                ${p.nombre} ${isFeatured ? '<span style="color:#eab308">★</span>' : ''}
                                                            </div>
                                                            <div style="flex-grow: 1; border-bottom: 1px dotted #ccc; position: relative; top: -5px;"></div>
                                                            <div style="font-weight: 800; color: ${accentColor}; font-size: 1rem;">$${p.precio.toFixed(2)}</div>
                                                        </div>
                                                        ${conf.showDescriptions ? `
                                                            <p style="font-size: 0.75rem; color: #666; margin: 2px 0 0 0; line-height: 1.4; font-style: italic;">
                                                                ${p.descripcion || 'Especialidad preparada diariamente con ingredientes seleccionados.'}
                                                            </p>
                                                        ` : ''}
                                                    </div>
                                                </div>
                                            `;
                }).join('')}
                                    </div>
                                </div>
                            `;
            }).join('')}
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; margin-top: 50px; padding-bottom: 20px; border-top: 1px solid #eee; padding-top: 20px; position: relative; z-index: 10;">
                        <p style="font-size: 0.75rem; color: #999; margin: 0;">${biz.nombre} • Menú Premium</p>
                        <p style="font-size: 0.7rem; color: ${accentColor}; font-weight: 700; margin-top: 5px;">${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })}</p>
                    </div>
                </div>
            `;
        }

        // Web Preview Version (Keep mostly as is but cleaner)
        const styles = `
            font-family: ${theme.fontFamily};
            color: ${theme.textColor};
            padding: 30px;
            min-height: 100%;
            background: ${theme.backgroundColor};
        `;

        return `
            <div id="printableMenu" style="${styles}">
                <div style="text-align: center; margin-bottom: 40px;">
                    <img src="${biz.logo}" style="width: 60px; margin-bottom: 10px;">
                    <h1 style="font-size: 2.5rem; margin: 0; color: ${headerColor};">${biz.nombre}</h1>
                    <p style="text-transform: uppercase; letter-spacing: 3px; font-size: 0.7rem; font-weight: 700; opacity: 0.6;">${biz.eslogan}</p>
                </div>

                ${this.getSortedCategories().map(cat => {
            const group = groups[cat.nombre];
            if (!group || group.length === 0) return '';
            return `
                        <div style="margin-bottom: 35px;">
                            <h2 style="font-size: 1.5rem; color: ${headerColor}; border-bottom: 1.5px solid #eee; padding-bottom: 8px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
                                <i data-lucide="${cat.icono || 'coffee'}" style="width: 20px; color: ${accentColor}"></i>
                                ${cat.nombre}
                            </h2>
                            <div style="display: grid; grid-template-columns: ${theme.layout === 'modern' ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr'}; gap: ${theme.layout === 'modern' ? '20px' : '15px'};">
                                ${group.map(p => {
                const isFeatured = conf.featuredProducts.includes(p.id);
                if (theme.layout === 'classic' || theme.layout === 'minimal') {
                    return `
                                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                                                <div style="flex: 1;">
                                                    <div style="display: flex; align-items: center; gap: 8px;">
                                                        <span style="font-weight: 700; font-size: 1rem;">${p.nombre}</span>
                                                        ${isFeatured ? `<span style="background: ${accentColor}; color: white; font-size: 0.5rem; padding: 2px 5px; border-radius: 4px; font-weight: 900;">★</span>` : ''}
                                                    </div>
                                                    ${conf.showDescriptions ? `<p style="font-size: 0.8rem; opacity: 0.6; margin: 4px 0 0 0;">${p.descripcion || 'Especialidad de la casa.'}</p>` : ''}
                                                </div>
                                                <div style="font-weight: 800; color: ${headerColor}; font-size: 1rem;">$${p.precio.toFixed(2)}</div>
                                            </div>
                                        `;
                } else {
                    return `
                                            <div style="background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.03); ${isFeatured ? `border: 2px solid ${accentColor}40;` : ''}">
                                                ${conf.showImages ? `<img src="${p.imagen}" style="width: 100%; height: 120px; object-fit: cover;">` : ''}
                                                <div style="padding: 12px;">
                                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                                        <span style="font-weight: 700; font-size: 0.9rem;">${p.nombre}</span>
                                                        <span style="font-weight: 800; color: ${accentColor}; font-size: 0.9rem;">$${p.precio.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                }
            }).join('')}
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    renderQR() {
        const container = document.getElementById('menuQRCode');
        if (container) {
            container.innerHTML = '';
            new QRCode(container, {
                text: this.menuConfig.publicUrl,
                width: 200,
                height: 200,
                colorDark: this.menuConfig.theme.primaryColor,
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    },

    downloadQR() {
        const canvas = document.querySelector('#menuQRCode canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = `QR-Menu-${db.getSettings().negocio.nombre || 'Aromatic'}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    },

    copyPublicUrl() {
        navigator.clipboard.writeText(this.menuConfig.publicUrl);
        app.showToast('Enlace copiado al portapapeles', 'info');
    },

    async generatePDF() {
        try {
            // 1. Check Library
            if (typeof html2pdf === 'undefined') {
                app.showToast('Librería PDF no encontrada. Recargando...', 'error');
                setTimeout(() => location.reload(), 2000);
                return;
            }

            app.showToast('Verificando base de datos...', 'info');

            // 2. Refresh Data
            this.products = await db.getCollection('productos');
            this.categories = await db.getCollection('categorias');
            this.loadConfig();

            if (!this.products || this.products.length === 0) {
                app.showToast('No hay productos en el catálogo.', 'error');
                return;
            }

            // 3. Validate configuration
            // If no products are selected, we select all as fallback
            if (!this.menuConfig.includedProducts || this.menuConfig.includedProducts.length === 0) {
                console.warn('No products included in config, using all products.');
                this.menuConfig.includedProducts = this.products.map(p => p.id);
            }

            const included = this.products.filter(p => this.menuConfig.includedProducts.includes(p.id));
            if (included.length === 0) {
                // Try selecting all if the previous check didn't catch a mismatch
                this.menuConfig.includedProducts = this.products.map(p => p.id);
                const retryIncluded = this.products.filter(p => this.menuConfig.includedProducts.includes(p.id));
                if (retryIncluded.length === 0) {
                    app.showToast('Error: No hay productos elegibles para el menú.', 'error');
                    return;
                }
            }

            app.showToast('Construyendo menú premium...', 'info');
            const settings = db.getSettings();
            const content = this.renderMenuMarkup(true);

            // 4. Create a Sandbox Iframe for rendering (Isolated from main app styles/conflicts)
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.left = '-5000px';
            iframe.style.top = '0';
            iframe.style.width = '792px'; // US Letter width in pts (8.25in approx for capture)
            iframe.style.height = 'auto';
            document.body.appendChild(iframe);

            const doc = iframe.contentDocument || iframe.contentWindow.document;
            doc.open();
            doc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
                    <style>
                        body { 
                            margin: 0; 
                            padding: 0; 
                            background: white; 
                            -webkit-print-color-adjust: exact;
                        }
                        * { box-sizing: border-box; }
                    </style>
                </head>
                <body>
                    <div id="capture-root">
                        ${content}
                    </div>
                </body>
                </html>
            `);
            doc.close();

            // 5. Wait for iframe resources
            app.showToast('Procesando imágenes y fuentes...', 'info');

            await new Promise((resolve) => {
                const checkReady = () => {
                    const imgs = doc.getElementsByTagName('img');
                    let ready = true;
                    for (let img of imgs) {
                        if (!img.complete) ready = false;
                    }
                    if (ready) resolve();
                    else setTimeout(checkReady, 500);
                };

                // Timeout safety
                setTimeout(resolve, 5000);
                iframe.onload = checkReady;
                checkReady();
            });

            // 6. Capture and Save
            app.showToast('Generando archivo PDF...', 'info');

            const opt = {
                margin: 0,
                filename: `Menu-Pro-${settings.negocio.nombre || 'Aromatic'}.pdf`,
                image: { type: 'jpeg', quality: 1.0 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    scrollY: 0,
                    scrollX: 0,
                    logging: false
                },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait', compress: true },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            // Capture the content from the iframe body using the specific container
            const captureElement = doc.getElementById('capture-root');
            await html2pdf().set(opt).from(captureElement).save();

            app.showToast('¡Menú exportado correctamente!', 'success');
            if (typeof audioService !== 'undefined') audioService.playSuccess();

            // 7. Cleanup
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 5000);

        } catch (err) {
            console.error('PDF CRITICAL FAILURE:', err);
            app.showToast('Error en generación: ' + err.message, 'error');
            // Fallback: try simple print
            if (confirm('La generación avanzada falló. ¿Deseas usar la función de impresión del navegador como alternativa?')) {
                window.print();
            }
        }
    }
};
