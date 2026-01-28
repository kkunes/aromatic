/**
 * Main Application Orchestrator
 */

class AromaticApp {
    constructor() {
        this.currentView = 'pos';
        this.tickets = [{ id: 1, cart: [], cliente: null, mesaId: null }];
        this.activeTicketIdx = 0;
        this.ticketCounter = 1;
        this.init();
    }

    get cart() {
        return this.tickets[this.activeTicketIdx].cart;
    }

    async init() {
        this.bindEvents();
        this.updateClock();

        // Auto-seed database if empty
        await db.initializeDatabase();

        this.renderView('pos');
        this.updateTicketsUI();
        this.updateBranding();
        this.checkNotifications();
        virtualKeyboard.init();
        audioService.init(); // Initialize Premium Audio

        // Start Onboarding Tour if needed
        setTimeout(() => this.initTour(), 2000);

        this.applyRolePrivileges();

        setInterval(() => this.updateClock(), 1000);
        setInterval(() => this.checkNotifications(), 30000); // Check every 30s
    }

    applyRolePrivileges() {
        const user = db.getCurrentUser();

        // Update Sidebar/Footer Info
        const nameEl = document.getElementById('currentUserName');
        const roleEl = document.getElementById('currentUserRole');
        const avatarEl = document.getElementById('currentUserAvatar');

        if (nameEl) nameEl.textContent = user.nombre;
        if (roleEl) roleEl.textContent = user.rol.toUpperCase();
        if (avatarEl) avatarEl.textContent = user.avatar || user.nombre.charAt(0);

        // Hide restricted menu items
        document.querySelectorAll('.nav-links li').forEach(li => {
            const view = li.getAttribute('data-view');
            li.style.display = 'flex'; // Default

            if (view === 'settings' && user.rol !== 'admin') li.style.display = 'none';
            if (view === 'sales' && user.rol === 'mesero') li.style.display = 'none';
            if (view === 'cash-closing' && user.rol === 'mesero') li.style.display = 'none';
            if (view === 'inventory' && user.rol === 'mesero') li.style.display = 'none';
        });

        // Ensure current view is allowed
        const restricted = {
            'settings': ['admin'],
            'sales': ['admin', 'cajero'],
            'cash-closing': ['admin', 'cajero'],
            'inventory': ['admin', 'cajero']
        };

        if (restricted[this.currentView] && !restricted[this.currentView].includes(user.rol)) {
            this.switchView('pos');
        }
    }



    initTour() {
        if (localStorage.getItem('aromatic_tour_done')) return;

        const tour = new Shepherd.Tour({
            useModalOverlay: true,
            defaultStepOptions: {
                classes: 'shadow-md bg-purple-dark',
                scrollTo: { behavior: 'smooth', block: 'center' },
                cancelIcon: { enabled: true },
                buttons: [
                    {
                        text: 'Saltar',
                        action: () => tour.complete(),
                        classes: 'shepherd-button-secondary'
                    },
                    {
                        text: 'Siguiente',
                        action: () => tour.next()
                    }
                ]
            }
        });

        tour.addStep({
            id: 'welcome',
            title: '¡Bienvenido a Aromatic POS!',
            text: 'Este sistema ha sido diseñado para ofrecerte la mejor experiencia en gestión de café y ventas. ¿Te gustaría conocer lo básico?',
            buttons: [
                {
                    text: 'Ahora no',
                    action: () => tour.cancel()
                },
                {
                    text: 'Claro, ¡vamos!',
                    action: () => tour.next()
                }
            ]
        });

        tour.addStep({
            id: 'pos-central',
            title: 'Panel de Ventas',
            text: 'Aquí aparecerán tus categorías y productos. Simplemente haz clic en una tarjeta para añadirla a la orden.',
            attachTo: { element: '#productGrid', on: 'right' }
        });

        tour.addStep({
            id: 'cart-area',
            title: 'Tu Orden Activa',
            text: 'En este panel verás los productos añadidos. Prueba a deslizar (swipe) a la derecha para añadir más o a la izquierda para borrar.',
            attachTo: { element: '#posCartPanel', on: 'left' }
        });

        tour.addStep({
            id: 'nav-menu',
            title: 'Menú de Navegación',
            text: 'Gestiona tus mesas, inventario, reportes y clientes desde esta barra lateral.',
            attachTo: { element: '#mainSidebar', on: 'right' }
        });

        tour.addStep({
            id: 'keyboard-toggle',
            title: 'Teclado Virtual',
            text: '¿Sin teclado físico? Pulsa este botón para abrir el teclado premium flotante.',
            attachTo: { element: '#toggleKeyboardBtn', on: 'bottom' }
        });

        tour.addStep({
            id: 'settings-security',
            title: 'Configuración y Equipo',
            text: 'Entra aquí para personalizar tu ticket y gestionar a tu personal en la nueva sección "Usuarios y Seguridad".',
            attachTo: { element: 'li[data-view="settings"]', on: 'right' }
        });

        tour.addStep({
            id: 'user-switcher',
            title: 'Perfil de Usuario',
            text: 'Aquí abajo puedes ver quién está operando y cambiar de turno o cerrar sesión rápidamente.',
            attachTo: { element: '#userProfileBtn', on: 'top' }
        });

        tour.on('complete', () => {
            localStorage.setItem('aromatic_tour_done', 'true');
        });

        tour.on('cancel', () => {
            localStorage.setItem('aromatic_tour_done', 'true');
        });

        tour.start();
    }




