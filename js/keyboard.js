const virtualKeyboard = {
    isOpen: false,
    lastFocusedInput: null,
    isShift: false,

    init() {
        this.createKeyboardHTML();
        this.bindGlobalEvents();
    },

    createKeyboardHTML() {
        const div = document.createElement('div');
        div.id = 'virtualKeyboard';
        div.className = 'keyboard-container';
        div.innerHTML = `
            <div class="keyboard-header" id="keyboardHeader">
                <div class="drag-handle">
                    <i data-lucide="grip-horizontal" style="width:16px; color:#94a3b8;"></i>
                    <span>Teclado en Pantalla</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="keyboard-min-btn" onclick="virtualKeyboard.minimize()">
                        <i data-lucide="minus" style="width:16px;"></i>
                    </button>
                    <button class="keyboard-close-btn" onclick="virtualKeyboard.toggle()">
                        <i data-lucide="x" style="width:16px;"></i>
                    </button>
                </div>
            </div>
            <div id="keyboardBody"></div>
        `;
        document.body.appendChild(div);
        this.renderKeys();
        this.initDraggable();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    initDraggable() {
        const kb = document.getElementById('virtualKeyboard');
        const header = document.getElementById('keyboardHeader');
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        header.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            // Solo arrastrar si no es un botón
            if (e.target.closest('button')) return;

            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
            kb.classList.add('dragging');
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            kb.style.top = (kb.offsetTop - pos2) + "px";
            kb.style.left = (kb.offsetLeft - pos1) + "px";
            kb.style.bottom = 'auto';
            kb.style.transform = 'none';
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            kb.classList.remove('dragging');
        }
    },

    minimize() {
        const kb = document.getElementById('virtualKeyboard');
        kb.classList.toggle('minimized');
    },

    renderKeys() {
        const body = document.getElementById('keyboardBody');
        const rows = this.isShift ? this.getShiftLayout() : this.getNormalLayout();

        body.innerHTML = rows.map(row => `
            <div class="keyboard-row">
                ${row.map(key => this.createKeyHTML(key)).join('')}
            </div>
        `).join('');
    },

    createKeyHTML(key) {
        let className = 'keyboard-key';
        let content = key;
        let action = `virtualKeyboard.handleKey('${key}')`;

        if (key === 'SHIFT') {
            className += ' wide special ' + (this.isShift ? 'action' : '');
            content = '<i data-lucide="arrow-big-up"></i>';
            action = 'virtualKeyboard.toggleShift()';
        } else if (key === 'BACKSPACE') {
            className += ' wide special';
            content = '<i data-lucide="delete"></i>';
            action = 'virtualKeyboard.handleBackspace()';
        } else if (key === 'SPACE') {
            className += ' space';
            content = ' ';
            action = "virtualKeyboard.handleKey(' ')";
        } else if (key === 'ENTER') {
            className += ' wide action';
            content = 'Enter';
            action = 'virtualKeyboard.toggle()'; // Close on enter
        }

        return `<div class="${className}" onclick="${action}">${content}</div>`;
    },

    getNormalLayout() {
        return [
            ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'BACKSPACE'],
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'],
            ['SHIFT', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-'],
            ['SPACE', 'ENTER']
        ];
    },

    getShiftLayout() {
        return [
            ['!', '"', '#', '$', '%', '&', '/', '(', ')', '=', 'BACKSPACE'],
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
            ['SHIFT', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ';', ':', '_'],
            ['SPACE', 'ENTER']
        ];
    },

    handleKey(char) {
        if (!this.lastFocusedInput) return;

        const input = this.lastFocusedInput;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const value = input.value;

        input.value = value.substring(0, start) + char + value.substring(end);
        input.selectionStart = input.selectionEnd = start + 1;
        input.focus();

        // Trigger input event for search filters
        input.dispatchEvent(new Event('input', { bubbles: true }));
    },

    handleBackspace() {
        if (!this.lastFocusedInput) return;

        const input = this.lastFocusedInput;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const value = input.value;

        if (start === end && start > 0) {
            input.value = value.substring(0, start - 1) + value.substring(end);
            input.selectionStart = input.selectionEnd = start - 1;
        } else {
            input.value = value.substring(0, start) + value.substring(end);
            input.selectionStart = input.selectionEnd = start;
        }
        input.focus();
        input.dispatchEvent(new Event('input', { bubbles: true }));
    },

    toggleShift() {
        this.isShift = !this.isShift;
        this.renderKeys();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    toggle() {
        this.isOpen = !this.isOpen;
        const kb = document.getElementById('virtualKeyboard');
        if (this.isOpen) {
            kb.classList.add('active');
        } else {
            kb.classList.remove('active');
            // Reset floating / dragged styles so it can hide off-screen
            kb.style.top = '';
            kb.style.left = '';
            kb.style.bottom = '';
            kb.style.transform = '';
            kb.classList.remove('minimized');
        }
    },

    bindGlobalEvents() {
        // Track last focused input
        document.addEventListener('focusin', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.lastFocusedInput = e.target;
            }
        });

        // Toggle button will be added to index.html
    }
};
