import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Crear pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ip_monitor',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Script para crear las tablas
const createTables = async () => {
  try {
    const connection = await pool.getConnection();

    // Tabla dispositivos
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS dispositivos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip VARCHAR(255) NOT NULL,
        alias VARCHAR(255) NOT NULL,
        descripcion TEXT,
        activo BOOLEAN DEFAULT true,
        intervalo INT DEFAULT 30,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Tabla registros_ping
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS registros_ping (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dispositivo_id INT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        latencia FLOAT NULL,
        activo BOOLEAN DEFAULT true,
        respuesta TEXT,
        FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id) ON DELETE CASCADE
      )
    `);

    // Tabla configuracion
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS configuracion (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre_empresa VARCHAR(255) NOT NULL,
        nombre_aplicacion VARCHAR(255) NOT NULL,
        logotipo TEXT,
        tiempo_actualizacion INT DEFAULT 30,
        umbral_latencia INT DEFAULT 100,
        intentos_reconexion INT DEFAULT 3,
        sidebar_expandido BOOLEAN DEFAULT true
      )
    `);

    // Insertar configuración por defecto si no existe
    await connection.execute(`
      INSERT INTO configuracion (nombre_empresa, nombre_aplicacion)
      SELECT 'Mi Empresa', 'MonitorIP'
      WHERE NOT EXISTS (SELECT 1 FROM configuracion LIMIT 1)
    `);

    connection.release();
    console.log('Tablas creadas correctamente');
  } catch (error) {
    console.error('Error al crear las tablas:', error);
    throw error;
  }
};

// Inicializar base de datos
export const initDB = async () => {
  try {
    await createTables();
    return true;
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    return false;
  }
};

export default pool;