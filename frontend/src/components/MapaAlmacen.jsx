import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';

// CORREGIR ICONOS DE LEAFLET (usando CDN)
const fixLeafletIcons = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
};

export default function MapaAlmacen({ almacenes = [] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fixLeafletIcons();
  }, []);

  if (!mounted || typeof window === 'undefined') {
    return (
      <div className="glass rounded-2xl p-8 text-center border border-white/5 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Cargando mapa...</p>
        </div>
      </div>
    );
  }

  const almacenesConUbicacion = almacenes.filter(w => w.latitud && w.longitud);
  
  if (almacenesConUbicacion.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center border border-white/5 h-96 flex items-center justify-center">
        <div>
          <p className="text-2xl mb-2">🗺️</p>
          <p className="text-gray-400">No hay almacenes con ubicación registrada</p>
          <p className="text-gray-500 text-sm mt-2">
            Agrega latitud y longitud a tus almacenes para verlos en el mapa
          </p>
        </div>
      </div>
    );
  }

  const center = [
    almacenesConUbicacion[0].latitud,
    almacenesConUbicacion[0].longitud
  ];

  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/5 h-96">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        className="z-10"
        zoomControl={false}
        scrollWheelZoom={true}
      >
        {/* ✅ CAMBIADO: Usar OpenStreetMap gratuito (sin API Key) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" style="color:#00d4ff;">OpenStreetMap</a>'
        />
        {almacenesConUbicacion.map((almacen) => (
          <Marker
            key={almacen.id}
            position={[almacen.latitud, almacen.longitud]}
          >
            <Popup>
              <div className="p-2 min-w-[150px] bg-crystal-dark rounded-lg">
                <h3 className="font-bold text-white text-sm">{almacen.nombre}</h3>
                <p className="text-gray-300 text-xs">{almacen.direccion}</p>
                <p className="text-gray-400 text-xs mt-1">📞 {almacen.encargado_telefono}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}