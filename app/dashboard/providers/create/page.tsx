import Form from '@/app/ui/providers/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Provider',
};
 
export default async function Page() {
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Create Provider',
            href: '/dashboard/providers/create',
            active: true,
          },
        ]}
      />
      <Form />
    </main>
  );
}

