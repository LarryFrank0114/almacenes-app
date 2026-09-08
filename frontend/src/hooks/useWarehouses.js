import { useState, useEffect } from 'react';
import { warehouseService } from '../services/api';
import toast from 'react-hot-toast';

export function useWarehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await warehouseService.getAll();
      setWarehouses(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Error al cargar almacenes');
    } finally {
      setLoading(false);
    }
  };

  const createWarehouse = async (data) => {
    try {
      const response = await warehouseService.create(data);
      setWarehouses([...warehouses, response.data]);
      toast.success('Almacén creado exitosamente');
      return response.data;
    } catch (err) {
      toast.error('Error al crear almacén');
      throw err;
    }
  };

  const updateWarehouse = async (id, data) => {
    try {
      const response = await warehouseService.update(id, data);
      setWarehouses(warehouses.map(w => w.id === id ? response.data : w));
      toast.success('Almacén actualizado');
      return response.data;
    } catch (err) {
      toast.error('Error al actualizar almacén');
      throw err;
    }
  };

  const deleteWarehouse = async (id) => {
    try {
      await warehouseService.delete(id);
      setWarehouses(warehouses.filter(w => w.id !== id));
      toast.success('Almacén eliminado');
    } catch (err) {
      toast.error('Error al eliminar almacén');
      throw err;
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  return {
    warehouses,
    loading,
    error,
    fetchWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse
  };
}