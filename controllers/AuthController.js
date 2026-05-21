const { OAuth2Client } = require('google-auth-library');
const { executeQuery } = require('../config/database');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Login unificado: correo (o username) + contraseña
// Busca en super_admin, personal_area, personal_trabajador y redirige según rol
const unifiedLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const identifier = (email || '').trim().toLowerCase();

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                message: 'Correo electrónico y contraseña son requeridos'
            });
        }

        console.log(`🔐 Intento de login unificado: ${identifier}`);

        // 1. Buscar en super_admin (por correo o username)
        const adminResult = await executeQuery(
            `SELECT id, username, password, nombre_completo, correo FROM super_admin 
             WHERE (correo = ? OR LOWER(username) = ?) LIMIT 1`,
            [identifier, identifier]
        );

        if (adminResult.length > 0 && adminResult[0].password === password.trim()) {
            const admin = adminResult[0];
            const token = jwt.sign(
                { id: admin.id, username: admin.username, role: 'admin' },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            console.log(`✅ Login admin: ${admin.username}`);
            return res.json({
                success: true,
                message: 'Acceso concedido',
                token,
                user: { id: admin.id, username: admin.username, nombre_completo: admin.nombre_completo, correo: admin.correo },
                role: 'admin'
            });
        }

        // 2. Buscar en personal_area (por correo o username)
        const areaResult = await executeQuery(`
            SELECT pa.id, pa.username, pa.password, pa.nombre_completo, pa.correo, pa.id_area_laboral,
                   al.descripcion as area_descripcion
            FROM personal_area pa
            LEFT JOIN area_laboral al ON pa.id_area_laboral = al.id
            WHERE (pa.correo = ? OR LOWER(pa.username) = ?) LIMIT 1
        `, [identifier, identifier]);

        if (areaResult.length > 0 && areaResult[0].password === password.trim()) {
            const user = areaResult[0];
            const token = jwt.sign(
                { id: user.id, username: user.username, role: 'area', id_area_laboral: user.id_area_laboral },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            console.log(`✅ Login área: ${user.username}`);
            return res.json({
                success: true,
                message: 'Acceso concedido',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    nombre_completo: user.nombre_completo,
                    correo: user.correo,
                    id_area_laboral: user.id_area_laboral,
                    area_descripcion: user.area_descripcion
                },
                role: 'area'
            });
        }

        // 3. Buscar en personal_trabajador (por correo o username)
        const trabajadorResult = await executeQuery(`
            SELECT pt.id, pt.username, pt.password, pt.nombre_completo, pt.correo,
                   pt.id_personal_area, pt.id_area_laboral,
                   pa.nombre_completo as encargado_nombre,
                   al.descripcion as area_descripcion,
                   GROUP_CONCAT(r.descripcion SEPARATOR ', ') as roles_asignados,
                   GROUP_CONCAT(r.id) as roles_ids
            FROM personal_trabajador pt
            LEFT JOIN personal_area pa ON pt.id_personal_area = pa.id
            LEFT JOIN area_laboral al ON pt.id_area_laboral = al.id
            LEFT JOIN personal_trabajador_roles ptr ON pt.id = ptr.id_personal_trabajador
            LEFT JOIN roles r ON ptr.id_rol = r.id
            WHERE (pt.correo = ? OR LOWER(pt.username) = ?)
            GROUP BY pt.id LIMIT 1
        `, [identifier, identifier]);

        if (trabajadorResult.length > 0 && trabajadorResult[0].password === password.trim()) {
            const user = trabajadorResult[0];
            const token = jwt.sign(
                { id: user.id, username: user.username, role: 'trabajador', id_area_laboral: user.id_area_laboral, id_personal_area: user.id_personal_area },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            console.log(`✅ Login trabajador: ${user.username}`);
            return res.json({
                success: true,
                message: 'Acceso concedido',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    nombre_completo: user.nombre_completo,
                    correo: user.correo,
                    id_personal_area: user.id_personal_area,
                    id_area_laboral: user.id_area_laboral,
                    encargado_nombre: user.encargado_nombre,
                    area_descripcion: user.area_descripcion,
                    roles_asignados: user.roles_asignados,
                    roles_ids: user.roles_ids
                },
                role: 'trabajador'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Correo o contraseña incorrectos'
        });

    } catch (error) {
        console.error('Error en login unificado:', error);
        return res.status(500).json({
            success: false,
            message: 'Error en la autenticación',
            error: error.message
        });
    }
};

