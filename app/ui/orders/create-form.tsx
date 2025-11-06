'use client';

import { CustomerField } from '@/app/lib/definitions';
import Link from 'next/link';
import {
  UserCircleIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { createOrder, State } from '@/app/lib/actions';
import { useActionState, useState } from 'react';

type Producto = {
  nombre: string;
  precio: string;
};

export default function Form({ customers }: { customers: CustomerField[] }) {
  const initialState: State = { message: '', errors: {} };
  const [state, formAction] = useActionState(createOrder, initialState);
  const [productos, setProductos] = useState<Producto[]>([{ nombre: '', precio: '' }]);

  const agregarProducto = () => {
    setProductos([...productos, { nombre: '', precio: '' }]);
  };

  const eliminarProducto = (index: number) => {
    if (productos.length > 1) {
      setProductos(productos.filter((_, i) => i !== index));
    }
  };

  const actualizarProducto = (index: number, field: keyof Producto, value: string) => {
    const nuevosProductos = [...productos];
    nuevosProductos[index] = { ...nuevosProductos[index], [field]: value };
    setProductos(nuevosProductos);
  };

  return (
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Customer Selection */}
        <div className="mb-4">
          <label htmlFor="clienteId" className="mb-2 block text-sm font-medium">
            Seleccionar Cliente
          </label>
          <div className="relative">
            <select
              id="clienteId"
              name="clienteId"
              className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              defaultValue=""
              aria-describedby="cliente-error"
              required
            >
              <option value="" disabled>
                Seleccione un cliente
              </option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>
          <div id="cliente-error" aria-live="polite" aria-atomic="true">
            {state.errors?.clienteId &&
              state.errors.clienteId.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">
              Productos
            </label>
            <button
              type="button"
              onClick={agregarProducto}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <PlusIcon className="h-4 w-4" />
              Agregar Producto
            </button>
          </div>

          {productos.map((producto, index) => (
            <div key={index} className="mb-3 p-3 border border-gray-200 rounded-md bg-white">
              <div className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Nombre del Producto
                    </label>
                    <input
                      type="text"
                      name={`producto_nombre_${index}`}
                      value={producto.nombre}
                      onChange={(e) => actualizarProducto(index, 'nombre', e.target.value)}
                      placeholder="Ej: Laptop Dell"
                      className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Precio (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      name={`producto_precio_${index}`}
                      value={producto.precio}
                      onChange={(e) => actualizarProducto(index, 'precio', e.target.value)}
                      placeholder="0.00"
                      className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm outline-2"
                      required
                    />
                  </div>
                </div>
                {productos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => eliminarProducto(index)}
                    className="mt-6 p-2 text-red-600 hover:text-red-800"
                    aria-label="Eliminar producto"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {state.errors?.productos &&
            state.errors.productos.map((error: string) => (
              <p className="mt-2 text-sm text-red-500" key={error}>
                {error}
              </p>
            ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/customers"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Create Order</Button>
      </div>
      <div
        className="flex h-8 items-end space-x-1 mt-4"
        aria-live="polite"
        aria-atomic="true"
      >
        {state.message && (
          <p className="text-sm text-red-500">{state.message}</p>
        )}
      </div>
    </form>
  );
}

