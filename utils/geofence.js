const toRad = (v) => (v * Math.PI) / 180;

const distanceMeters = (a, b) => {
  if (!a || !b || a.length < 2 || b.length < 2) return Infinity;
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const insideRectangle = (p, start, end) => {
  if (!p || !start || !end) return false;
  const minLat = Math.min(start[0], end[0]);
  const maxLat = Math.max(start[0], end[0]);
  const minLng = Math.min(start[1], end[1]);
  const maxLng = Math.max(start[1], end[1]);
  return p[0] >= minLat && p[0] <= maxLat && p[1] >= minLng && p[1] <= maxLng;
};

/** Construye geometry desde fila de ubicaciones_geograficas */
const geometryFromUbicacion = (row) => {
  if (!row) return null;
  if (row.ubicacion_tipo === 'circle' && row.centro_lat != null && row.centro_lng != null && row.radio != null) {
    return {
      type: 'circle',
      center: [parseFloat(row.centro_lat), parseFloat(row.centro_lng)],
      radius: parseFloat(row.radio),
    };
  }
  if (
    row.esquina1_lat != null && row.esquina1_lng != null &&
    row.esquina2_lat != null && row.esquina2_lng != null
  ) {
    return {
      type: 'rectangle',
      start: [parseFloat(row.esquina1_lat), parseFloat(row.esquina1_lng)],
      end: [parseFloat(row.esquina2_lat), parseFloat(row.esquina2_lng)],
    };
  }
  return null;
};

const isInsideGeometry = (position, geometry) => {
  if (!position || !geometry) return false;
  const p = [parseFloat(position[0]), parseFloat(position[1])];
  if (Number.isNaN(p[0]) || Number.isNaN(p[1])) return false;

  if (geometry.type === 'circle') {
    return distanceMeters(p, geometry.center) <= (geometry.radius || 0);
  }
  if (geometry.type === 'rectangle') {
    return insideRectangle(p, geometry.start, geometry.end);
  }
  return false;
};

const DIAS_MAP = {
  0: ['domingo', 'dom'],
  1: ['lunes', 'lun'],
  2: ['martes', 'mar'],
  3: ['miercoles', 'miércoles', 'mier'],
  4: ['jueves', 'jue'],
  5: ['viernes', 'vie'],
  6: ['sabado', 'sábado', 'sab'],
};

const isAssignedDay = (diasStr, date = new Date()) => {
  if (!diasStr || !String(diasStr).trim()) return true;
  const dayIndex = date.getDay();
  const tokens = DIAS_MAP[dayIndex] || [];
  const normalized = String(diasStr).toLowerCase();
  return tokens.some((t) => normalized.includes(t));
};

module.exports = {
  distanceMeters,
  geometryFromUbicacion,
  isInsideGeometry,
  isAssignedDay,
};
