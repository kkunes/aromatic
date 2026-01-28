const posView = {
    products: [],
    filteredProducts: [],

    async render() {
        this.products = await db.getCollection('productos');
        const dbCategories = await db.getCollection('categorias');
        this.filteredProducts = [...this.products];

        return `
            <div class="pos-container fade-in">
                <div class="category-filters">
                    <div class="chip active" data-category="all">Todos</div>
                    ${dbCategories.map(cat => `<div class="chip" data-category="${cat.nombre}">${cat.nombre}</div>`).join('')}
                </div>
                <div class="product-grid" id="productGrid">
                    ${this.renderProducts(this.filteredProducts)}
                </div>
            </div>
        `;
    },

    renderProducts(list) {
        if (list.length === 0) return '<p class="no-results" style="grid-column: 1/-1; text-align: center; padding: 40px; color: #94a3b8;">No se encontraron productos.</p>';

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
                document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                const cat = chip.getAttribute('data-category');
                this.filterByCategory(cat);
            });
        });
    },

    filterByCategory(category) {
        if (category === 'all') {
            this.filteredProducts = [...this.products];
        } else {
            this.filteredProducts = this.products.filter(p => p.categoria === category);
        }
        document.getElementById('productGrid').innerHTML = this.renderProducts(this.filteredProducts);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    filter(query) {
        const q = query.toLowerCase();
        this.filteredProducts = this.products.filter(p =>
            p.nombre.toLowerCase().includes(q) ||
            p.categoria.toLowerCase().includes(q)
        );
        const grid = document.getElementById('productGrid');
        if (grid) {
            grid.innerHTML = this.renderProducts(this.filteredProducts);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    }
};
