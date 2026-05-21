const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Configuración del transporter de nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Verificar conexión SMTP
const verifyConnection = async () => {
    try {
        await transporter.verify();
        console.log('✅ Conexión SMTP establecida correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error conectando a SMTP:', error.message);
        return false;
    }
};

// Enviar correo genérico
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            text,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Correo enviado:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error enviando correo:', error);
        return { success: false, error: error.message };
    }
};

// Enviar correo de bienvenida a nuevo personal de área
const sendWelcomeEmailPersonalArea = async (email, nombreCompleto, username) => {
    const subject = 'Bienvenido al Sistema COSSMIL';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">¡Bienvenido a COSSMIL!</h2>
            <p>Hola <strong>${nombreCompleto}</strong>,</p>
            <p>Tu cuenta de Personal de Área ha sido creada exitosamente en el sistema.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Usuario:</strong> ${username}</p>
                <p style="color: #ef4444; font-size: 12px;">Por seguridad, te recomendamos cambiar tu contraseña en el primer inicio de sesión.</p>
            </div>
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 12px; color: #6b7280;">Este es un correo automático del Sistema COSSMIL.</p>
        </div>
    `;
    const text = `Bienvenido a COSSMIL!\n\nHola ${nombreCompleto},\n\nTu cuenta de Personal de Área ha sido creada exitosamente.\nUsuario: ${username}\n\nPor seguridad, te recomendamos cambiar tu contraseña en el primer inicio de sesión.`;

    return await sendEmail({ to: email, subject, text, html });
};

// Enviar correo de bienvenida a nuevo trabajador
const sendWelcomeEmailTrabajador = async (email, nombreCompleto, username, areaDescripcion) => {
    const subject = 'Bienvenido al Sistema COSSMIL - Trabajador';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">¡Bienvenido a COSSMIL!</h2>
            <p>Hola <strong>${nombreCompleto}</strong>,</p>
            <p>Tu cuenta de Trabajador ha sido creada exitosamente en el sistema.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Usuario:</strong> ${username}</p>
                <p><strong>Área:</strong> ${areaDescripcion || 'No asignada'}</p>
                <p style="color: #ef4444; font-size: 12px;">Por seguridad, te recomendamos cambiar tu contraseña en el primer inicio de sesión.</p>
            </div>
            <p>Si tienes alguna pregunta, contacta a tu encargado de área.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 12px; color: #6b7280;">Este es un correo automático del Sistema COSSMIL.</p>
        </div>
    `;
    const text = `Bienvenido a COSSMIL!\n\nHola ${nombreCompleto},\n\nTu cuenta de Trabajador ha sido creada exitosamente.\nUsuario: ${username}\nÁrea: ${areaDescripcion || 'No asignada'}\n\nPor seguridad, te recomendamos cambiar tu contraseña en el primer inicio de sesión.`;

    return await sendEmail({ to: email, subject, text, html });
};

// Enviar notificación de asistencia
const sendAsistenciaNotification = async (email, nombreCompleto, ubicacion, fecha, estado) => {
    const subject = `Registro de Asistencia - ${estado}`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Registro de Asistencia</h2>
            <p>Hola <strong>${nombreCompleto}</strong>,</p>
            <p>Se ha registrado tu asistencia en el sistema.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Ubicación:</strong> ${ubicacion}</p>
                <p><strong>Fecha y Hora:</strong> ${fecha}</p>
                <p><strong>Estado:</strong> ${estado}</p>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 12px; color: #6b7280;">Este es un correo automático del Sistema COSSMIL.</p>
        </div>
    `;
    const text = `Registro de Asistencia\n\nHola ${nombreCompleto},\n\nSe ha registrado tu asistencia.\nUbicación: ${ubicacion}\nFecha y Hora: ${fecha}\nEstado: ${estado}`;

    return await sendEmail({ to: email, subject, text, html });
};

// Enviar correo de recuperación de contraseña
const sendPasswordResetEmail = async (email, nombreCompleto, resetToken) => {
    const subject = 'Recuperación de Contraseña - COSSMIL';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Recuperación de Contraseña</h2>
            <p>Hola <strong>${nombreCompleto}</strong>,</p>
            <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Código de recuperación:</strong> ${resetToken}</p>
                <p style="color: #ef4444; font-size: 12px;">Este código expira en 15 minutos.</p>
            </div>
            <p>Si no solicitaste este cambio, ignora este correo.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 12px; color: #6b7280;">Este es un correo automático del Sistema COSSMIL.</p>
        </div>
    `;
    const text = `Recuperación de Contraseña\n\nHola ${nombreCompleto},\n\nCódigo de recuperación: ${resetToken}\n\nEste código expira en 15 minutos.\n\nSi no solicitaste este cambio, ignora este correo.`;

    return await sendEmail({ to: email, subject, text, html });
};

module.exports = {
    verifyConnection,
    sendEmail,
    sendWelcomeEmailPersonalArea,
    sendWelcomeEmailTrabajador,
    sendAsistenciaNotification,
    sendPasswordResetEmail
};