    async checkNotifications() {
        const insumos = await db.getCollection('insumos');
        const lowStock = insumos.filter(i => i.stock <= i.stockMinimo);
        const btn = document.getElementById('notificationsBtn');

        if (btn) {
            let badge = btn.querySelector('.notification-badge');
            if (lowStock.length > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'notification-badge';
                    btn.appendChild(badge);
                }
                badge.style.display = 'block';
            } else if (badge) {
                badge.style.display = 'none';
            }
        }
    }

    updateBranding() {
        const settings = db.getSettings();
        const logoName = document.querySelector('.logo span');
        const logoImg = document.querySelector('.logo img.logo-icon');

        if (logoName) {
            logoName.textContent = settings.negocio.nombre;
        }

        if (logoImg && settings.negocio.logo) {
            logoImg.src = settings.negocio.logo;
        }
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-links li').forEach(li => {
            li.addEventListener('click', () => {
                const view = li.getAttribute('data-view');
                this.switchView(view);
            });
        });

        // Search
        document.getElementById('globalSearch').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Checkout
        document.getElementById('checkoutBtn').addEventListener('click', () => {
            this.handleCheckout();
        });

        // Clear Cart
        document.getElementById('clearCart').addEventListener('click', () => {
            this.clearCart();
        });

        // Multi-Ticket events
        document.getElementById('addNewTicketBtn').onclick = () => this.createNewTicket();

        // Right Panel Tabs
        document.getElementById('tabCart').onclick = () => this.switchPanelTab('cart');
        document.getElementById('tabHistory').onclick = () => this.switchPanelTab('history');

        // Notifications
        document.getElementById('notificationsBtn').onclick = () => this.showNotifications();

        // Customer Selection in Cart
        document.getElementById('selectCustomerBtn').onclick = () => this.showCustomerSelector();
        document.getElementById('removeCustomerBtn').onclick = () => this.removeCustomerFromTicket();
        // History Search
        const histSearch = document.getElementById('historySearch');
        if (histSearch) {
            histSearch.oninput = (e) => this.updateDailyHistoryUI(e.target.value);
        }

        // Image lazy loading smooth transition
        document.addEventListener('load', (e) => {
            if (e.target.tagName === 'IMG') {
                e.target.classList.add('loaded');
            }
        }, true);


        // Login / User Switcher
        document.getElementById('userProfileBtn').onclick = () => this.showUserSwitcher();

        this.initKeyboardShortcuts();
    }

    async showUserSwitcher() {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');
        const usuarios = await db.getCollection('usuarios');

        modalContent.innerHTML = `
            <div style="width: 550px; padding: 10px;">
                <div style="text-align: center; margin-bottom: 35px;">
                    <h1 style="font-family: 'Playfair Display', serif; font-size: 2.2rem; color: var(--primary); margin-bottom: 8px;">Cambio de Turno</h1>
                    <p style="color: var(--text-muted); font-size: 1rem;">Seleccione su perfil para continuar</p>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 20px; margin-bottom: 35px;">
                    ${usuarios.map(u => `
                        <div class="auth-card ${u.rol}" onclick="app.promptPinUI('${u.id}')">
                            <div style="width: 70px; height: 70px; background: #f8fafc; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-weight: 800; color: var(--primary); font-size: 1.6rem; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #f1f5f9;">
                                ${u.avatar || u.nombre.charAt(0)}
                            </div>
                            <h3 style="margin: 0 0 4px 0; font-size: 1.05rem; color: var(--primary); font-weight: 700;">${u.nombre}</h3>
                            <div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: ${this.getRoleColor(u.rol)};">
                                ${u.rol}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <button class="btn-secondary" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="width: 100%; padding: 16px; border-radius: 14px; border-color: #e2e8f0; color: #64748b; font-weight: 700;">
                    VOLVER AL PANEL
                </button>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    getRoleColor(rol) {
        switch (rol) {
            case 'admin': return '#6366f1';
            case 'cajero': return '#10b981';
            case 'mesero': return '#3b82f6';
            default: return '#94a3b8';
        }
    }

    async promptPinUI(userId) {
        const usuarios = await db.getCollection('usuarios');
        const user = usuarios.find(u => u.id === userId);
        const modalContent = document.querySelector('.modal-content');

        modalContent.innerHTML = `
            <div class="pin-auth-container fade-in" style="width: 320px; text-align: center; padding: 0;">
                <div style="margin-bottom: 20px;">
                    <div style="width: 70px; height: 70px; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-weight: 800; color: var(--primary); font-size: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 2px solid #f1f5f9;">
                        ${user.avatar || user.nombre.charAt(0)}
                    </div>
                    <h2 style="font-family: 'Playfair Display', serif; color: var(--primary); margin: 0; font-size: 1.6rem;">${user.nombre}</h2>
                    <p style="color: var(--text-muted); margin-top: 2px; font-size: 0.85rem;">Seguridad de Acceso</p>
                </div>
                
                <div class="pin-dots-container" style="margin: 20px 0 25px;">
                    <div class="pin-input-dot"></div>
                    <div class="pin-input-dot"></div>
                    <div class="pin-input-dot"></div>
                    <div class="pin-input-dot"></div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; max-width: 260px; margin: 0 auto;">
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `
                        <button class="pin-btn ripple" onclick="app.enterPinDigit('${n}', '${userId}')">${n}</button>
                    `).join('')}
                    <button class="pin-btn special ripple" onclick="app.enterPinDigit('clear', '${userId}')" style="color: #ef4444; font-size: 0.7rem;">BORRAR</button>
                    <button class="pin-btn ripple" onclick="app.enterPinDigit('0', '${userId}')">0</button>
                    <button class="pin-btn special ripple" onclick="app.showUserSwitcher()">
                        <i data-lucide="arrow-left" style="width: 20px;"></i>
                    </button>
                </div>

                <div style="margin-top: 25px;">
                    <button class="btn-clear" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="color: #94a3b8; cursor: pointer; border: none; background: none; font-size: 0.85rem; font-weight: 600;">Regresar al Panel</button>
                </div>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        this.currentPinEntry = '';
    }

    enterPinDigit(digit, userId) {
        if (digit === 'clear') {
            this.currentPinEntry = '';
        } else {
            if (this.currentPinEntry.length < 4) {
                this.currentPinEntry += digit;
                audioService.playClick();
            }
        }

        const dots = document.querySelectorAll('.pin-input-dot');
        dots.forEach((dot, idx) => {
            if (idx < this.currentPinEntry.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        });

        if (this.currentPinEntry.length === 4) {
            setTimeout(() => this.loginUser(userId, this.currentPinEntry), 200);
        }
    }

    async loginUser(id, pin) {
        const usuarios = await db.getCollection('usuarios');
        const user = usuarios.find(u => u.id === id);

        if (user && user.clave === pin) {
            db.setCurrentUser(user);
            db.logAction('seguridad', 'inicio_sesion', `Acceso concedido a: ${user.nombre}`);
            document.getElementById('modalContainer').classList.add('hidden');
            this.showToast(`¡Hola de nuevo, ${user.nombre}!`);
            this.applyRolePrivileges();
            this.renderView(this.currentView);
            this.currentPinEntry = '';
        } else {
            audioService.playError();
            this.currentPinEntry = '';

            const container = document.querySelector('.pin-auth-container');
            container.classList.add('shake');

            const dots = document.querySelectorAll('.pin-input-dot');
            dots.forEach(dot => {
                dot.classList.add('error');
            });

            setTimeout(() => {
                container.classList.remove('shake');
                dots.forEach(dot => {
                    dot.classList.remove('error', 'filled');
                });
            }, 600);
        }
    }



    initKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            // Prevent default browser behavior for F-keys (like search or save)
            if (e.key.startsWith('F') && e.key.length > 1) {
                // e.preventDefault(); // Careful with preventDefault on all F keys, usually better to do it per key
            }

            switch (e.key) {
                case 'F12':
                    e.preventDefault();
                    const confirmBtn = document.getElementById('confirmCashPayment');
                    if (confirmBtn && !confirmBtn.disabled) {
                        confirmBtn.click();
                        return;
                    }
                    if (this.currentView === 'pos') {
                        const btn = document.getElementById('checkoutBtn');
                        if (btn && !btn.disabled) btn.click();
                    }
                    break;
                case 'Enter':
                    const confirmPaymentBtn = document.getElementById('confirmCashPayment');
                    if (confirmPaymentBtn && !confirmPaymentBtn.disabled) {
                        e.preventDefault();
                        confirmPaymentBtn.click();
                    }
                    break;
                case 'F2':
                    e.preventDefault();
                    const efectivoBtn = document.getElementById('payEfectivo');
                    if (efectivoBtn) efectivoBtn.click();
                    break;
                case 'F3':
                    e.preventDefault();
                    const tarjetaBtn = document.getElementById('payTarjeta');
                    if (tarjetaBtn) tarjetaBtn.click();
                    break;
                case 'F4':
                    e.preventDefault();
                    const redeemBtn = document.getElementById('redeemPointsBtn');
                    if (redeemBtn && !redeemBtn.disabled) redeemBtn.click();
                    break;
                case 'F1':
                    e.preventDefault();
                    const selectCust = document.getElementById('selectCustomerBtn');
                    if (selectCust) selectCust.click();
                    break;
                case 'Escape':
                    const modal = document.getElementById('modalContainer');
                    if (modal && !modal.classList.contains('hidden')) {
                        modal.classList.add('hidden');
                    }
                    break;
            }
        });
    }

    switchPanelTab(tab) {
        const cartTab = document.getElementById('tabCart');
        const historyTab = document.getElementById('tabHistory');
        const cartSection = document.getElementById('cartSection');
        const historySection = document.getElementById('historySection');

        if (tab === 'cart') {
            cartTab.classList.add('active');
            historyTab.classList.remove('active');
            cartSection.classList.remove('hidden');
            historySection.classList.add('hidden');
        } else {
            cartTab.classList.remove('active');
            historyTab.classList.add('active');
            cartSection.classList.add('hidden');
            historySection.classList.remove('hidden');
            this.updateDailyHistoryUI();
        }
    }

    async updateDailyHistoryUI(query = '') {
        const container = document.getElementById('dailySalesList');
        if (!container) return;

        const searchVal = query.toLowerCase();
        const ventas = await db.getCollection('ventas');

        // Filter for "today" using local date
        const localToday = new Date();
        const localDateStr = localToday.toLocaleDateString('en-CA');

        const todayVentas = ventas
            .filter(v => {
                const ventaDate = new Date(v.fecha);
                const isToday = ventaDate.toLocaleDateString('en-CA') === localDateStr;
                if (!isToday) return false;

                if (!searchVal) return true;

                const folio = (v.id || '').slice(-8).toUpperCase();
                const matchedFolio = folio.includes(searchVal);
                const matchedProduct = v.items.some(i => i.nombre.toLowerCase().includes(searchVal));
                const matchedTotal = v.total.toString().includes(searchVal);
                const matchedMethod = v.metodoPago.toLowerCase().includes(searchVal);

                return matchedFolio || matchedProduct || matchedTotal || matchedMethod;
            })
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        if (todayVentas.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #94a3b8;">
                    <i data-lucide="search-x" style="width: 40px; height: 40px; margin-bottom: 15px; opacity: 0.3;"></i>
                    <p>${query ? 'No se encontraron tickets.' : 'No hay ventas registradas hoy.'}</p>
                </div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        container.innerHTML = todayVentas.map(v => {
            const folio = (v.id || '').slice(-8).toUpperCase();
            const timeStr = new Date(v.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="sale-history-card" style="background: white; border: 1px solid #f1f5f9; border-radius: 16px; padding: 16px; margin-bottom: 12px; transition: all 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                <span style="background: #f8fafc; color: var(--primary); font-size: 0.7rem; font-weight: 800; padding: 2px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">#${folio}</span>
                                <small style="color: #94a3b8; font-weight: 600;">${timeStr}</small>
                            </div>
                            <div style="font-size: 1.25rem; font-weight: 800; color: #000; font-family: 'Outfit', sans-serif;">
                                <span style="font-size: 0.8rem; font-weight: 400; opacity: 0.5;">$</span>${v.total.toFixed(2)}
                            </div>
                        </div>
                        <span class="badge ${v.metodoPago === 'Efectivo' ? 'success' : 'primary'}" style="font-size: 0.65rem; text-transform: uppercase;">
                            ${v.metodoPago}
                        </span>
                    </div>

                    <div style="font-size: 0.8rem; color: #64748b; line-height: 1.4; margin-bottom: 15px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${v.items.map(i => `<span style="font-weight: 600;">${i.quantity}x</span> ${i.nombre}`).join(', ')}
                    </div>

                    <div style="display: flex; gap: 8px;">
                        <button class="btn-secondary" onclick="app.showVentaTicket('${v.id}')" style="flex: 1; padding: 8px; border-radius: 10px; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 6px; background: #fffcf0; border-color: #fef3c7; color: #b45309;">
                            <i data-lucide="receipt" style="width: 14px;"></i> Ticket
                        </button>
                        <button class="btn-icon-small danger" onclick="app.deleteVenta('${v.id}')" style="width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;" title="Anular Venta">
                            <i data-lucide="trash-2" style="width: 14px;"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    async showVentaTicket(id) {
        // We reuse the logic from salesView for consistency
        const ventas = await db.getCollection('ventas');
        const v = ventas.find(item => item.id === id);
        if (v) {
            salesView.ventas = ventas;
            await salesView.showTicket(id, true); // Added true to allow refunds
        }
    }


    updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const clockEl = document.getElementById('clock');
        if (clockEl) clockEl.textContent = timeStr;
    }

    switchView(viewId) {
        // Map sub-views to their parent sidebar items
        const highlightMap = {
            'supplies': 'inventory',
            'waste': 'inventory',
            'users': 'users'
        };
        const activeHighlight = highlightMap[viewId] || viewId;

        document.querySelectorAll('.nav-links li').forEach(li => {
            li.classList.toggle('active', li.getAttribute('data-view') === activeHighlight);
        });

        // Search Bar Visibility Logic
        const searchContainer = document.querySelector('.search-container');
        const searchInput = document.getElementById('globalSearch');
        const viewsWithSearch = ['pos', 'inventory', 'supplies', 'sales', 'customers'];

        if (searchContainer) {
            if (viewsWithSearch.includes(viewId)) {
                searchContainer.style.display = 'flex';
                if (searchInput) {
                    searchInput.value = ''; // Reset value on switch
                    // Reset internal filters
                    if (viewId === 'inventory') inventoryView.filterQuery = '';
                    if (viewId === 'waste') wasteView.filterQuery = '';
                    if (viewId === 'supplies') suppliesView.filterQuery = '';
                    if (viewId === 'sales') salesView.filterQuery = '';
                    if (viewId === 'customers') customersView.filterQuery = '';
                    if (viewId === 'pos') posView.filterQuery = '';
                }
            } else {
                searchContainer.style.display = 'none';
            }
        }

        // Reset Settings to main menu when switching from sidebar
        if (viewId === 'settings') {
            settingsView.activeSubView = 'menu';
        }

        const runSwitch = () => {
            this.currentView = viewId;
            this.renderView(viewId);
        };

        if (document.startViewTransition) {
            document.startViewTransition(() => runSwitch());
        } else {
            runSwitch();
        }
    }

    async renderView(viewId) {
        const container = document.getElementById('view-container');

        // Show Skeleton Template instead of "Cargando..."
        container.innerHTML = this.getSkeletonTemplate(viewId);

        // Hide/Show cart panel depending on view
        const cartPanel = document.getElementById('posCartPanel');
        if (cartPanel) cartPanel.style.display = (viewId === 'pos') ? 'flex' : 'none';

        let html = '';
        switch (viewId) {
            case 'pos': html = await posView.render(); break;
            case 'inventory': html = await inventoryView.render(); break;
            case 'waste': html = await wasteView.render(); break;
            case 'customers': html = await customersView.render(); break;
            case 'supplies': html = await suppliesView.render(); break;
            case 'sales': html = await salesView.render(); break;
            case 'cash-closing': html = await cashClosingView.render(); break;
            case 'settings': html = await settingsView.render(); break;
            case 'tables': html = await tablesView.render(); break;
        }

        container.innerHTML = `<div class="view-enter">${html}</div>`;
        container.scrollTop = 0; // Reset scroll position to top
        if (typeof lucide !== 'undefined') lucide.createIcons();
        this.bindViewEvents(viewId);
        if (viewId === 'pos') this.updateCartUI();
    }

    bindViewEvents(viewId) {
        switch (viewId) {
            case 'pos': posView.bindEvents(this); break;
            case 'inventory': inventoryView.bindEvents(this); break;
            case 'waste': wasteView.bindEvents(this); break;
            case 'customers': customersView.bindEvents(this); break;
            case 'supplies': suppliesView.bindEvents(this); break;
            case 'sales': salesView.bindEvents(this); break;
            case 'cash-closing': cashClosingView.bindEvents(this); break;
            case 'settings': settingsView.bindEvents(this); break;
        }
    }

    getSkeletonTemplate(viewId) {
        const header = `
            <div class="view-header" style="opacity: 0.5;">
                <div>
                    <div class="skeleton" style="width: 250px; height: 32px; margin-bottom: 10px;"></div>
                    <div class="skeleton" style="width: 400px; height: 16px;"></div>
                </div>
                <div class="skeleton" style="width: 150px; height: 45px; border-radius: 12px;"></div>
            </div>
        `;

        if (viewId === 'pos') {
            const cards = Array(8).fill(`
                <div class="skeleton-card">
                    <div class="skeleton-img skeleton"></div>
                    <div class="skeleton skeleton-text" style="width: 60%; margin: 5px auto;"></div>
                    <div class="skeleton skeleton-text" style="width: 40%; margin: 0 auto;"></div>
                </div>
            `).join('');
            return `<div class="fade-in">${header}<div class="product-grid" style="margin-top: 30px;">${cards}</div></div>`;
        }

        if (['inventory', 'supplies', 'sales', 'waste'].includes(viewId)) {
            const rows = Array(6).fill(`
                <div class="skeleton-row skeleton" style="margin-bottom: 10px; opacity: 0.3;"></div>
            `).join('');
            return `<div class="fade-in">${header}<div style="margin-top: 40px; background: white; border-radius: 20px; padding: 20px;">${rows}</div></div>`;
        }

        return `<div class="loading-premium"><div class="skeleton" style="width: 100%; height: 100%; position: fixed; top:0; left:0; opacity: 0.05;"></div></div>`;
    }


    // Multi-Ticket Logic
    createNewTicket() {
        this.ticketCounter++;
        this.tickets.push({ id: this.ticketCounter, cart: [], cliente: null });
        this.activeTicketIdx = this.tickets.length - 1;
        this.updateTicketsUI();
        this.updateCartUI();
    }

    switchTicket(index) {
        if (index >= 0 && index < this.tickets.length) {
            this.activeTicketIdx = index;
            this.updateTicketsUI();
            this.updateCartUI();
        }
    }

    async closeTicket(index, event, skipConfirm = false) {
        if (event) event.stopPropagation();

        const ticket = this.tickets[index];

        // If ticket has items, show an elegant warning
        if (!skipConfirm && ticket.cart.length > 0) {
            const confirmed = await this.showConfirmModal({
                title: '¿Cerrar Orden?',
                message: `La <strong>Orden #${ticket.id}</strong> tiene productos cargados. Si la cierras, se perderán estos cambios.`,
                confirmText: 'Sí, cerrar orden',
                cancelText: 'Cancelar',
                type: 'danger',
                icon: 'alert-circle'
            });

            if (!confirmed) return;
        }

        if (this.tickets.length === 1) {
            this.tickets[0].cart = [];
            this.tickets[0].cliente = null;
        } else {
            this.tickets.splice(index, 1);
            if (this.activeTicketIdx >= this.tickets.length) {
                this.activeTicketIdx = this.tickets.length - 1;
            }
        }
        this.updateTicketsUI();
        this.updateCartUI();
    }

    showConfirmModal({ title, message, confirmText, cancelText, type = 'primary', icon = 'help-circle' }) {
        return new Promise((resolve) => {
            const modal = document.getElementById('modalContainer');
            const modalContent = modal.querySelector('.modal-content');

            const colorMain = type === 'danger' ? '#e11d48' : 'var(--primary)';
            const colorBg = type === 'danger' ? '#fff1f2' : 'rgba(75, 54, 33, 0.05)';
            const colorBorder = type === 'danger' ? '#ffe4e6' : 'rgba(75, 54, 33, 0.1)';

            modalContent.innerHTML = `
                <div style="text-align: center; padding: 10px; max-width: 380px; margin: 0 auto;">
                    <div style="width: 70px; height: 70px; background: ${colorBg}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 4px solid ${colorBorder};">
                        <i data-lucide="${icon}" style="color: ${colorMain}; width: 35px; height: 35px;"></i>
                    </div>
                    <h2 style="color: var(--primary); margin-bottom: 12px; font-size: 1.6rem; font-family: 'Playfair Display', serif;">${title}</h2>
                    <p style="color: var(--text-muted); margin-bottom: 30px; line-height: 1.5; font-size: 1rem;">${message}</p>
                    
                    <div style="display: flex; gap: 12px;">
                        <button class="btn-secondary" id="confirmCancelBtn" style="flex: 1; padding: 14px; border-radius: 12px; font-weight: 600;">
                            ${cancelText}
                        </button>
                        <button class="btn-primary" id="confirmOkBtn" style="flex: 1.5; padding: 14px; background: ${colorMain}; border: none; border-radius: 12px; font-weight: 700; box-shadow: 0 4px 12px ${type === 'danger' ? 'rgba(225, 29, 72, 0.2)' : 'rgba(0,0,0,0.1)'};">
                            ${confirmText}
                        </button>
                    </div>
                </div>
            `;

            if (typeof lucide !== 'undefined') lucide.createIcons();
            modal.classList.remove('hidden');
            audioService.playPop(); // Premium sound

            document.getElementById('confirmCancelBtn').onclick = () => {
                modal.classList.add('hidden');
                resolve(false);
            };

            document.getElementById('confirmOkBtn').onclick = () => {
                modal.classList.add('hidden');
                resolve(true);
            };
        });
    }

    updateTicketsUI() {
        const container = document.getElementById('ticketTabs');
        if (!container) return;

        container.innerHTML = this.tickets.map((t, idx) => `
            <div class="ticket-tab ${idx === this.activeTicketIdx ? 'active' : ''}" onclick="app.switchTicket(${idx})">
                <span>Orden #${t.id}</span>
                ${this.tickets.length > 1 || t.cart.length > 0 ? `<span class="tab-close" onclick="app.closeTicket(${idx}, event)">&times;</span>` : ''}
            </div>
        `).join('');

        const title = document.getElementById('currentTicketTitle');
        if (title) title.textContent = `Orden #${this.tickets[this.activeTicketIdx].id}`;
    }

    // Cart Logic
    async addToCart(product, index = null) {
        const cart = this.cart;
        let targetItem = null;

        if (typeof index === 'number' && cart[index]) {
            targetItem = cart[index];
        } else if (product) {
            // Se llamó desde el grid: buscar una entrada "limpia" (sin notas ni extras)
            targetItem = cart.find(item =>
                item.id === product.id &&
                (!item.extras || item.extras.length === 0) &&
                (!item.omitted || item.omitted.length === 0) &&
                (!item.nota)
            );
        }

        if (!targetItem && !product) return;

        const productId = targetItem ? targetItem.id : product.id;

        // Calcular cantidad total deseada para este producto en EL ticket activo
        const currentTotalInTicket = cart
            .filter(item => item.id === productId)
            .reduce((sum, item) => sum + item.quantity, 0);

        const nextTotalInTicket = currentTotalInTicket + 1;

        // Stock Validation (ahora pasamos el total deseado en este ticket)
        const canAdd = await this.validateStock(productId, nextTotalInTicket);
        if (!canAdd) return;

        if (targetItem) {
            targetItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1, extras: [], omitted: [], nota: '' });
        }

        // Cart Jump Effect
        const cartTab = document.getElementById('tabCart');
        if (cartTab) {
            cartTab.classList.remove('cart-jump');
            void cartTab.offsetWidth; // Trigger reflow
            cartTab.classList.add('cart-jump');
        }

        audioService.playClick(); // Premium sound
        this.updateCartUI();
    }

    async validateStock(productId, activeTicketTargetTotal) {
        const productos = await db.getCollection('productos');
        const targetProd = productos.find(p => p.id === productId);

        if (!targetProd || !targetProd.insumos || targetProd.insumos.length === 0) return true;

        const allInsumos = await db.getCollection('insumos');

        const virtualInsumos = allInsumos.map(ins => {
            let committedInOtherTickets = 0;

            this.tickets.forEach((ticket, tIdx) => {
                if (tIdx === this.activeTicketIdx) return; // Ignorar ticket activo (se suma aparte)

                ticket.cart.forEach(cartItem => {
                    if (cartItem.id === productId) {
                        const recipeEntry = targetProd.insumos.find(ri => ri.idInsumo === ins.id);
                        if (recipeEntry) {
                            committedInOtherTickets += (recipeEntry.cantidad * cartItem.quantity);
                        }
                    } else {
                        // Otros productos en otros tickets que usen este insumo
                        const p = productos.find(prod => prod.id === cartItem.id);
                        if (p && p.insumos) {
                            const recipeEntry = p.insumos.find(ri => ri.idInsumo === ins.id);
                            if (recipeEntry) {
                                committedInOtherTickets += (recipeEntry.cantidad * cartItem.quantity);
                            }
                        }
                    }
                });
            });

            return { ...ins, virtualAvailable: ins.stock - committedInOtherTickets };
        });

        let stockInsuficiente = [];

        for (const recipeItem of targetProd.insumos) {
            const vInsumo = virtualInsumos.find(vi => vi.id === recipeItem.idInsumo);
            if (vInsumo) {
                const totalRequired = recipeItem.cantidad * activeTicketTargetTotal;
                if (vInsumo.virtualAvailable < totalRequired) {
                    stockInsuficiente.push({
                        nombre: vInsumo.nombre,
                        disponible: Math.max(0, vInsumo.virtualAvailable),
                        requerido: totalRequired,
                        unidad: vInsumo.unidad
                    });
                }
            }
        }

        if (stockInsuficiente.length > 0) {
            this.showStockAlert(targetProd.nombre, stockInsuficiente);
            return false;
        }

        return true;
    }

    showStockAlert(productName, missingItems) {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        modalContent.innerHTML = `
            <div style="text-align: center; padding: 10px;">
                <div style="width: 70px; height: 70px; background: #fff1f2; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; border: 4px solid #ffe4e6;">
                    <i data-lucide="alert-triangle" style="color: #e11d48; width: 35px; height: 35px;"></i>
                </div>
                <h2 style="color: #9f1239; margin-bottom: 10px; font-size: 1.5rem;">Insumos Insuficientes</h2>
                <p style="color: #4b5563; margin-bottom: 24px;">No hay suficiente inventario para preparar <strong>${productName}</strong>.</p>
                
                <div style="background: #fdf2f2; border-radius: 16px; padding: 16px; margin-bottom: 24px; text-align: left; border: 1px solid #fee2e2;">
                    <h4 style="margin-top: 0; margin-bottom: 12px; font-size: 0.9rem; color: #9f1239; text-transform: uppercase; letter-spacing: 0.05em;">Faltantes detectados:</h4>
                    ${missingItems.map(item => `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.95rem;">
                            <span style="font-weight: 500;">${item.nombre}</span>
                            <span style="color: #e11d48; font-weight: 700;">${item.disponible} ${item.unidad} <span style="font-weight: 400; color: #9ca3af; font-size: 0.8rem;">(necesitas ${item.requerido})</span></span>
                        </div>
                    `).join('')}
                </div>

                <button class="btn-primary" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="width: 100%; padding: 16px; font-size: 1.1rem; background: #e11d48; border: none; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.3);">
                    Entendido
                </button>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        modal.classList.remove('hidden');
    }

    deleteFromCart(index) {
        const cart = this.cart;
        if (cart[index]) {
            cart.splice(index, 1);
            audioService.playClick();
            this.updateCartUI();
        }
    }

    removeFromCart(index) {
        const cart = this.cart;
        if (cart[index]) {
            if (cart[index].quantity > 1) {
                cart[index].quantity--;
            } else {
                cart.splice(index, 1);
            }
            audioService.playClick(); // Premium sound
            this.updateCartUI();
        }
    }

    clearCart() {
        this.tickets[this.activeTicketIdx].cart = [];
        this.tickets[this.activeTicketIdx].cliente = null;
        this.updateCartUI();
    }

    async updateCartUI() {
        const container = document.getElementById('cartItems');
        if (!container) return;

        const cart = this.cart;

        // Always render customer regardless of cart state
        this.renderCustomerInCart();

        if (cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <i data-lucide="shopping-cart"></i>
                    <p>No hay productos en la orden</p>
                </div>`;
            this.updateSummary(0);
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        // Load insumos to display omitted ingredients
        const allInsumos = await db.getCollection('insumos');

        container.innerHTML = cart.map((item, idx) => `
            <div class="swipe-container" data-index="${idx}" 
                 style="position: relative; overflow: hidden; border-radius: 16px; margin-bottom: 8px;">
                <div class="swipe-action left-action" style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: #22c55e; color: white; display: flex; align-items: center; padding-left: 20px; transition: opacity 0.3s; opacity: 0; border-radius: 16px;">
                    <i data-lucide="plus" style="width: 24px; height: 24px;"></i>
                    <span style="font-weight: 800; margin-left: 10px;">AÑADIR</span>
                </div>
                <div class="swipe-action right-action" style="position: absolute; right: 0; top: 0; width: 100%; height: 100%; background: #e11d48; color: white; display: flex; align-items: center; justify-content: flex-end; padding-right: 20px; transition: opacity 0.3s; opacity: 0; border-radius: 16px;">
                    <span style="font-weight: 800; margin-right: 10px;">ELIMINAR</span>
                    <i data-lucide="trash-2" style="width: 24px; height: 24px;"></i>
                </div>
                <div class="cart-item" style="position: relative; z-index: 2; margin-bottom: 0; transition: transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);">
                    <div class="cart-item-info">
                        <div class="cart-item-header">
                            <span class="cart-item-name">${item.nombre}</span>
                            <button class="btn-edit-item" onclick="app.showCustomizeModal(${idx})" title="Personalizar (Notas/Extras)">
                                <i data-lucide="pencil" style="width: 18px; height: 18px;"></i>
                            </button>
                        </div>
                        <span class="cart-item-price">$${item.precio.toFixed(2)} c/u</span>
                        ${item.nota ? `<div class="cart-item-note"><i data-lucide="message-square" style="width: 12px; height: 12px;"></i> ${item.nota}</div>` : ''}
                        ${item.omitted && item.omitted.length > 0 ? `
                            <div class="cart-item-extras" style="margin-top: 4px;">
                                ${item.omitted.map(id => {
            const ins = allInsumos.find(i => i.id === id);
            return `<span style="background: #fff1f2; color: #991b1b; border: 1px solid #fecaca;"><i data-lucide="minus" style="width: 10px; height: 10px; margin-right: 2px;"></i>Sin ${ins ? ins.nombre : 'ingrediente'}</span>`;
        }).join('')}
                            </div>
                        ` : ''}
                        ${item.extras && item.extras.length > 0 ? `
                            <div class="cart-item-extras">
                                ${item.extras.map(e => `<span>${e.nombre}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="cart-item-controls">
                        <div class="cart-item-total">
                            $${((item.precio + (item.extras ? item.extras.reduce((s, e) => s + e.precio, 0) : 0)) * item.quantity).toFixed(2)}
                        </div>
                        <div class="quantity-controls">
                            <button class="qty-btn" onclick="app.removeFromCart(${idx})" title="Restar">
                                <i data-lucide="minus" style="width: 14px; height: 14px;"></i>
                            </button>
                            <span style="font-weight: 700; min-width: 20px; text-align: center;">${item.quantity}</span>
                            <button class="qty-btn" onclick="app.addToCart(null, ${idx})" title="Sumar">
                                <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        this.initCartSwipes();

        const subtotal = cart.reduce((sum, item) => {
            const extrasTotal = item.extras ? item.extras.reduce((s, e) => s + e.precio, 0) : 0;
            return sum + ((item.precio + extrasTotal) * item.quantity);
        }, 0);
        this.updateSummary(subtotal);
        this.renderCustomerInCart();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    renderCustomerInCart() {
        const ticket = this.tickets[this.activeTicketIdx];
        const display = document.getElementById('selectedCustomerDisplay');
        const selectBtn = document.getElementById('selectCustomerBtn');

        if (ticket.cliente) {
            display.style.display = 'flex';
            selectBtn.style.display = 'none';
            document.getElementById('customerNameInCart').textContent = ticket.cliente.nombre;
            document.getElementById('customerPointsInCart').textContent = `${ticket.cliente.puntos || 0} pts`;

            const removeBtn = document.getElementById('removeCustomerBtn');
            if (removeBtn) {
                removeBtn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.removeCustomerFromTicket();
                };
            }
        } else {
            display.style.display = 'none';
            selectBtn.style.display = 'flex';
        }
    }

    async showCustomerSelector() {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');
        const clientes = await db.getCollection('clientes');

        modalContent.innerHTML = `
            <div style="width: 450px;">
                <h2 style="margin-bottom: 20px;">Seleccionar Cliente</h2>
                <div class="input-group" style="margin-bottom: 20px;">
                    <input type="text" id="custSearchModal" placeholder="Buscar por nombre o teléfono..." class="large-input">
                </div>
                <div id="modalCustList" style="max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
                    <!-- Clientes list here -->
                </div>
                <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #eee; display: flex; gap: 12px;">
                    <button class="btn-secondary" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="flex: 1;">Cancelar</button>
                    <button class="btn-primary" id="modalAddNewCust" style="flex: 1; background: var(--success); border-color: var(--success);">+ Nuevo Cliente</button>
                </div>
            </div>
        `;

        const renderList = (filter = '') => {
            const list = document.getElementById('modalCustList');
            const filtered = clientes.filter(c =>
                c.nombre.toLowerCase().includes(filter.toLowerCase()) ||
                (c.telefono && c.telefono.includes(filter))
            );

            list.innerHTML = filtered.map(c => `
                <div class="card customer-select-item" onclick="app.selectCustomerForTicket('${c.id}')" style="padding: 12px 18px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s;">
                    <div>
                        <span style="display: block; font-weight: 600;">${c.nombre}</span>
                        <small style="color: #666;">${c.telefono || 'Sin tel'}</small>
                    </div>
                    <span class="badge primary">${c.puntos || 0} pts</span>
                </div>
            `).join('');
            if (filtered.length === 0) list.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No se encontraron clientes.</p>';
        };

        modal.classList.remove('hidden');
        audioService.playPop(); // Premium sound
        renderList();

        document.getElementById('custSearchModal').oninput = (e) => renderList(e.target.value);
        document.getElementById('modalAddNewCust').onclick = () => {
            modal.classList.add('hidden');
            this.switchView('customers');
            setTimeout(() => customersView.showCustomerModal(), 100);
        };
    }

    async selectCustomerForTicket(id) {
        const clientes = await db.getCollection('clientes');
        const cliente = clientes.find(c => c.id === id);
        if (cliente) {
            this.tickets[this.activeTicketIdx].cliente = cliente;
            document.getElementById('modalContainer').classList.add('hidden');
            this.updateCartUI();
        }
    }

    removeCustomerFromTicket() {
        this.tickets[this.activeTicketIdx].cliente = null;
        this.updateCartUI();
    }

    async showCustomizeModal(index) {
        const item = this.cart[index];
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        const productos = await db.getCollection('productos');
        const product = productos.find(p => p.id === item.id);
        const allInsumos = await db.getCollection('insumos');

        const recipeIngredients = [];
        const possibleExtras = [];

        if (product && product.insumos) {
            product.insumos.forEach(ri => {
                const ins = allInsumos.find(i => i.id === ri.idInsumo);
                if (ins) {
                    recipeIngredients.push(ins);
                    if (ins.precioExtra > 0) {
                        possibleExtras.push(ins);
                    }
                }
            });
        }

        modalContent.innerHTML = `
            <div class="customize-modal" style="width: 450px;">
                <h2 style="margin-bottom: 20px; font-family: 'Playfair Display', serif;">Personalizar: ${item.nombre}</h2>
                
                <!-- Recipe Ingredients Section -->
                <div style="margin-bottom: 24px;">
                    <h3 style="font-size: 1rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; color: var(--primary);">
                        <i data-lucide="info" style="width: 16px; color: var(--primary);"></i> Ingredientes incluidos
                    </h3>
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">Desmarque los ingredientes que el cliente no desea incluir.</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        ${recipeIngredients.map(ins => {
            const isIncluded = !(item.omitted && item.omitted.includes(ins.id));
            return `
                                <label style="display: flex; align-items: center; gap: 10px; padding: 10px; background: ${isIncluded ? '#f8f8f8' : '#fff1f2'}; border: 1px solid ${isIncluded ? '#eee' : '#fecaca'}; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
                                    <input type="checkbox" class="include-recipe-checkbox" data-id="${ins.id}" ${isIncluded ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary);">
                                    <span style="font-size: 0.9rem; font-weight: 500; color: ${isIncluded ? 'var(--primary)' : '#991b1b'}">${ins.nombre}</span>
                                </label>
                            `;
        }).join('')}
                    </div>
                </div>

                <!-- Extras Section -->
                <div class="extras-section" style="margin-bottom: 24px;">
                    <h3 style="font-size: 1rem; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; color: var(--primary);">
                        <i data-lucide="plus-circle" style="width: 16px; color: var(--success);"></i> ¿Agregar extras?
                    </h3>
                    ${possibleExtras.length === 0 ?
                '<p style="color: #999; font-size: 0.85rem; background: #f8f8f8; padding: 15px; border-radius: 12px; text-align: center;">No hay extras disponibles.</p>' :
                `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            ${possibleExtras.map(ins => {
                    const isAdded = item.extras && item.extras.find(e => e.idInsumo === ins.id);
                    return `
                                    <label class="extra-option" style="display: flex; align-items: center; gap: 10px; padding: 10px; background: ${isAdded ? '#f0fdf4' : '#fff'}; border: 1px solid ${isAdded ? '#bbf7d0' : '#eee'}; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
                                        <input type="checkbox" class="extra-checkbox" data-id="${ins.id}" data-nombre="${ins.nombre}" data-precio="${ins.precioExtra}" ${isAdded ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--success);">
                                        <div>
                                            <span style="display: block; font-weight: 500; font-size: 0.9rem;">${ins.nombre}</span>
                                            <small style="color: #15803d; font-weight: 600;">+$${ins.precioExtra.toFixed(2)}</small>
                                        </div>
                                    </label>
                                `;
                }).join('')}
                        </div>`
            }
                </div>

                ${item.quantity > 1 ? `
                    <div style="margin-bottom: 24px; padding: 15px; background: rgba(226, 150, 93, 0.08); border-radius: 16px; border: 1px solid rgba(226, 150, 93, 0.2);">
                        <h4 style="margin: 0 0 10px 0; font-size: 0.9rem; color: var(--primary); display: flex; align-items: center; gap: 8px;">
                            <i data-lucide="copy-plus" style="width: 16px;"></i> Unidades a personalizar
                        </h4>
                        <div style="display: flex; gap: 10px;">
                            <label style="flex: 1; display: flex; align-items: center; gap: 8px; cursor: pointer; background: white; padding: 10px; border-radius: 12px; border: 1px solid #ddd;">
                                <input type="radio" name="splitOption" value="all" checked style="accent-color: var(--primary);">
                                <span style="font-size: 0.85rem; font-weight: 600;">Todas (${item.quantity})</span>
                            </label>
                            <label style="flex: 1; display: flex; align-items: center; gap: 8px; cursor: pointer; background: white; padding: 10px; border-radius: 12px; border: 1px solid #ddd;">
                                <input type="radio" name="splitOption" value="one" style="accent-color: var(--primary);">
                                <span style="font-size: 0.85rem; font-weight: 600;">Solo 1 unidad</span>
                            </label>
                        </div>
                        <p style="margin: 8px 0 0; font-size: 0.75rem; color: var(--text-muted);">Si eliges "Solo 1", se creará una línea separada para esta personalización.</p>
                    </div>
                ` : ''}

                <div class="input-group" style="margin-bottom: 24px;">
                    <label style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.9rem; margin-bottom: 8px; color: var(--text-muted);">
                        <i data-lucide="message-square" style="width: 16px;"></i> Instrucciones Especiales
                    </label>
                    <textarea id="itemNota" class="large-input" style="height: 60px; font-size: 0.9rem; padding: 12px; resize: none; border-radius: 12px;">${item.note || item.nota || ''}</textarea>
                </div>

                <div style="display: flex; gap: 12px;">
                    <button class="btn-secondary" id="cancelCustomize" style="flex: 1; padding: 14px;">Cancelar</button>
                    <button class="btn-primary" id="saveCustomize" style="flex: 2; padding: 14px; font-weight: 700;">Aplicar Cambios</button>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        modal.classList.remove('hidden');

        document.getElementById('cancelCustomize').onclick = () => modal.classList.add('hidden');
        document.getElementById('saveCustomize').onclick = () => {
            const nota = document.getElementById('itemNota').value.trim();
            const extras = [];
            const omitted = [];

            modal.querySelectorAll('.extra-checkbox:checked').forEach(cb => {
                extras.push({
                    idInsumo: cb.getAttribute('data-id'),
                    nombre: cb.getAttribute('data-nombre'),
                    precio: parseFloat(cb.getAttribute('data-precio'))
                });
            });

            // If it is NOT checked, it means it's omitted
            modal.querySelectorAll('.include-recipe-checkbox:not(:checked)').forEach(cb => {
                omitted.push(cb.getAttribute('data-id'));
            });

            const splitOption = modal.querySelector('input[name="splitOption"]:checked')?.value || 'all';

            if (splitOption === 'one' && this.cart[index].quantity > 1) {
                // Separar 1 unidad
                this.cart[index].quantity--;
                const newItem = {
                    ...JSON.parse(JSON.stringify(this.cart[index])), // Copia profunda de la base
                    quantity: 1,
                    nota,
                    extras,
                    omitted
                };
                this.cart.push(newItem);
            } else {
                // Aplicar a todas las unidades de esta línea
                this.cart[index].nota = nota;
                this.cart[index].extras = extras;
                this.cart[index].omitted = omitted;
            }

            db.logAction('pos', 'personalizar_producto', `Item: ${item.nombre}, Nota: ${nota || 'Ninguna'}, Extras: ${extras.length}, Omitidos: ${omitted.length}`);

            modal.classList.add('hidden');
            this.updateCartUI();
        };
    }

    async updateSummary(subtotal) {
        const settings = db.getSettings();
        const cart = this.cart;
        const activePromos = await db.getActivePromotions();

        let totalDiscount = 0;

        // Apply Promotions
        if (activePromos.length > 0 && cart.length > 0) {
            activePromos.forEach(promo => {
                // Filter items in cart that apply to this promo
                const eligibleItems = cart.filter(item => {
                    if (promo.aplicaA === 'productos') return promo.itemsIds.includes(item.id);
                    if (promo.aplicaA === 'categorias') return item.categoria === promo.categoria;
                    return false;
                });

                if (eligibleItems.length > 0) {
                    if (promo.tipo === '2x1') {
                        eligibleItems.forEach(item => {
                            if (item.quantity >= 2) {
                                const freeUnits = Math.floor(item.quantity / 2);
                                totalDiscount += (item.precio * freeUnits);
                            }
                        });
                    } else if (promo.tipo === 'porcentaje') {
                        eligibleItems.forEach(item => {
                            totalDiscount += (item.precio * item.quantity * (promo.valor / 100));
                        });
                    } else if (promo.tipo === 'monto_fijo') {
                        eligibleItems.forEach(item => {
                            totalDiscount += (promo.valor * item.quantity);
                        });
                    }
                }
            });
        }

        const discountedSubtotal = Math.max(0, subtotal - totalDiscount);
        const taxRate = settings.manejarIVA ? (settings.porcentajeIVA / 100) : 0;
        const tax = discountedSubtotal * taxRate;
        const total = discountedSubtotal + tax;

        const subEl = document.getElementById('cartSubtotal');
        const taxEl = document.getElementById('cartTax');
        const promoEl = document.getElementById('cartPromo');
        const promoRow = document.getElementById('promoRow');
        const totEl = document.getElementById('cartTotal');

        if (subEl) subEl.textContent = `$${subtotal.toFixed(2)}`;

        if (promoEl && promoRow) {
            if (totalDiscount > 0) {
                promoEl.textContent = `-$${totalDiscount.toFixed(2)}`;
                promoRow.style.display = 'flex';
            } else {
                promoRow.style.display = 'none';
            }
        }

        if (taxEl) {
            taxEl.textContent = `$${tax.toFixed(2)}`;
            taxEl.parentElement.style.display = settings.manejarIVA ? 'flex' : 'none';
        }

        if (totEl) totEl.textContent = `$${total.toFixed(2)}`;

        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) checkoutBtn.disabled = subtotal === 0;

        // Store active discount in current ticket for payment/ticket generation
        this.tickets[this.activeTicketIdx].totalDescuento = totalDiscount;
        this.tickets[this.activeTicketIdx].promocionesAplicadas = activePromos;


        // --- Table Logic Integration ---
        const currentTicket = this.tickets[this.activeTicketIdx];
        const cartFooter = document.querySelector('.cart-footer');

        // Remove old elements
        const existingBanner = document.getElementById('tableBanner');
        if (existingBanner) existingBanner.remove();

        const tableSaveBtn = document.getElementById('saveTableBtn');
        if (tableSaveBtn) tableSaveBtn.remove();

        if (checkoutBtn) checkoutBtn.style.display = 'flex'; // Reset visibility

        if (currentTicket && currentTicket.mesaId) {
            // Add Banner
            if (cartFooter) {
                const banner = document.createElement('div');
                banner.id = 'tableBanner';
                banner.style.cssText = 'background: #eff6ff; color: #1e3a8a; padding: 10px; margin-bottom: 10px; border-radius: 8px; font-weight: bold; text-align: center; border: 1px solid #bfdbfe; display: flex; justify-content: space-between; align-items: center;';
                banner.innerHTML = `<span><i data-lucide="armchair" style="width:16px; margin-right:5px; vertical-align:middle;"></i> Mesa ${currentTicket.mesaId}</span> <button class="btn-icon-small" onclick="app.switchView('tables')" style="background:white; width: 24px; height: 24px;" title="Salir sin guardar"><i data-lucide="x" style="width:14px;"></i></button>`;
                cartFooter.insertBefore(banner, cartFooter.firstChild);
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }

            // Add Save Button
            if (checkoutBtn) {
                const saveBtn = document.createElement('button');
                saveBtn.id = 'saveTableBtn';
                saveBtn.className = 'btn-primary';
                saveBtn.style.cssText = 'width: 100%; margin-bottom: 10px; background: #f59e0b; border-color: #f59e0b; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: bold; padding: 16px;';
                saveBtn.innerHTML = '<i data-lucide="save"></i> GUARDAR / COMANDAR';
                saveBtn.onclick = () => this.saveTableOrder();

                checkoutBtn.parentNode.insertBefore(saveBtn, checkoutBtn);
                checkoutBtn.className = 'btn-checkout'; // Keep consistent class
                checkoutBtn.innerHTML = 'COBRAR Y CERRAR <i data-lucide="banknote"></i>';
                checkoutBtn.style.border = '2px solid #22c55e';
                checkoutBtn.style.color = '#15803d';
                checkoutBtn.style.background = '#f0fdf4';
            }
        } else {
            // Reset checkout button style for normal orders
            if (checkoutBtn) {
                checkoutBtn.className = 'btn-checkout';
                checkoutBtn.innerHTML = `
                    <span style="display: flex; align-items: center; gap: 8px;">
                        COBRAR <small style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; border: 1px solid rgba(255,255,255,0.3);">F12</small>
                    </span>
                    <i data-lucide="banknote"></i>
                `;
                checkoutBtn.style.border = '';
                checkoutBtn.style.color = '';
                checkoutBtn.style.background = '';
            }
        }
    }

    async handleCheckout() {
        const settings = db.getSettings();
        const currentTicket = this.tickets[this.activeTicketIdx];
        const cliente = currentTicket.cliente;
        const cart = this.cart;
        if (cart.length === 0) return;

        const subtotal = cart.reduce((sum, item) => {
            const extrasTotal = item.extras ? item.extras.reduce((s, e) => s + e.precio, 0) : 0;
            return sum + ((item.precio + extrasTotal) * item.quantity);
        }, 0);
        const promoDiscount = currentTicket.totalDescuento || 0;
        const discountedSubtotal = Math.max(0, subtotal - promoDiscount);

        const taxRate = settings.manejarIVA ? (settings.porcentajeIVA / 100) : 0;
        const tax = discountedSubtotal * taxRate;
        const total = discountedSubtotal + tax;

        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        const totalOriginal = total;
        let descuentoPuntos = 0;
        let puntosCanjeados = 0;
        let finalTotal = totalOriginal;


        const showMainMethods = () => {
            finalTotal = totalOriginal - descuentoPuntos;
            modalContent.innerHTML = `
                <div class="checkout-modal" style="width: 480px;">
                    <div style="text-align: center; margin-bottom: 35px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
                        <span style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Total a Pagar</span>
                        <h2 style="font-size: 4rem; color: #000; margin: 10px 0; font-family: 'Playfair Display', serif; font-weight: 800; letter-spacing: -1px; display: flex; align-items: baseline; justify-content: center; gap: 8px;">
                            <span style="font-family: 'Outfit', sans-serif; font-size: 2.4rem; font-weight: 300; opacity: 0.3; color: #000;">$</span>
                            ${finalTotal.toFixed(2)}
                        </h2>
                        ${descuentoPuntos > 0 ? `
                            <div class="loyalty-applied-badge" style="justify-content: center; margin: 0 auto; width: fit-content; background: #f0fdf4; border-color: #bbf7d0; color: #166534;">
                                <i data-lucide="sparkles" style="width: 14px;"></i> Puntos aplicados: -$${descuentoPuntos.toFixed(2)} (${puntosCanjeados} pts)
                            </div>
                        ` : ''}
                    </div>

                    ${cliente && settings.fidelizacion.activo ? `
                        <div class="loyalty-card">
                            <div class="loyalty-card-header">
                                <div>
                                    <div class="loyalty-card-title">Programa de Fidelidad</div>
                                    <div style="font-size: 1.1rem; font-weight: 600; margin-top: 4px;">${cliente.nombre}</div>
                                </div>
                                <div style="background: rgba(255,255,255,0.2); width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                                    <i data-lucide="award" style="color: var(--accent); width: 24px; height: 24px;"></i>
                                </div>
                            </div>
                            
                            <div style="margin-top: 5px; position: relative; z-index: 1;">
                                <div class="loyalty-balance">${cliente.puntos || 0} <span style="font-size: 1rem; opacity: 0.7;">pts</span></div>
                                <div class="loyalty-value">Disponibles para canje: $${((cliente.puntos || 0) * settings.fidelizacion.valorPunto).toFixed(2)} MXN</div>
                            </div>

                            <div class="loyalty-action">
                                ${descuentoPuntos > 0 ? `
                                    <button class="btn-loyalty-cancel" id="cancelPointsBtn">Quitar Puntos</button>
                                    <div class="loyalty-applied-badge">
                                        <i data-lucide="check-circle" style="width: 14px;"></i> Descuento Aplicado
                                    </div>
                                ` : `
                                    <button class="btn-loyalty-redeem" id="redeemPointsBtn" ${cliente.puntos < settings.fidelizacion.puntosParaCanje ? 'disabled' : ''}>
                                        <i data-lucide="zap" style="width: 16px;"></i> USAR MIS PUNTOS <small style="margin-left: 5px; opacity: 0.8;">[F4]</small>
                                    </button>
                                    ${cliente.puntos < settings.fidelizacion.puntosParaCanje ? `
                                        <div style="font-size: 0.75rem; opacity: 0.8; align-self: center; background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 6px;">Mínimo ${settings.fidelizacion.puntosParaCanje} pts</div>
                                    ` : ''}
                                `}
                            </div>
                        </div>
                    ` : ''}

                    <p style="color: var(--text-muted); margin-bottom: 16px; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">Seleccione método de pago</p>
                    <div class="payment-methods" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <button class="btn-payment" id="payEfectivo" style="padding: 24px; position:relative; display: flex; flex-direction: column; gap: 12px; align-items: center; border-radius: 20px; border: 2px solid #eee; background: white; cursor: pointer; transition: all 0.2s;">
                            <small style="position:absolute; top:10px; right:10px; background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; color: #666; border: 1px solid #ddd;">F2</small>
                            <i data-lucide="banknote" style="width: 32px; height: 32px; color: var(--success);"></i>
                            <span style="font-weight: 700;">Efectivo</span>
                        </button>
                        <button class="btn-payment" id="payTarjeta" style="padding: 24px; position:relative; display: flex; flex-direction: column; gap: 12px; align-items: center; border-radius: 20px; border: 2px solid #eee; background: white; cursor: pointer; transition: all 0.2s;">
                            <small style="position:absolute; top:10px; right:10px; background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; color: #666; border: 1px solid #ddd;">F3</small>
                            <i data-lucide="credit-card" style="width: 32px; height: 32px; color: var(--primary);"></i>
                            <span style="font-weight: 700;">Tarjeta</span>
                        </button>
                    </div>
                    <button class="btn-secondary" id="closeModal" style="margin-top: 24px; width: 100%; padding: 16px; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i data-lucide="x-circle" style="width: 18px;"></i> Cancelar Cobro
                    </button>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();

            document.getElementById('closeModal').onclick = () => modal.classList.add('hidden');
            document.getElementById('payTarjeta').onclick = () => processPayment('Tarjeta');
            document.getElementById('payEfectivo').onclick = showCashPayment;

            const redeemBtn = document.getElementById('redeemPointsBtn');
            if (redeemBtn) {
                redeemBtn.onclick = () => {
                    // Animación visual antes de refrescar
                    redeemBtn.innerHTML = '<i data-lucide="refresh-cw" class="spin"></i> Aplicando...';
                    if (typeof lucide !== 'undefined') lucide.createIcons();

                    setTimeout(() => {
                        const maxPossibleDiscount = totalOriginal;
                        const pointsNeededForTotal = Math.ceil(maxPossibleDiscount / settings.fidelizacion.valorPunto);

                        puntosCanjeados = Math.min(cliente.puntos, pointsNeededForTotal);
                        descuentoPuntos = puntosCanjeados * settings.fidelizacion.valorPunto;

                        showMainMethods(); // Refresh modal
                    }, 400);
                };
            }

            const cancelBtn = document.getElementById('cancelPointsBtn');
            if (cancelBtn) {
                cancelBtn.onclick = () => {
                    puntosCanjeados = 0;
                    descuentoPuntos = 0;
                    showMainMethods();
                };
            }
        };

        const showCashPayment = () => {
            finalTotal = totalOriginal - descuentoPuntos;
            modalContent.innerHTML = `
                <div class="cash-payment-modal" style="width: 450px;">
                    <h2 style="font-size: 2rem; margin-bottom: 8px; font-family: 'Playfair Display', serif; color: var(--primary);">Pago en Efectivo</h2>
                    <div style="margin-bottom: 30px; padding: 15px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: var(--text-muted); font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;">Efectivo a Cobrar</span>
                        <strong style="font-size: 1.8rem; font-family: 'Playfair Display', serif; color: #000; display: flex; align-items: baseline; gap: 4px;">
                            <span style="font-family: 'Outfit', sans-serif; font-size: 1.2rem; opacity: 0.3; font-weight: 300; color: #000;">$</span>
                            ${finalTotal.toFixed(2)}
                        </strong>
                    </div>
                    
                    <div class="input-group">
                        <label>Efectivo Recibido</label>
                        <input type="number" id="cashReceived" placeholder="0.00" class="large-input" autofocus>
                    </div>

                    <div id="changeContainer" style="margin-top: 20px; padding: 20px; background: #f0fdf4; border-radius: 16px; border: 1px solid #bbf7d0; display: none;">
                        <span style="display: block; color: #166534; font-size: 0.9rem; font-weight: 600;">Cambio a entregar:</span>
                        <span id="changeAmount" style="font-size: 2.2rem; font-weight: 800; color: #15803d;">$0.00</span>
                    </div>

                    <div style="display: flex; gap: 12px; margin-top: 30px;">
                        <button class="btn-secondary" id="backToMethods" style="flex: 1;">Atrás</button>
                        <button class="btn-primary" id="confirmCashPayment" style="flex: 2; display: flex; align-items: center; justify-content: center; gap: 8px;" disabled>
                            Confirmar Pago <small style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; border: 1px solid rgba(255,255,255,0.3);">F12</small>
                        </button>
                    </div>
                </div>
            `;

            const cashInput = document.getElementById('cashReceived');
            const changeContainer = document.getElementById('changeContainer');
            const changeAmount = document.getElementById('changeAmount');
            const confirmBtn = document.getElementById('confirmCashPayment');

            // finalTotal is already updated in showCashPayment
            cashInput.oninput = (e) => {
                const received = parseFloat(e.target.value) || 0;
                if (received >= finalTotal) {
                    const change = received - finalTotal;
                    changeAmount.textContent = `$${change.toFixed(2)}`;
                    changeContainer.style.display = 'block';
                    confirmBtn.disabled = false;
                } else {
                    changeContainer.style.display = 'none';
                    confirmBtn.disabled = true;
                }
            };

            document.getElementById('backToMethods').onclick = showMainMethods;
            confirmBtn.onclick = () => {
                const received = parseFloat(cashInput.value);
                processPayment('Efectivo', received);
            };
        };

        const processPayment = async (method, received = null) => {
            // finalTotal is already updated
            const change = received ? received - finalTotal : 0;
            const currentTicket = this.tickets[this.activeTicketIdx];

            // Recuperar información de la mesa si aplica
            let mesaInfo = null;
            if (currentTicket.mesaId) {
                const mesas = await db.getCollection('mesas');
                const m = mesas.find(t => t.id === currentTicket.mesaId);
                if (m) {
                    mesaInfo = { id: m.id, nombre: m.nombre, area: m.area };
                }
            }

            const venta = {
                folio: settings.folioActual,
                items: [...cart],
                total: finalTotal,
                totalOriginal: totalOriginal,
                descuentoPuntos: descuentoPuntos,
                totalDescuentoPromocion: currentTicket.totalDescuento || 0,
                promocionesAplicadas: currentTicket.promocionesAplicadas || [],
                puntosCanjeados: puntosCanjeados,
                metodoPago: method,
                fecha: new Date().toISOString(),
                pagadoCon: received,
                cambio: change,
                cliente: currentTicket.cliente ? { id: currentTicket.cliente.id, nombre: currentTicket.cliente.nombre, puntos: currentTicket.cliente.puntos } : null,
                mesa: mesaInfo
            };

            const docRef = await db.addDocument('ventas', venta);
            venta.id = docRef.id;

            // Increment folio for next sale
            settings.folioActual = (settings.folioActual || 1) + 1;
            db.saveSettings(settings);

            audioService.playSuccess(); // Premium sound

            // Loyalty Points
            if (venta.cliente && settings.fidelizacion.activo) {
                let newTotalPoints = (venta.cliente.puntos || 0);

                if (venta.puntosCanjeados > 0) {
                    // Scenario: Redemption - subtract points, but do not earn new ones
                    newTotalPoints -= venta.puntosCanjeados;
                } else {
                    // Scenario: Accrual - award points normally
                    const puntosGanados = Math.floor(venta.total / 10) * settings.fidelizacion.puntosPorDinero;
                    newTotalPoints += puntosGanados;
                }

                await db.updateDocument('clientes', venta.cliente.id, { puntos: Math.max(0, newTotalPoints) });
            }

            // Discount supplies from recipes (including extras)
            for (const item of cart) {
                await this.updateStockFromRecipe(item, item.quantity, 'subtract');
            }

            // Liberar mesa si aplica
            if (currentTicket.mesaId) {
                await db.updateDocument('mesas', currentTicket.mesaId, {
                    estado: 'libre',
                    orden: null
                });
            }

            modalContent.innerHTML = `
                <div class="success-msg" style="text-align: center; padding: 20px;">
                    <div style="width: 80px; height: 80px; background: #f0fdf4; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                        <i data-lucide="check-circle" style="width: 48px; height: 48px; color: var(--success);"></i>
                    </div>
                    <h2 style="font-size: 1.8rem; margin-bottom: 10px;">¡Venta Exitosa!</h2>
                    ${received ? `<p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 24px;">Cambio entregado: <strong style="color: var(--primary);">$${change.toFixed(2)}</strong></p>` : ''}
                    
                    <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 30px;">
                        <button class="btn-primary" id="printAndFinish" style="width: 100%; padding: 18px; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <i data-lucide="printer"></i> Imprimir Ticket y Finalizar
                        </button>
                        <button class="btn-primary" id="printKitchen" style="width: 100%; padding: 18px; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; gap: 10px; background: #fbbf24; border-color: #fbbf24; color: #78350f;">
                            <i data-lucide="chef-hat"></i> Imprimir Comanda
                        </button>
                        <button class="btn-secondary" id="finishVenta" style="width: 100%; padding: 18px; font-size: 1.1rem; border: 2px solid #eee;">
                            Solo Finalizar
                        </button>
                        <div style="display: flex; justify-content: center; gap: 15px;">
                            <button class="btn-icon-small" id="reprintTicket" title="Vista previa del ticket" style="width: 44px; height: 44px;">
                                <i data-lucide="receipt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();

            document.getElementById('finishVenta').onclick = () => {
                modal.classList.add('hidden');
                this.closeTicket(this.activeTicketIdx, null, true);
            };

            document.getElementById('printAndFinish').onclick = async () => {
                await ticketView.print('last_sale', venta, settings);
                modal.classList.add('hidden');
                this.closeTicket(this.activeTicketIdx, null, true);
            };

            document.getElementById('printKitchen').onclick = () => {
                ticketView.print('last_sale', venta, settings, 'kitchen');
            };

            document.getElementById('reprintTicket').onclick = () => {
                ticketView.print('last_sale', venta, settings);
            };
        };

        modal.classList.remove('hidden');
        showMainMethods();
    }

    async checkoutSplit(mesaId, selectedItems, remainingItems) {
        const settings = db.getSettings();

        // Calcular totales de la parte seleccionada
        const subtotal = selectedItems.reduce((sum, item) => {
            const extrasTotal = item.extras ? item.extras.reduce((s, e) => s + e.precio, 0) : 0;
            return sum + ((item.precio + extrasTotal) * item.quantity);
        }, 0);
        const taxRate = settings.manejarIVA ? (settings.porcentajeIVA / 100) : 0;
        const tax = subtotal * taxRate;
        const total = subtotal + tax;

        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        const totalOriginal = total;
        let finalTotal = totalOriginal;

        // Recuperar cliente si existe en la mesa (opcional, podrías querer registrar a otro cliente en el split)
        const mesas = await db.getCollection('mesas');
        const mesa = mesas.find(m => m.id === mesaId);
        const cliente = mesa && mesa.orden ? mesa.orden.cliente : null;

        const showMainMethods = () => {
            modalContent.innerHTML = `
                <div class="checkout-modal" style="width: 480px;">
                    <div style="background: #f0f9ff; padding: 12px; border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; border: 1px solid #bae6fd;">
                        <i data-lucide="split" style="color: #0369a1; width: 18px;"></i>
                        <span style="font-size: 0.9rem; color: #0369a1; font-weight: 600;">PAGO PARCIAL - ${mesa.nombre}</span>
                    </div>

                    <div style="text-align: center; margin-bottom: 35px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
                        <span style="color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase;">Total Parcial</span>
                        <h2 style="font-size: 4rem; color: #000; margin: 10px 0; font-family: 'Playfair Display', serif; font-weight: 800;">
                            <span style="font-size: 2.4rem; opacity: 0.3;">$</span>${finalTotal.toFixed(2)}
                        </h2>
                    </div>

                    <div class="checkout-methods">
                        <button class="method-btn" id="payEfectivoSplit" style="background: #f0fdf4; border-color: #bbf7d0; color: #166534;">
                            <i data-lucide="banknote"></i>
                            <span>Efectivo</span>
                        </button>
                        <button class="method-btn" id="payTarjetaSplit" style="background: #eff6ff; border-color: #bfdbfe; color: #1e40af;">
                            <i data-lucide="credit-card"></i>
                            <span>Tarjeta</span>
                        </button>
                    </div>

                    <p style="text-align: center; color: var(--text-muted); font-size: 0.8rem; margin-top: 20px;">
                        Quedarán <strong>${remainingItems.length} items</strong> pendientes en la mesa.
                    </p>

                    <button class="btn-secondary" onclick="tablesView.showSplitBillModal('${mesaId}')" style="width: 100%; margin-top: 20px;">Volver</button>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();

            document.getElementById('payEfectivoSplit').onclick = () => showCashInput();
            document.getElementById('payTarjetaSplit').onclick = () => processSplitPayment('Tarjeta');
        };

        const showCashInput = () => {
            modalContent.innerHTML = `
                <div class="cash-input-modal" style="width: 400px;">
                    <h2 style="margin-bottom: 20px;">Pago en Efectivo</h2>
                    <div class="input-group">
                        <label>Monto Recibido</label>
                        <input type="number" id="cashInputSplit" class="large-input" autofocus placeholder="0.00" style="font-size: 2rem; text-align: center;">
                    </div>
                    <div id="changePreview" style="text-align: center; font-size: 1.2rem; margin: 20px 0; font-weight: 700; color: var(--success); min-height: 1.5em;"></div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-secondary" id="backToMethodsSplit" style="flex: 1;">Volver</button>
                        <button class="btn-primary" id="confirmSplitPayment" disabled style="flex: 2;">Confirmar</button>
                    </div>
                </div>
            `;
            const cashInput = document.getElementById('cashInputSplit');
            const confirmBtn = document.getElementById('confirmSplitPayment');
            const changePreview = document.getElementById('changePreview');

            cashInput.oninput = () => {
                const received = parseFloat(cashInput.value);
                if (received >= finalTotal) {
                    const change = received - finalTotal;
                    changePreview.textContent = `Cambio: $${change.toFixed(2)}`;
                    confirmBtn.disabled = false;
                } else {
                    changePreview.textContent = '';
                    confirmBtn.disabled = true;
                }
            };

            document.getElementById('backToMethodsSplit').onclick = showMainMethods;
            confirmBtn.onclick = () => processSplitPayment('Efectivo', parseFloat(cashInput.value));
        };

        const processSplitPayment = async (method, received = null) => {
            const change = received ? received - finalTotal : 0;
            let mesaInfo = { id: mesa.id, nombre: mesa.nombre, area: mesa.area };

            const venta = {
                items: [...selectedItems],
                total: finalTotal,
                totalOriginal: totalOriginal,
                descuentoPuntos: 0,
                puntosCanjeados: 0,
                metodoPago: method,
                fecha: new Date().toISOString(),
                pagadoCon: received,
                cambio: change,
                cliente: cliente ? { id: cliente.id, nombre: cliente.nombre, puntos: cliente.puntos } : null,
                mesa: mesaInfo,
                isSplit: true
            };

            await db.addDocument('ventas', venta);
            audioService.playSuccess();

            // Descontar inventario
            for (const item of selectedItems) {
                await this.updateStockFromRecipe(item, item.quantity, 'subtract');
            }

            // Actualizar Mesa
            if (remainingItems.length > 0) {
                const newTotal = remainingItems.reduce((sum, item) => {
                    const extrasTotal = item.extras ? item.extras.reduce((s, e) => s + e.precio, 0) : 0;
                    return sum + ((item.precio + extrasTotal) * item.quantity);
                }, 0);

                await db.updateDocument('mesas', mesaId, {
                    'orden.items': remainingItems,
                    'orden.total': newTotal
                });

                app.showToast('Pago parcial registrado. La mesa sigue abierta.', 'success');
            } else {
                await db.updateDocument('mesas', mesaId, {
                    estado: 'libre',
                    orden: null
                });
                app.showToast('Pago finalizado. La mesa ha sido liberada.', 'success');
            }

            modal.classList.add('hidden');
            this.renderView('tables');
        };

        modal.classList.remove('hidden');
        showMainMethods();
    }

    async updateStockFromRecipe(cartItem, itemQuantity, operation = 'subtract') {
        const productId = cartItem.id;
        const productos = await db.getCollection('productos');
        const product = productos.find(p => p.id === productId);

        if (product && product.insumos && product.insumos.length > 0) {
            const insumos = await db.getCollection('insumos');

            // 1. Discount Base Recipe
            for (const recipeItem of product.insumos) {
                // SKIP if the ingredient is marked as OMITTED by the user
                if (cartItem.omitted && cartItem.omitted.includes(recipeItem.idInsumo)) {
                    continue;
                }

                const insumo = insumos.find(i => i.id === recipeItem.idInsumo);
                if (insumo) {
                    const totalAmount = recipeItem.cantidad * itemQuantity;
                    const newStock = operation === 'subtract' ? (insumo.stock - totalAmount) : (insumo.stock + totalAmount);
                    await db.updateDocument('insumos', insumo.id, { stock: Math.max(0, newStock) });
                }
            }

            // 2. Discount Extras (Only if we are in 'subtract' mode and they exist)
            // Note: Currently extras add the SAME amount as defined in the recipe for that insumo
            if (cartItem.extras && cartItem.extras.length > 0) {
                for (const extra of cartItem.extras) {
                    const recipeEntry = product.insumos.find(ri => ri.idInsumo === extra.idInsumo);
                    if (recipeEntry) {
                        const insumo = insumos.find(i => i.id === extra.idInsumo);
                        if (insumo) {
                            const totalAmount = recipeEntry.cantidad * itemQuantity;
                            const newStock = operation === 'subtract' ? (insumo.stock - totalAmount) : (insumo.stock + totalAmount);
                            await db.updateDocument('insumos', insumo.id, { stock: Math.max(0, newStock) });
                        }
                    }
                }
            }
        }
    }

    async deleteVenta(id) {
        const confirmed = await this.showConfirmModal({
            title: '¿Eliminar Venta/Devolución?',
            message: '¿Estás seguro de eliminar esta venta? Se realizará una <strong>devolución automática</strong> de los insumos al inventario y se borrará el registro permanentemente.',
            confirmText: 'Sí, eliminar y devolver',
            cancelText: 'Cancelar',
            type: 'danger',
            icon: 'trash-2'
        });

        if (!confirmed) return;

        const ventas = await db.getCollection('ventas');
        const venta = ventas.find(v => v.id === id);

        if (venta) {
            // Return supplies to inventory
            for (const item of venta.items) {
                await this.updateStockFromRecipe(item, item.quantity, 'add');
            }
            await db.deleteDocument('ventas', id);
            await db.logAction('ventas', 'anular_venta', `Venta No. ${id.slice(-8).toUpperCase()} de $${venta.total.toFixed(2)}`);
            this.updateDailyHistoryUI();
        }

        await db.deleteDocument('ventas', id);
        this.updateDailyHistoryUI();

        // Show elegant success message
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');
        modalContent.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="width: 80px; height: 80px; background: #f0fdf4; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                    <i data-lucide="check-circle" style="width: 48px; height: 48px; color: var(--success);"></i>
                </div>
                <h2 style="font-size: 1.8rem; margin-bottom: 10px; font-family: 'Playfair Display', serif;">Venta Eliminada</h2>
                <p style="color: var(--text-muted); margin-bottom: 30px;">El registro ha sido borrado y el inventario se ha restablecido correctamente.</p>
                <button class="btn-primary" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="width: 100%; padding: 16px;">
                    Entendido
                </button>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        modal.classList.remove('hidden');
    }

    async showNotifications() {
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        const insumos = await db.getCollection('insumos');
        const lowStock = insumos.filter(i => i.stock <= i.stockMinimo);

        modalContent.innerHTML = `
            <div class="notifications-modal" style="width: 400px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                    <div style="width: 40px; height: 40px; background: #fff7ed; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <i data-lucide="bell" style="color: #ea580c; width: 24px;"></i>
                    </div>
                    <h2 style="font-size: 1.4rem; margin: 0;">Notificaciones</h2>
                </div>

                ${lowStock.length === 0 ? `
                    <div style="text-align: center; padding: 40px 20px;">
                        <i data-lucide="check-circle-2" style="width: 48px; height: 48px; color: var(--success); margin-bottom: 16px; opacity: 0.5;"></i>
                        <p style="color: var(--text-muted);">Todo está en orden. No tienes alertas de inventario.</p>
                    </div>
                ` : `
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px;">Tienes <strong>${lowStock.length}</strong> insumos con stock bajo:</p>
                    <div style="display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto; padding-right: 5px;">
                        ${lowStock.map(ins => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #fffcf0; border: 1px solid #fef3c7; border-radius: 12px;">
                                <div>
                                    <span style="font-weight: 600; display: block; font-size: 0.95rem;">${ins.nombre}</span>
                                    <small style="color: #b45309;">Mínimo: ${ins.stockMinimo} ${ins.unidad}</small>
                                </div>
                                <div style="text-align: right;">
                                    <span style="color: #dc2626; font-weight: 800; font-size: 1.1rem;">${ins.stock.toFixed(2)}</span>
                                    <small style="display: block; color: var(--text-muted); font-size: 0.75rem;">En stock</small>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}

                <button class="btn-primary" onclick="document.getElementById('modalContainer').classList.add('hidden')" style="width: 100%; margin-top: 24px; padding: 14px;">
                    Cerrar
                </button>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        modal.classList.remove('hidden');
        this.checkNotifications();
    }

    handleSearch(query) {
        const searchVal = query.toLowerCase();
        if (this.currentView === 'pos') {
            posView.filter(searchVal);
        } else if (this.currentView === 'inventory') {
            inventoryView.filter(searchVal);
        } else if (this.currentView === 'supplies') {
            suppliesView.filter(searchVal);
        } else if (this.currentView === 'sales') {
            salesView.filter(searchVal);
        } else if (this.currentView === 'customers') {
            customersView.filterQuery = searchVal;
            customersView.refreshGrid();
        }
    }

    // --- Table Management ---
    async openTableOrder(mesa) {
        // Si el ticket actual tiene cosas y no es de esta mesa, crear uno nuevo
        if (this.cart.length > 0 && this.tickets[this.activeTicketIdx].mesaId !== mesa.id) {
            this.createNewTicket();
        }

        const ticketIdx = this.activeTicketIdx;

        // Configurar ticket para la mesa
        this.tickets[ticketIdx].mesaId = mesa.id;
        this.tickets[ticketIdx].cart = [];
        this.tickets[ticketIdx].cliente = null;

        // Marcar mesa como ocupada en DB
        await db.updateDocument('mesas', mesa.id, {
            estado: 'ocupada',
            orden: {
                fechaInicio: new Date().toISOString(),
                items: [],
                total: 0
            }
        });

        this.switchView('pos');
        this.updateCartUI();
    }

    async editTableOrder(mesaId) {
        const mesas = await db.getCollection('mesas');
        const mesa = mesas.find(m => m.id === mesaId);
        if (!mesa || !mesa.orden) return;

        // Si el ticket actual tiene cosas y no es de esta mesa, crear uno nuevo
        if (this.cart.length > 0 && this.tickets[this.activeTicketIdx].mesaId !== mesaId) {
            this.createNewTicket();
        }

        const ticketIdx = this.activeTicketIdx;
        this.tickets[ticketIdx].mesaId = mesaId;
        this.tickets[ticketIdx].cart = JSON.parse(JSON.stringify(mesa.orden.items)); // Deep copy
        this.tickets[ticketIdx].cliente = mesa.orden.cliente || null; // Restaurar cliente

        const modal = document.getElementById('modalContainer');
        if (modal) modal.classList.add('hidden');

        this.switchView('pos');
        this.updateCartUI();
    }

    async saveTableOrder() {
        const ticket = this.tickets[this.activeTicketIdx];
        if (!ticket.mesaId) return;

        const total = ticket.cart.reduce((sum, item) => {
            const extras = item.extras ? item.extras.reduce((s, e) => s + e.precio, 0) : 0;
            return sum + ((item.precio + extras) * item.quantity);
        }, 0);

        // Preparar datos para la comanda ANTES de limpiar el ticket
        const settings = db.getSettings();
        const mesas = await db.getCollection('mesas');
        const mesa = mesas.find(m => m.id === ticket.mesaId);

        const comandaData = {
            id: 'M-' + ticket.mesaId + '-' + Date.now().toString().slice(-4),
            fecha: new Date().toISOString(),
            items: JSON.parse(JSON.stringify(ticket.cart)),
            cliente: ticket.cliente,
            mesa: mesa ? { id: mesa.id, nombre: mesa.nombre, area: mesa.area } : { id: ticket.mesaId, nombre: 'Mesa ' + ticket.mesaId }
        };

        // Actualizar base de datos
        await db.updateDocument('mesas', ticket.mesaId, {
            'orden.items': ticket.cart,
            'orden.total': total,
            'orden.cliente': ticket.cliente
        });

        // Limpiar ticket local y preparar para venta inmediata de mostrador
        this.closeTicket(this.activeTicketIdx, null, true); // true = force (no db save)
        this.openCounterSale(); // Ir a venta mostrador con carrito limpio

        // Mostrar Modal de Éxito con opción de Comanda
        const modal = document.getElementById('modalContainer');
        const modalContent = modal.querySelector('.modal-content');

        modalContent.innerHTML = `
            <div style="text-align: center; padding: 10px; width: 420px;">
                <div style="width: 80px; height: 80px; background: rgba(226, 150, 93, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; border: 4px solid rgba(226, 150, 93, 0.2);">
                    <i data-lucide="chef-hat" style="color: var(--primary); width: 40px; height: 40px;"></i>
                </div>
                <h2 style="font-family: 'Playfair Display', serif; color: var(--primary); margin-bottom: 10px; font-size: 1.8rem;">¡Orden Registrada!</h2>
                <p style="color: var(--text-muted); margin-bottom: 30px; font-size: 1rem;">La orden de la <strong>${comandaData.mesa.nombre}</strong> se ha guardado correctamente. El carrito está listo para una nueva venta.</p>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button class="btn-primary" id="btnImprimirComanda" style="width: 100%; padding: 18px; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; gap: 10px; background: #fbbf24; border-color: #fbbf24; color: #78350f; font-weight: 800; border-radius: 14px; cursor: pointer;">
                        <i data-lucide="printer"></i> IMPRIMIR COMANDA
                    </button>
                    <button class="btn-secondary" id="btnContinuarMesa" style="width: 100%; padding: 16px; border-radius: 14px; font-weight: 600; cursor: pointer;">
                        CONTINUAR VENTA
                    </button>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') lucide.createIcons();
        modal.classList.remove('hidden');
        audioService.playSuccess();

        document.getElementById('btnImprimirComanda').onclick = () => {
            ticketView.print('kitchen', comandaData, settings, 'kitchen');
        };

        document.getElementById('btnContinuarMesa').onclick = () => {
            modal.classList.add('hidden');
        };
    }

    async checkoutTable(mesaId) {
        await this.editTableOrder(mesaId);
        this.handleCheckout();
    }

    openCounterSale() {
        const currentTicket = this.tickets[this.activeTicketIdx];

        // Si ya estamos en un ticket de mostrador (sin mesa), solo ir al POS
        if (!currentTicket.mesaId) {
            this.switchView('pos');
            return;
        }

        // Buscar si existe otro ticket abierto que sea de mostrador
        const counterTicketIdx = this.tickets.findIndex(t => !t.mesaId);

        if (counterTicketIdx !== -1) {
            // Cambiar a ese ticket
            this.activeTicketIdx = counterTicketIdx;
        } else {
            // Si no hay ninguno, crear uno nuevo
            this.createNewTicket();
            // createNewTicket ya actualiza activeTicketIdx y la UI
        }

        this.updateTicketsUI();
        this.updateCartUI();
        this.switchView('pos');
    }

    showToast(message, type = 'success') {
        // Reutilizamos el modal pequeño o creamos uno flotante. Usaremos alert por simplicidad o el toast de settingsView si fuera estático.
        // Simularemos un toast flotante
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
            background: #333; color: white; padding: 15px 30px; border-radius: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2); z-index: 9999; font-weight: 500;
            display: flex; align-items: center; gap: 10px; animation: fadeInUp 0.3s forwards;
        `;
        toast.innerHTML = `<i data-lucide="check-circle" style="color: #4ade80;"></i> ${message}`;
        document.body.appendChild(toast);
        if (typeof lucide !== 'undefined') lucide.createIcons();
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    initCartSwipes() {
        const containers = document.querySelectorAll('.swipe-container');
        containers.forEach(container => {
            const item = container.querySelector('.cart-item');
            const leftAction = container.querySelector('.left-action');
            const rightAction = container.querySelector('.right-action');
            const index = parseInt(container.dataset.index);

            let startX = 0;
            let currentX = 0;
            let isSwiping = false;

            const handleStart = (clientX) => {
                startX = clientX;
                isSwiping = true;
                item.style.transition = 'none';
            };

            const handleMove = (clientX) => {
                if (!isSwiping) return;
                currentX = clientX - startX;

                // Limit swipe distance
                if (currentX > 100) currentX = 100 + (currentX - 100) * 0.2;
                if (currentX < -100) currentX = -100 + (currentX + 100) * 0.2;

                item.style.transform = `translateX(${currentX}px)`;

                // Opacity feedback
                if (currentX > 20) {
                    leftAction.style.opacity = Math.min(currentX / 80, 1);
                    rightAction.style.opacity = 0;
                } else if (currentX < -20) {
                    rightAction.style.opacity = Math.min(Math.abs(currentX) / 80, 1);
                    leftAction.style.opacity = 0;
                } else {
                    leftAction.style.opacity = 0;
                    rightAction.style.opacity = 0;
                }
            };

            const handleEnd = () => {
                if (!isSwiping) return;
                isSwiping = false;
                item.style.transition = 'transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)';

                if (currentX > 80) {
                    this.addToCart(null, index);
                } else if (currentX < -80) {
                    this.deleteFromCart(index);
                } else {
                    item.style.transform = 'translateX(0)';
                    leftAction.style.opacity = 0;
                    rightAction.style.opacity = 0;
                }
                currentX = 0;
            };

            // Touch Events
            container.addEventListener('touchstart', (e) => handleStart(e.touches[0].clientX), { passive: true });
            container.addEventListener('touchmove', (e) => handleMove(e.touches[0].clientX), { passive: true });
            container.addEventListener('touchend', handleEnd);

            // Mouse Events
            container.addEventListener('mousedown', (e) => {
                if (e.target.closest('button')) return; // Don't swipe if clicking buttons
                handleStart(e.clientX);

                const onMouseMove = (me) => handleMove(me.clientX);
                const onMouseUp = () => {
                    handleEnd();
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    }

}


const app = new AromaticApp();
window.app = app;
