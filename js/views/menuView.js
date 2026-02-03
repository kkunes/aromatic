/**
 * Menu Management View
 */

const menuView = {
    products: [],
    categories: [],
    menuConfig: {
        includedProducts: [], // IDs
        featuredProducts: [], // IDs
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
                            ${this.categories.map(cat => `
                                <div style="margin-bottom: 35px;">
                                    <h3 style="font-family: 'Playfair Display', serif; color: var(--primary); border-left: 4px solid var(--accent); padding-left: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                                        ${cat.nombre}
                                        <label style="font-size: 0.8rem; font-family: 'Outfit', sans-serif; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                                            <input type="checkbox" onchange="menuView.toggleCategory('${cat.nombre}', this.checked)" style="accent-color: var(--accent);"> Seleccionar Todo
                                        </label>
                                    </h3>
                                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
                                        ${this.products.filter(p => p.categoria === cat.nombre).map(p => {
            const isIncluded = this.menuConfig.includedProducts.includes(p.id);
            const isFeatured = this.menuConfig.featuredProducts.includes(p.id);
            return `
                                                <div class="menu-item-config" style="padding: 15px; border: 1.5px solid ${isIncluded ? 'var(--primary)30' : '#f1f5f9'}; border-radius: 18px; display: flex; align-items: center; gap: 15px; transition: all 0.2s; background: ${isIncluded ? '#fdfaf6' : 'white'}">
                                                    <img src="${p.imagen}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover;">
                                                    <div style="flex: 1;">
                                                        <div style="font-weight: 700; font-size: 0.95rem;">${p.nombre}</div>
                                                        <div style="font-size: 0.85rem; color: #15803d; font-weight: 600;">$${p.precio.toFixed(2)}</div>
                                                    </div>
                                                    <div style="display: flex; flex-direction: column; gap: 8px;">
                                                        <label title="Incluir en Menú" style="cursor: pointer;">
                                                            <input type="checkbox" class="product-include-check" data-id="${p.id}" ${isIncluded ? 'checked' : ''} onchange="menuView.toggleProduct('${p.id}', 'include')" style="width: 18px; height: 18px; accent-color: var(--primary);">
                                                        </label>
                                                        <button onclick="menuView.toggleProduct('${p.id}', 'feature')" style="border: none; background: none; cursor: pointer; color: ${isFeatured ? '#eab308' : '#cbd5e1'}; transition: all 0.2s;" title="${isFeatured ? 'Destacado' : 'Marcar como recomendado'}">
                                                            <i data-lucide="star" style="width: 18px; fill: ${isFeatured ? '#eab308' : 'none'};"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            `;
        }).join('')}
                                    </div>
                                </div>
                            `).join('')}
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
                                <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 30px;">Escanea para ver el menú en tiempo real</p>
                                
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
    },

    saveConfig() {
        localStorage.setItem('aromatic_menu_config', JSON.stringify(this.menuConfig));
        app.showToast('Configuración del menú guardada', 'success');
        if (typeof audioService !== 'undefined') audioService.playSuccess();
    },

    updateConfig(key, val) {
        this.menuConfig[key] = val;
        this.refreshPreview();
    },

    updateTheme(key, val) {
        this.menuConfig.theme[key] = val;
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
        this.refreshPreview();
        if (typeof audioService !== 'undefined') audioService.playClick();
    },

    toggleCategory(catName, checked) {
        const catProducts = this.products.filter(p => p.categoria === catName);
        catProducts.forEach(p => {
            const idx = this.menuConfig.includedProducts.indexOf(p.id);
            if (checked && idx === -1) this.menuConfig.includedProducts.push(p.id);
            else if (!checked && idx !== -1) this.menuConfig.includedProducts.splice(idx, 1);
        });
        this.refreshPreview();

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

        const styles = `
            font-family: ${theme.fontFamily};
            color: ${theme.textColor};
            padding: ${isForPrint ? '40px' : '30px'};
            min-height: 100%;
        `;

        const headerColor = theme.primaryColor;
        const accentColor = theme.secondaryColor;

        return `
            <div id="printableMenu" style="${styles}">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 50px;">
                    <img src="recursos/logo efimero.png" style="width: 80px; filter: drop-shadow(0 5px 15px rgba(0,0,0,0.1)); margin-bottom: 15px;">
                    <h1 style="font-size: 3rem; margin: 0; color: ${headerColor};">Nuestra Carta</h1>
                    <div style="width: 60px; height: 3px; background: ${accentColor}; margin: 15px auto;"></div>
                    <p style="text-transform: uppercase; letter-spacing: 3px; font-size: 0.8rem; font-weight: 700; opacity: 0.6;">Sabor con Alma & Corazón</p>
                </div>

                <!-- Product Groups -->
                ${this.categories.map(cat => {
            const group = groups[cat.nombre];
            if (!group || group.length === 0) return '';
            return `
                        <div style="margin-bottom: 40px;">
                            <h2 style="font-size: 1.8rem; color: ${headerColor}; border-bottom: 1.5px solid #eee; padding-bottom: 10px; margin-bottom: 25px; display: flex; align-items: center; gap: 12px;">
                                <i data-lucide="${cat.icono || 'coffee'}" style="width: 24px; color: ${accentColor}"></i>
                                ${cat.nombre}
                            </h2>
                            <div style="display: grid; grid-template-columns: ${theme.layout === 'modern' ? 'repeat(auto-fill, minmax(250px, 1fr))' : '1fr'}; gap: ${theme.layout === 'modern' ? '25px' : '20px'};">
                                ${group.map(p => {
                const isFeatured = conf.featuredProducts.includes(p.id);
                if (theme.layout === 'classic' || theme.layout === 'minimal') {
                    return `
                                            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 15px; position: relative;">
                                                <div style="flex: 1;">
                                                    <div style="display: flex; align-items: center; gap: 8px;">
                                                        <span style="font-weight: 700; font-size: 1.1rem;">${p.nombre}</span>
                                                        ${isFeatured ? `<span style="background: ${accentColor}; color: white; font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; font-weight: 800; text-transform: uppercase;">Top</span>` : ''}
                                                    </div>
                                                    ${conf.showDescriptions ? `<p style="font-size: 0.85rem; opacity: 0.7; margin: 5px 0 0 0;">Una experiencia artesanal seleccionada cuidadosamente para ti.</p>` : ''}
                                                </div>
                                                <div style="font-weight: 800; color: ${headerColor}; font-size: 1.1rem; border-bottom: 1px dashed #ddd; flex-grow: 1; margin: 0 10px 5px 10px;"></div>
                                                <div style="font-weight: 800; color: ${headerColor}; font-size: 1.1rem;">$${p.precio.toFixed(2)}</div>
                                            </div>
                                        `;
                } else {
                    // Modern layout
                    return `
                                            <div style="background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.03); transition: transform 0.3s; ${isFeatured ? `border: 2px solid ${accentColor}40;` : ''}">
                                                ${conf.showImages ? `<img src="${p.imagen}" style="width: 100%; height: 160px; object-fit: cover;">` : ''}
                                                <div style="padding: 15px;">
                                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                                        <span style="font-weight: 700; font-size: 1rem;">${p.nombre}</span>
                                                        <span style="font-weight: 800; color: ${accentColor};">$${p.precio.toFixed(2)}</span>
                                                    </div>
                                                    ${conf.showDescriptions ? `<p style="font-size: 0.75rem; opacity: 0.6; line-height: 1.4; margin: 0;">Preparado con los mejores ingredientes de la casa.</p>` : ''}
                                                    ${isFeatured ? `
                                                        <div style="margin-top: 10px; display: flex; align-items: center; gap: 5px; color: ${accentColor}; font-size: 0.7rem; font-weight: 700;">
                                                            <i data-lucide="star" style="width: 10px; fill: ${accentColor}"></i> RECOMENDADO
                                                        </div>
                                                    ` : ''}
                                                </div>
                                            </div>
                                        `;
                }
            }).join('')}
                            </div>
                        </div>
                    `;
        }).join('')}

                <!-- Footer -->
                <div style="text-align: center; margin-top: 60px; padding-top: 30px; border-top: 1px dashed #eee;">
                    <p style="font-size: 0.8rem; color: #94a3b8;">Los precios ya incluyen IVA. • Disfruta tu momento Aromatic.</p>
                </div>
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
            link.download = 'QR-Menu-Aromatic.png';
            link.href = canvas.toDataURL();
            link.click();
        }
    },

    copyPublicUrl() {
        navigator.clipboard.writeText(this.menuConfig.publicUrl);
        app.showToast('Enlace copiado al portapapeles', 'info');
    },

    generatePDF() {
        const content = this.renderMenuMarkup(true);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        tempDiv.style.width = '800px';
        document.body.appendChild(tempDiv);

        // Hide during capture
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';

        const opt = {
            margin: 0,
            filename: 'Menu-Aromatic.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(tempDiv).save().then(() => {
            document.body.removeChild(tempDiv);
            app.showToast('PDF generado correctamente', 'success');
        });
    }
};
