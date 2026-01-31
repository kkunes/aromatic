/**
 * Utility functions
 */

const utils = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    },

    formatDate(date) {
        return new Intl.DateTimeFormat('es-MX', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(new Date(date));
    },

    generateId() {
        return Math.random().toString(36).substr(2, 9).toUpperCase();
    }
};

document.addEventListener('wheel', function(event) {
    if (document.activeElement.type === 'number') {
        event.preventDefault();
    }
}, { passive: false });
