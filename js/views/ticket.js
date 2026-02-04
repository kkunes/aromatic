const ticketView = {
    async generateHTML(venta, settings) {
        const config = settings.ticketConfig;
        const taxRate = settings.manejarIVA ? (settings.porcentajeIVA / 100) : 0;
        const subtotal = venta.total / (1 + taxRate);
        const iva = venta.total - subtotal;

        // Obtener insumos para poder mostrar nombres de ingredientes omitidos
        const allInsumos = await db.getCollection('insumos');

        return `
            <div class="ticket-container" style="font-size: ${config.tamanoFuente}px; width: ${config.anchoPapel === 80 ? '80mm' : '100%'}; color: #000 !important; font-family: 'Courier New', Courier, monospace;">
                <div class="ticket-header" style="text-align: center; margin-bottom: 10px; color: #000;">
                    ${config.mostrarLogo && settings.negocio.logo ? `<img src="${settings.negocio.logo}" style="width: 50px; height: 50px; object-fit: contain; margin-bottom: 5px; filter: grayscale(100%) contrast(200%);">` : ''}
                    <h2 style="font-size: 1.25em; margin-bottom: 2px; color: #000;">${settings.negocio.nombre}</h2>
                    ${config.mostrarEslogan ? `<p style="font-size: 0.9em; margin: 0; color: #000;">${settings.negocio.eslogan}</p>` : ''}
                    ${config.mostrarDireccion ? `<p style="font-size: 0.85em; margin: 2px 0; color: #000;">${settings.negocio.direccion}</p>` : ''}
                    ${config.mostrarTelefono ? `<p style="font-size: 0.85em; margin: 0; color: #000;">Tel: ${settings.negocio.telefono}</p>` : ''}
                    ${config.mostrarRFC && settings.negocio.rfc ? `<p style="font-size: 0.85em; margin: 0; color: #000;">RFC: ${settings.negocio.rfc}</p>` : ''}
                </div>
                
                <div class="ticket-info" style="border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 10px; color: #000;">
                    <p style="margin: 2px 0;"><strong>Ticket:</strong> #${venta.folio || (venta.id || '---').slice(-8).toUpperCase()}</p>
                    ${venta.mesa ? `<p style="margin: 2px 0;"><strong>Mesa:</strong> ${venta.mesa.nombre} (${venta.mesa.area})</p>` : ''}
                    <p style="margin: 2px 0;"><strong>Fecha:</strong> ${new Date(venta.fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}</p>
                </div>

                <div class="ticket-body" style="color: #000;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.95em; color: #000;">
                        <thead>
                            <tr style="border-bottom: 1px solid #000;">
                                <th style="text-align: left; padding: 4px 0; color: #000;">Cant</th>
                                <th style="text-align: left; padding: 4px 0; color: #000;">Prod</th>
                                <th style="text-align: right; padding: 4px 0; color: #000;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${venta.items.map(item => {
            const extrasTotal = item.extras ? item.extras.reduce((s, e) => s + e.precio, 0) : 0;
            const itemTotal = (item.precio + extrasTotal) * item.quantity;

            // Construir lista de ingredientes omitidos
            let omittedHTML = '';
            if (config.mostrarExtras && item.omitted && item.omitted.length > 0) {
                const omittedNames = item.omitted.map(idInsumo => {
                    const ins = allInsumos.find(i => i.id === idInsumo);
                    return ins ? `Sin ${ins.nombre}` : null;
                }).filter(name => name !== null);

                if (omittedNames.length > 0) {
                    omittedHTML = `<div style="font-size: 0.85em; color: #000;">${omittedNames.join('<br>')}</div>`;
                }
            }

            return `
                                    <tr style="color: #000;">
                                        <td style="vertical-align: top; padding: 6px 0; color: #000;">${item.quantity}</td>
                                        <td style="padding: 6px 0; color: #000;">
                                            <div style="font-weight: bold;">${item.nombre}</div>
                                            ${config.mostrarNotas && item.nota ? `<div style="font-size: 0.85em; font-style: italic; color: #000;">* ${item.nota}</div>` : ''}
                                            ${omittedHTML}
                                            ${config.mostrarExtras && item.extras && item.extras.length > 0 ? `
                                                <div style="font-size: 0.85em; color: #000;">
                                                    ${item.extras.map(e => `+ ${e.nombre}`).join('<br>')}
                                                </div>
                                            ` : ''}
                                        </td>
                                        <td style="text-align: right; vertical-align: top; padding: 6px 0; color: #000;">$${itemTotal.toFixed(2)}</td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="ticket-totals" style="margin-top: 5px; border-top: 1px solid #000; padding-top: 8px; color: #000;">
                    ${settings.manejarIVA ? `
                        <p style="margin: 2px 0; display: flex; justify-content: space-between; color: #000;"><span>Subtotal:</span> <span>$${subtotal.toFixed(2)}</span></p>
                        <p style="margin: 2px 0; display: flex; justify-content: space-between; color: #000;"><span>IVA (${settings.porcentajeIVA}%):</span> <span>$${iva.toFixed(2)}</span></p>
                    ` : ''}
                    <p style="margin: 4px 0; display: flex; justify-content: space-between; font-size: 1.15em; font-weight: bold; color: #000;">
                        <span>TOTAL:</span> <span>$${venta.total.toFixed(2)}</span>
                    </p>
                    ${venta.totalDescuentoPromocion > 0 ? `
                        <p style="margin: 2px 0; display: flex; justify-content: space-between; font-size: 0.9em; color: #000; border-top: 1px dashed #ccc; padding-top: 4px;">
                            <span>Promociones aplicadas:</span> 
                            <span>-$${venta.totalDescuentoPromocion.toFixed(2)}</span>
                        </p>
                        ${(venta.promocionesAplicadas || []).map(p => `<p style="margin: 0; font-size: 0.75em; text-align: right; color: #666;">(${p.nombre})</p>`).join('')}
                    ` : ''}
                    ${venta.descuentoPuntos > 0 ? `
                        <p style="margin: 2px 0; display: flex; justify-content: space-between; font-size: 0.9em; color: #000;">
                            <span>Descuento (${venta.puntosCanjeados} pts):</span> 
                            <span>-$${venta.descuentoPuntos.toFixed(2)}</span>
                        </p>
                    ` : ''}
                    ${venta.pagadoCon ? `
                        <p style="margin: 2px 0; display: flex; justify-content: space-between; font-size: 0.9em; color: #000;"><span>Recibido:</span> <span>$${venta.pagadoCon.toFixed(2)}</span></p>
                        <p style="margin: 2px 0; display: flex; justify-content: space-between; font-size: 0.9em; color: #000;"><span>Cambio:</span> <span>$${venta.cambio.toFixed(2)}</span></p>
                    ` : ''}
                </div>

                <div class="ticket-footer" style="text-align: center; margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; color: #000;">
                    ${venta.cliente ? `
                        <div style="margin-bottom: 10px; padding: 5px; border: 1px solid #000; border-radius: 4px; text-align: left;">
                            <p style="margin: 0 0 5px 0; font-size: 0.85em; font-weight: bold; text-align: center; border-bottom: 1px solid #000; padding-bottom: 3px;">PROGRAMA DE LEALTAD</p>
                            <p style="margin: 0; font-size: 0.8em; font-weight: bold;">${venta.cliente.nombre}</p>
                            
                            <div style="font-size: 0.75em; margin-top: 5px; border-top: 1px dashed #000; padding-top: 3px;">
                                <div style="display: flex; justify-content: space-between;">
                                    <span>Puntos anteriores:</span>
                                    <span>${venta.puntosPrevios || 0}</span>
                                </div>
                                
                                ${venta.puntosGanados > 0 ? `
                                <div style="display: flex; justify-content: space-between;">
                                    <span>Puntos por esta compra:</span>
                                    <span>+${venta.puntosGanados}</span>
                                </div>
                                ` : ''}
                                
                                ${venta.puntosCanjeados > 0 ? `
                                <div style="display: flex; justify-content: space-between; color: #000;">
                                    <span>Puntos canjeados:</span>
                                    <span>-${venta.puntosCanjeados}</span>
                                </div>
                                ` : ''}
                                
                                <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 3px; border-top: 1px solid #000; padding-top: 2px;">
                                    <span>SALDO ACTUAL:</span>
                                    <span>${venta.puntosTotales || 0} pts</span>
                                </div>
                                
                                <div style="display: flex; justify-content: space-between; font-style: italic; margin-top: 2px;">
                                    <span>Valor acumulado:</span>
                                    <span>$${((venta.puntosTotales || 0) * (settings.fidelizacion.valorPunto || 0)).toFixed(2)} MXN</span>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <p style="margin: 5px 0; font-weight: bold; font-size: 1em; color: #000;">${settings.negocio.mensajeTicket}</p>
                    
                    ${(() => {
                if (config.mostrarQR && config.contenidoQR) {
                    // Generar QR de forma síncrona usando el canvas de qrcode.js
                    const div = document.createElement('div');
                    new QRCode(div, {
                        text: config.contenidoQR,
                        width: 128,
                        height: 128,
                        colorDark: "#000000",
                        colorLight: "#ffffff",
                        correctLevel: QRCode.CorrectLevel.H
                    });
                    const canvas = div.querySelector('canvas');
                    const qrDataURL = canvas ? canvas.toDataURL() : '';

                    return `
                                <div style="margin-top: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                                    ${config.mensajeQR ? `<p style="margin: 0 0 5px 0; font-size: 0.85em; font-weight: 800; color: #000; text-transform: uppercase;">${config.mensajeQR}</p>` : ''}
                                    <div style="padding: 5px; background: white; border: 1px solid #000;">
                                        <img src="${qrDataURL}" style="width: 85px; height: 85px; display: block;">
                                    </div>
                                </div>
                            `;
                }
                return '';
            })()}

                    <p style="margin: 10px 0 0; font-size: 0.85em; color: #000;">Método de Pago: ${venta.metodoPago}</p>
                    <p style="margin: 10px 0 0; font-size: 0.75em; color: #000;">--- ${settings.negocio.nombre} POS ---</p>
                </div>
            </div>
        `;
    },

    async generateKitchenHTML(venta, settings) {
        // Formato Simplificado para Cocina/Barra (Comanda)
        const config = settings.ticketConfig;
        const allInsumos = await db.getCollection('insumos');

        return `
            <div class="ticket-container" style="font-size: ${config.tamanoFuente + 2}px; width: ${config.anchoPapel === 80 ? '80mm' : '100%'}; color: #000 !important; font-family: 'Courier New', Courier, monospace;">
                <div class="ticket-header" style="text-align: center; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; color: #000;">
                    <h2 style="font-size: 1.4em; margin: 0 0 5px 0; color: #000;">COMANDA DE COCINA</h2>
                    <p style="font-size: 1.1em; margin: 0; font-weight: bold;">ORDEN: #${(venta.id || '---').slice(-4).toUpperCase()}</p>
                    ${venta.mesa ? `<div style="border: 2px solid #000; display: inline-block; padding: 4px 8px; margin: 6px 0; font-weight: bold; font-size: 1.1em;">${venta.mesa.nombre.toUpperCase()}</div>` : ''}
                    <p style="font-size: 0.9em; margin: 5px 0 0 0;">${new Date(venta.fecha).toLocaleString('es-MX', { hour: '2-digit', minute: '2-digit' })}</p>
                    ${venta.cliente ? `<p style="font-size: 0.9em; margin: 5px 0 0 0; font-style: italic;">Cliente: ${venta.cliente.nombre}</p>` : ''}
                </div>

                <div class="ticket-body" style="color: #000;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 1em; color: #000;">
                        <tbody>
                            ${venta.items.map(item => {
            // Construir lista de ingredientes omitidos
            let omittedHTML = '';
            if (item.omitted && item.omitted.length > 0) {
                const omittedNames = item.omitted.map(idInsumo => {
                    const ins = allInsumos.find(i => i.id === idInsumo);
                    return ins ? `SIN ${ins.nombre.toUpperCase()}` : null;
                }).filter(name => name !== null);

                if (omittedNames.length > 0) {
                    omittedHTML = `<div style="font-weight: bold; margin-top: 2px; font-size: 0.95em;">⚠️ ${omittedNames.join(', ')}</div>`;
                }
            }

            return `
                                    <tr style="color: #000; border-bottom: 1px dashed #999;">
                                        <td style="vertical-align: top; padding: 10px 0; width: 30px; font-size: 1.2em; font-weight: bold; color: #000;">${item.quantity}</td>
                                        <td style="padding: 10px 0 10px 10px; color: #000;">
                                            <div style="font-weight: bold; font-size: 1.1em;">${item.nombre}</div>
                                            ${item.nota ? `<div style="font-size: 1em; font-style: italic; margin-top: 2px; background: #eee; padding: 2px;">📝 ${item.nota}</div>` : ''}
                                            ${omittedHTML}
                                            ${item.extras && item.extras.length > 0 ? `
                                                <div style="font-size: 0.95em; margin-top: 2px;">
                                                    ${item.extras.map(e => `+ ${e.nombre}`).join('<br>')}
                                                </div>
                                            ` : ''}
                                        </td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div style="margin-top: 20px; border-top: 2px solid #000; padding-top: 10px; text-align: center; color: #000;">
                    <p style="margin: 0; font-size: 0.8em;">--- FIN COMANDA ---</p>
                </div>
            </div>
        `;
    },

    async print(id, venta, settings, type = 'ticket') {
        // Create a temporary container for the ticket content if it doesn't exist
        let printContainer = document.getElementById('print-container');
        if (!printContainer) {
            printContainer = document.createElement('div');
            printContainer.id = 'print-container';
            document.body.appendChild(printContainer);
        }

        // Set ticket content based on type
        if (type === 'kitchen') {
            printContainer.innerHTML = await this.generateKitchenHTML(venta, settings);
        } else {
            printContainer.innerHTML = await this.generateHTML(venta, settings);
        }

        // Add class to body to control visibility in CSS (@media print)
        document.body.classList.add('is-printing');

        window.print();

        // Restore
        document.body.classList.remove('is-printing');
        printContainer.innerHTML = '';
    }
};
