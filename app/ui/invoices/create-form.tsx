'use client';

import { CustomerField } from '@/app/lib/definitions';
import Link from 'next/link';
import {
  CurrencyDollarIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { createInvoice, State } from '@/app/lib/actions';
import { useActionState } from 'react';

export default function Form({ providers, orders }: { providers: CustomerField[], orders: Array<{ id: number, total: number }> }) {
  const initialState: State = { message: '', errors: {} };
  const [state, formAction] = useActionState(createInvoice, initialState);

  // Si no hay proveedores, mostrar mensaje y botón para crear
  if (providers.length === 0) {
    return (
      <div className="rounded-md bg-yellow-50 p-4 md:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            No hay proveedores registrados
          </h3>
          <p className="text-sm text-yellow-700 mb-4">
            Para crear una factura, primero necesitas registrar al menos un proveedor.
            Las facturas son documentos que los proveedores emiten para cobrar por pedidos realizados.
          </p>
          <Link
            href="/dashboard/providers/create"
            className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            Crear Proveedor
          </Link>
        </div>
      </div>
    );
  }

  // Si no hay pedidos, mostrar mensaje
  if (orders.length === 0) {
    return (
      <div className="rounded-md bg-yellow-50 p-4 md:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            No hay pedidos disponibles
          </h3>
          <p className="text-sm text-yellow-700 mb-4">
            Para crear una factura, necesitas tener al menos un pedido registrado.
            Las facturas se crean para facturar pedidos existentes.
          </p>
          <Link
            href="/dashboard/customers"
            className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            Ver Clientes y Pedidos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Información sobre facturas */}
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>¿Qué es una factura?</strong> Una factura es un documento que un proveedor emite 
            para cobrar por uno o más pedidos que ya han sido realizados por los clientes.
          </p>
        </div>

        {/* Provider Selection */}
        <div className="mb-4">
          <label htmlFor="provider" className="mb-2 block text-sm font-medium">
            Seleccionar proveedor
          </label>
          <div className="relative">
            <select
              id="provider"
              name="proveedorId"
              className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              defaultValue=""
              aria-describedby="provider-error"
              required
            >
              <option value="" disabled>
                Seleccione un proveedor
              </option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-xs text-gray-500">¿No encuentras el proveedor?</p>
            <Link
              href="/dashboard/providers/create"
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Crear nuevo proveedor
            </Link>
          </div>
          <div id="provider-error" aria-live="polite" aria-atomic="true">
            {state.errors?.proveedorId &&
              state.errors.proveedorId.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

        {/* Order Selection */}
        <div className="mb-4">
          <label htmlFor="order" className="mb-2 block text-sm font-medium">
            Seleccionar pedido
          </label>
          <div className="relative">
            <select
              id="order"
              name="pedidoId"
              className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              defaultValue=""
              aria-describedby="order-error"
              required
            >
              <option value="" disabled>
                Seleccione un pedido
              </option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  Pedido #{order.id} - ${order.total.toFixed(2)}
                </option>
              ))}
            </select>
            <CurrencyDollarIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>
          <div id="order-error" aria-live="polite" aria-atomic="true">
            {state.errors?.pedidoId &&
              state.errors.pedidoId.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/invoices"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Create Invoice</Button>
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
