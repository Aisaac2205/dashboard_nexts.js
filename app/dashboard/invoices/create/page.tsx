import Form from '@/app/ui/invoices/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { proveedoresApi, clientesApi } from '@/app/lib/api-client';
import { Metadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';

export const metadata: Metadata = {
  title: 'Create Invoice',
};
 
export default async function Page() {
  noStore();
  
  // Obtener proveedores y pedidos
  const [proveedores, pedidos] = await Promise.all([
    proveedoresApi.getProveedores().catch(() => []),
    clientesApi.getPedidos().catch(() => []),
  ]);

  // Convertir proveedores al formato CustomerField
  const providers = proveedores.map(p => ({
    id: p.id.toString(),
    name: p.nombre,
  }));

  // Convertir pedidos al formato necesario
  const orders = pedidos.map(p => ({
    id: p.id,
    total: Number(p.total || 0),
  }));

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Create Invoice',
            href: '/dashboard/invoices/create',
            active: true,
          },
        ]}
      />
      <Form providers={providers} orders={orders} />
    </main>
  );
}

