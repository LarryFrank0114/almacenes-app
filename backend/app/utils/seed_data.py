from sqlalchemy.orm import Session
from ..models.almacen import Almacen
from ..models.item import Item
import random

def seed_database(db: Session):
    # Crear 4 almacenes
    almacenes_data = [
        {
            "nombre": "Almacén Norte",
            "distrito": "Independencia",
            "direccion": "Av. Túpac Amaru 1234",
            "encargado_nombre": "Carlos Rodríguez",
            "encargado_telefono": "987654321",
            "latitud": -11.9999,
            "longitud": -77.0525
        },
        {
            "nombre": "Almacén Sur",
            "distrito": "San Juan de Miraflores",
            "direccion": "Av. Los Pinos 567",
            "encargado_nombre": "María Fernández",
            "encargado_telefono": "976543210",
            "latitud": -12.1560,
            "longitud": -76.9750
        },
        {
            "nombre": "Almacén Este",
            "distrito": "Ate",
            "direccion": "Carretera Central Km 12",
            "encargado_nombre": "Juan Pérez",
            "encargado_telefono": "965432109",
            "latitud": -12.0132,
            "longitud": -76.9186
        },
        {
            "nombre": "Almacén Oeste",
            "distrito": "Callao",
            "direccion": "Av. Elmer Faucett 890",
            "encargado_nombre": "Ana Gómez",
            "encargado_telefono": "954321098",
            "latitud": -12.0543,
            "longitud": -77.1298
        }
    ]
    
    categorias = ["Electrónica", "Ropa", "Alimentos", "Herramientas", "Oficina"]
    unidades = ["unidad", "kg", "litro", "metro", "caja"]
    nombres_items = [
        "Laptop", "Monitor", "Teclado", "Mouse", "Impresora", "Camisa", "Pantalón",
        "Zapatos", "Arroz", "Azúcar", "Aceite", "Martillo", "Destornillador",
        "Papel", "Tinta", "Café", "Té", "Chocolate", "Galletas", "Jabón"
    ]
    
    # Insertar almacenes
    almacenes_creados = []
    for almacen_data in almacenes_data:
        almacen = Almacen(**almacen_data)
        db.add(almacen)
        db.commit()
        db.refresh(almacen)
        almacenes_creados.append(almacen)
    
    # Crear 5000 items (distribuidos entre almacenes)
    for i in range(5000):
        almacen = random.choice(almacenes_creados)
        nombre = random.choice(nombres_items) + f" {i+1}"
        
        item = Item(
            nombre=nombre,
            descripcion=f"Descripción del item {i+1}",
            codigo=f"COD-{i+1:05d}",
            categoria=random.choice(categorias),
            stock=random.randint(0, 100),
            stock_minimo=random.randint(1, 10),
            precio=round(random.uniform(10, 500), 2),
            precio_costo=round(random.uniform(5, 400), 2),
            unidad_medida=random.choice(unidades),
            almacen_id=almacen.id
        )
        db.add(item)
    
    db.commit()
    print("✅ Datos de prueba insertados correctamente!")