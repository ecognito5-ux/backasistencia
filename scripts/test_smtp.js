// Script para probar la conexión SMTP
const { verifyConnection, sendEmail } = require('../services/emailService');

const testSMTP = async () => {
    console.log('🔧 Probando conexión SMTP...\n');
    
    const connected = await verifyConnection();
    
    if (connected) {
        console.log('\n📧 Enviando correo de prueba...\n');
        
        const result = await sendEmail({
            to: process.env.SMTP_USER, // Enviar a la misma cuenta
            subject: 'Prueba de SMTP - COSSMIL',
            text: 'Este es un correo de prueba del sistema COSSMIL.',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="color: #2563eb;">Sistema COSSMIL</h2>
                    <p>Este es un correo de prueba.</p>
                    <p>Si recibes este correo, la configuración SMTP está funcionando correctamente.</p>
                    <hr>
                    <p style="font-size: 12px; color: #666;">Enviado desde el sistema COSSMIL</p>
                </div>
            `
        });
        
        if (result.success) {
            console.log('✅ Correo de prueba enviado correctamente');
            console.log('   Message ID:', result.messageId);
        } else {
            console.log('❌ Error enviando correo:', result.error);
        }
    } else {
        console.log('❌ No se pudo establecer conexión SMTP');
        console.log('   Verifica las credenciales en el archivo .env');
    }
    
    process.exit(0);
};

testSMTP();
