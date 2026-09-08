import { useState, useEffect } from 'react';
import { itemService } from '../services/api';
import toast from 'react-hot-toast';

export function useItems(filters = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchItems = async (newFilters = {}) => {
    try {
      setLoading(true);
      const params = { ...filters, ...newFilters };
      const response = await itemService.getAll(params);
      setItems(response.data);
      setTotal(response.data.length);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (data) => {
    try {
      const response = await itemService.create(data);
      setItems([...items, response.data]);
      toast.success('Producto creado exitosamente');
      return response.data;
    } catch (err) {
      toast.error('Error al crear producto');
      throw err;
    }
  };

  const updateItem = async (id, data) => {
    try {
      const response = await itemService.update(id, data);
      setItems(items.map(item => item.id === id ? response.data : item));
      toast.success('Producto actualizado');
      return response.data;
    } catch (err) {
      toast.error('Error al actualizar producto');
      throw err;
    }
  };

  const deleteItem = async (id) => {
    try {
      await itemService.delete(id);
      setItems(items.filter(item => item.id !== id));
      toast.success('Producto eliminado');
    } catch (err) {
      toast.error('Error al eliminar producto');
      throw err;
    }
  };

  const updateStock = async (id, cantidad) => {
    try {
      const response = await itemService.updateStock(id, cantidad);
      setItems(items.map(item => 
        item.id === id ? { ...item, stock: response.data.stock } : item
      ));
      toast.success('Stock actualizado');
      return response.data;
    } catch (err) {
      toast.error('Error al actualizar stock');
      throw err;
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return {
    items,
    loading,
    error,
    total,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    updateStock
  };
}