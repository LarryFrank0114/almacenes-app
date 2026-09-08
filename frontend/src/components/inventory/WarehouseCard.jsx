export default function WarehouseCard({ warehouse }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{warehouse.nombre}</h3>
          <p className="text-sm text-gray-500">{warehouse.distrito}</p>
          <p className="text-sm text-gray-500 mt-1">{warehouse.direccion}</p>
        </div>
        <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full">
          {warehouse.items?.length || 0} items
        </span>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-600">👤 {warehouse.encargado_nombre}</p>
        <p className="text-sm text-gray-600">📞 {warehouse.encargado_telefono}</p>
      </div>
    </div>
  );
}