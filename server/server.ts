import express from 'express';
import cors from 'cors';
import { pingDispositivo } from './services/monitorService';
import pool from './db';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rutas para dispositivos
app.get('/api/dispositivos', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM dispositivos');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener dispositivos' });
  }
});

app.post('/api/dispositivos', async (req, res) => {
  try {
    const { ip, alias, descripcion, activo, intervalo } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO dispositivos (ip, alias, descripcion, activo, intervalo) VALUES (?, ?, ?, ?, ?)',
      [ip, alias, descripcion, activo, intervalo]
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear dispositivo' });
  }
});

// Rutas para registros de ping
app.get('/api/registros/:dispositivoId', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM registros_ping WHERE dispositivo_id = ? ORDER BY timestamp DESC',
      [req.params.dispositivoId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener registros' });
  }
});

app.post('/api/registros', async (req, res) => {
  try {
    const { dispositivoId, latencia, activo, respuesta } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO registros_ping (dispositivo_id, latencia, activo, respuesta) VALUES (?, ?, ?, ?)',
      [dispositivoId, latencia, activo, respuesta]
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear registro' });
  }
});

// Rutas para configuración
app.get('/api/configuracion', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM configuracion LIMIT 1');
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

app.put('/api/configuracion', async (req, res) => {
  try {
    const { nombreEmpresa, nombreAplicacion, logotipo, tiempoActualizacion, umbralLatencia, intentosReconexion, sidebarExpandido } = req.body;
    const [result] = await pool.execute(
      'UPDATE configuracion SET nombre_empresa = ?, nombre_aplicacion = ?, logotipo = ?, tiempo_actualizacion = ?, umbral_latencia = ?, intentos_reconexion = ?, sidebar_expandido = ? WHERE id = 1',
      [nombreEmpresa, nombreAplicacion, logotipo, tiempoActualizacion, umbralLatencia, intentosReconexion, sidebarExpandido]
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});