// Verificar token de Google y autenticar usuario (auto-detecta rol por correo)
const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
        
        if (!credential) {
            return res.status(400).json({
                success: false,
                message: 'Token de Google no proporcionado'
            });
        }

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const email = payload.email;

        console.log(`🔐 Login con Google: ${email}`);

        // 1. Buscar en super_admin
        const adminResult = await executeQuery(
            `SELECT id, username, nombre_completo, correo FROM super_admin WHERE correo = ? LIMIT 1`,
            [email]
        );
        if (adminResult.length > 0) {
            const admin = adminResult[0];
            const token = jwt.sign({ id: admin.id, username: admin.username, role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
            return res.json({
                success: true,
                message: 'Login con Google exitoso',
                token,
                user: { id: admin.id, username: admin.username, nombre_completo: admin.nombre_completo, correo: admin.correo },
                role: 'admin'
            });
        }

        // 2. Buscar en personal_area
        const areaResult = await executeQuery(`
            SELECT pa.id, pa.username, pa.nombre_completo, pa.correo, pa.id_area_laboral, al.descripcion as area_descripcion
            FROM personal_area pa
            LEFT JOIN area_laboral al ON pa.id_area_laboral = al.id
            WHERE pa.correo = ?
        `, [email]);
        if (areaResult.length > 0) {
            const user = areaResult[0];
            const token = jwt.sign({ id: user.id, username: user.username, role: 'area', id_area_laboral: user.id_area_laboral }, JWT_SECRET, { expiresIn: '24h' });
            return res.json({
                success: true,
                message: 'Login con Google exitoso',
                token,
                user: { id: user.id, username: user.username, nombre_completo: user.nombre_completo, correo: user.correo, id_area_laboral: user.id_area_laboral, area_descripcion: user.area_descripcion },
                role: 'area'
            });
        }

        // 3. Buscar en personal_trabajador
        const trabajadorResult = await executeQuery(`
            SELECT pt.id, pt.username, pt.nombre_completo, pt.correo, pt.id_personal_area, pt.id_area_laboral,
                   pa.nombre_completo as encargado_nombre, al.descripcion as area_descripcion,
                   GROUP_CONCAT(r.descripcion SEPARATOR ', ') as roles_asignados, GROUP_CONCAT(r.id) as roles_ids
            FROM personal_trabajador pt
            LEFT JOIN personal_area pa ON pt.id_personal_area = pa.id
            LEFT JOIN area_laboral al ON pt.id_area_laboral = al.id
            LEFT JOIN personal_trabajador_roles ptr ON pt.id = ptr.id_personal_trabajador
            LEFT JOIN roles r ON ptr.id_rol = r.id
            WHERE pt.correo = ?
            GROUP BY pt.id
        `, [email]);
        if (trabajadorResult.length > 0) {
            const user = trabajadorResult[0];
            const token = jwt.sign({ id: user.id, username: user.username, role: 'trabajador', id_area_laboral: user.id_area_laboral, id_personal_area: user.id_personal_area }, JWT_SECRET, { expiresIn: '24h' });
            return res.json({
                success: true,
                message: 'Login con Google exitoso',
                token,
                user: { id: user.id, username: user.username, nombre_completo: user.nombre_completo, correo: user.correo, id_personal_area: user.id_personal_area, id_area_laboral: user.id_area_laboral, encargado_nombre: user.encargado_nombre, area_descripcion: user.area_descripcion, roles_asignados: user.roles_asignados, roles_ids: user.roles_ids },
                role: 'trabajador'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'No existe una cuenta registrada con este correo. Contacta al administrador.'
        });

    } catch (error) {
        console.error('Error en login con Google:', error);
        if (error.message && error.message.includes('Token used too late')) {
            return res.status(401).json({ success: false, message: 'El token de Google ha expirado. Intenta de nuevo.' });
        }
        return res.status(500).json({ success: false, message: 'Error en la autenticación con Google', error: error.message });
    }
};

// Obtener la configuración del cliente de Google (para el frontend)
const getGoogleConfig = (req, res) => {
    res.json({
        success: true,
        clientId: process.env.GOOGLE_CLIENT_ID
    });
};

module.exports = {
    unifiedLogin,
    googleLogin,
    getGoogleConfig
};
