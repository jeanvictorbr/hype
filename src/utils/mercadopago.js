// src/utils/mercadopago.js

/**
 * Cria um pagamento PIX no Mercado Pago
 * @param {string} accessToken - O Token de Acesso do Mercado Pago (Vendedor)
 * @param {number} amount - Valor da venda (Ex: 50.00)
 * @param {string} description - Descrição (Ex: "VIP Dono do Baile - Discord")
 * @param {string} email - Email genérico do pagador
 * @returns {Object} Retorna o ID do pagamento, QRCode (Base64) e Copia e Cola
 */
async function createPixPayment(accessToken, amount, description, email = "comprador@hypevip.com") {
    try {
        // Uma chave única para evitar transações duplicadas (Idempotency Key)
        const idempotencyKey = require('crypto').randomUUID();

        const response = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': idempotencyKey
            },
            body: JSON.stringify({
                transaction_amount: Number(amount),
                description: description,
                payment_method_id: 'pix',
                payer: { email: email }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Erro MP: ${data.message || 'Desconhecido'}`);
        }

        return {
            id: data.id, // ID da transação (para verificarmos depois)
            status: data.status, // "pending"
            qrCodeBase64: data.point_of_interaction.transaction_data.qr_code_base64, // Imagem do QR Code
            copiaECola: data.point_of_interaction.transaction_data.qr_code // Código copia e cola
        };

    } catch (error) {
        console.error('❌ Falha ao gerar PIX:', error);
        return null;
    }
}

/**
 * Verifica o status de um pagamento PIX
 * @param {string} accessToken - O Token de Acesso
 * @param {string|number} paymentId - O ID gerado na função acima
 * @returns {string} Status do pagamento ('pending', 'approved', 'cancelled', etc)
 */
async function checkPaymentStatus(accessToken, paymentId) {
    try {
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();
        
        if (!response.ok) return 'error';

        return data.status; // Vai retornar 'approved' quando o cliente pagar!

    } catch (error) {
        console.error('❌ Falha ao verificar PIX:', error);
        return 'error';
    }
}

module.exports = { createPixPayment, checkPaymentStatus };