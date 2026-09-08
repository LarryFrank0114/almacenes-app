import { supabase } from '../../services/supabase';

// Configurar para aceptar payloads grandes
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'No hay productos para procesar' });
    }

    console.log(`📤 Procesando ${products.length} productos...`);

    // 1. Obtener todos los almacenes
    const { data: almacenes, error: almacenError } = await supabase
      .from('almacenes')
      .select('id, nombre');

    if (almacenError) {
      return res.status(500).json({ error: 'Error al obtener almacenes: ' + almacenError.message });
    }

    // Crear mapa de nombres a IDs (incluyendo espacios)
    const almacenMap = {};
    almacenes.forEach(a => {
      almacenMap[a.nombre.trim()] = a.id;
    });

    console.log('📦 Almacenes disponibles:', Object.keys(almacenMap));

    // 2. Preparar productos con validación
    const itemsToInsert = [];
    const errors = [];
    const warnings = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const rowNum = i + 2;

      try {
        // ✅ LIMPIAR Y TRUNCAR CAMPOS (RESPETANDO TU EXCEL)
        const nombre = (product.nombre?.toString().trim() || '').substring(0, 500);
        const codigo = (product.codigo?.toString().trim() || '').substring(0, 100);
        const almacenNombre = product.almacen_nombre?.toString().trim() || '';

        // Validar campos requeridos
        if (!nombre) {
          errors.push(`❌ Fila ${rowNum}: Falta "nombre"`);
          continue;
        }

        if (!codigo) {
          errors.push(`❌ Fila ${rowNum}: Falta "codigo"`);
          continue;
        }

        if (!almacenNombre) {
          errors.push(`❌ Fila ${rowNum}: Falta "almacen_nombre"`);
          continue;
        }

        // ✅ BUSCAR ALMACÉN (con tolerancia a espacios)
        const almacenId = almacenMap[almacenNombre] || almacenMap[almacenNombre.trim()];
        if (!almacenId) {
          errors.push(`❌ Fila ${rowNum}: Almacén "${almacenNombre}" no encontrado`);
          continue;
        }

        // ✅ CATEGORÍA = PROVEEDOR (tal cual viene en tu Excel)
        const categoria = product.categoria?.toString().trim() || null;
        const descripcion = product.descripcion?.toString().trim() || null;
        const unidad_medida = product.unidad_medida?.toString().trim() || 'unidad';
        const ubicacion = product.ubicacion?.toString().trim() || null;

        // Truncar solo si excede límites (tu Excel tiene nombres largos de proveedores)
        const truncatedCategoria = categoria ? categoria.substring(0, 100) : null;
        const truncatedDescripcion = descripcion ? descripcion.substring(0, 2000) : null;
        const truncatedUnidad = unidad_medida.substring(0, 50);
        const truncatedUbicacion = ubicacion ? ubicacion.substring(0, 200) : null;

        // ✅ VALIDAR NÚMEROS
        const stock = parseInt(product.stock) || 0;
        const precio = parseFloat(product.precio) || 0;

        if (isNaN(stock) || stock < 0) {
          errors.push(`❌ Fila ${rowNum}: "stock" inválido (${product.stock})`);
          continue;
        }

        if (isNaN(precio) || precio < 0) {
          errors.push(`❌ Fila ${rowNum}: "precio" inválido (${product.precio})`);
          continue;
        }

        // ✅ REGISTRAR ADVERTENCIAS (sin bloquear)
        let warning = '';
        if (product.categoria?.toString().trim()?.length > 100) {
          warning += `categoría truncada (100 caracteres) `;
        }

        if (warning) {
          warnings.push(`⚠️ Fila ${rowNum}: ${warning.trim()}`);
        }

        itemsToInsert.push({
          nombre: nombre,
          codigo: codigo,
          categoria: truncatedCategoria,  // ← TU PROVEEDOR COMO CATEGORÍA
          descripcion: truncatedDescripcion,
          stock: stock,
          stock_minimo: product.stock_minimo ? parseInt(product.stock_minimo) : 5,
          precio: precio,
          precio_costo: product.precio_costo ? parseFloat(product.precio_costo) : null,
          unidad_medida: truncatedUnidad,
          ubicacion: truncatedUbicacion,
          almacen_id: almacenId,
          activo: true
        });

      } catch (error) {
        errors.push(`❌ Fila ${rowNum}: Error procesando - ${error.message}`);
      }
    }

    console.log(`📦 ${itemsToInsert.length} productos válidos de ${products.length} totales`);
    console.log(`⚠️ ${warnings.length} advertencias`);

    if (itemsToInsert.length === 0) {
      return res.status(200).json({
        success: true,
        total: products.length,
        inserted: 0,
        errors: errors,
        warnings: warnings,
        message: 'No hay productos válidos para insertar'
      });
    }

    // 3. Insertar en lotes de 500
    const CHUNK_SIZE = 500;
    const chunks = [];
    for (let i = 0; i < itemsToInsert.length; i += CHUNK_SIZE) {
      chunks.push(itemsToInsert.slice(i, i + CHUNK_SIZE));
    }

    console.log(`📦 Dividiendo en ${chunks.length} lotes de ${CHUNK_SIZE} productos`);

    let inserted = 0;
    let chunkErrors = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`📤 Subiendo lote ${i + 1}/${chunks.length} (${chunk.length} productos)...`);

      try {
        const { data, error } = await supabase
          .from('items')
          .upsert(chunk, { 
            onConflict: 'codigo',
            ignoreDuplicates: false 
          });

        if (error) {
          chunkErrors.push(`❌ Lote ${i + 1}: ${error.message}`);
          continue;
        }

        inserted += chunk.length;
        console.log(`✅ Lote ${i + 1} completado (${chunk.length} productos)`);

      } catch (error) {
        chunkErrors.push(`❌ Lote ${i + 1}: ${error.message}`);
      }
    }

    const allErrors = [...errors, ...chunkErrors];

    return res.status(200).json({
      success: true,
      total: products.length,
      validos: itemsToInsert.length,
      inserted: inserted,
      errors: allErrors,
      warnings: warnings,
      chunks: chunks.length,
      message: `${inserted} de ${itemsToInsert.length} productos insertados correctamente`
    });

  } catch (error) {
    console.error('❌ Error en upload-products:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Error al procesar la carga de productos: ' + error.message 
    });
  }
}