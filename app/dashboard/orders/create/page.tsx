import Form from '@/app/ui/orders/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchCustomers } from '@/app/lib/data';
import { Metadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';

export const metadata: Metadata = {
  title: 'Create Order',
};
 
export default async function Page() {
  noStore();
  const customers = await fetchCustomers();

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Customers', href: '/dashboard/customers' },
          {
            label: 'Create Order',
            href: '/dashboard/orders/create',
            active: true,
          },
        ]}
      />
      <Form customers={customers} />
    </main>
  );
}

