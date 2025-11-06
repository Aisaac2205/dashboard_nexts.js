'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { clientesApi, proveedoresApi } from './api-client';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoiceSchema = z.object({
  proveedorId: z.string({
    invalid_type_error: 'Por favor seleccione un proveedor.',
  }),
  pedidoId: z.string({
    invalid_type_error: 'Por favor seleccione un pedido.',
  }),
});

const CreateOrderSchema = z.object({
  clienteId: z.string({
    invalid_type_error: 'Por favor seleccione un cliente.',
  }),
  productos: z.array(z.object({
    nombre: z.string().min(1, { message: 'El nombre del producto es obligatorio' }),
    precio: z.coerce.number().gt(0, { message: 'El precio debe ser mayor a 0' }),
  })).min(1, { message: 'Debe agregar al menos un producto' }),
});

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// Schema para clientes
const ClienteSchema = z.object({
  nombre: z.string().min(1, { message: 'El nombre es obligatorio' }),
  correo: z.string().email({ message: 'El correo debe ser válido' }),
});

const CreateCliente = ClienteSchema;

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
    nombre?: string[];
    correo?: string[];
    proveedorId?: string[];
    pedidoId?: string[];
    clienteId?: string[];
    productos?: string[];
  };
  message: string;
};

export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form using Zod
  const validatedFields = CreateInvoiceSchema.safeParse({
    proveedorId: formData.get('proveedorId'),
    pedidoId: formData.get('pedidoId'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Campos faltantes. No se pudo crear la factura.',
    };
  }

  // Prepare data for API call
  const { proveedorId, pedidoId } = validatedFields.data;
  
  try {
    const proveedorIdNum = Number(proveedorId);
    const pedidoIdNum = Number(pedidoId);
    
    // Obtener el pedido para obtener su total
    const pedido = await clientesApi.getPedido(pedidoIdNum);
    
    if (!pedido) {
      return {
        message: 'El pedido seleccionado no existe.',
      };
    }

    // Crear la referencia del pedido con el total correcto
    const pedidoReferencia = {
      pedidoId: pedido.id,
      total: Number(pedido.total || 0),
    };

    await proveedoresApi.createFactura({
      proveedorId: proveedorIdNum,
      pedidos: [pedidoReferencia],
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return {
      message: `Error al crear la factura: ${errorMessage}`,
    };
  }

  // Revalidate the cache for the invoices page and redirect the user.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  try {
    // TODO: Implementar actualización de factura cuando el backend lo soporte
    // Por ahora, solo revalidamos la caché
    console.log('Update invoice:', { id, customerId, amount, status });
  } catch (error) {
    console.error(error);
    // En caso de error, redirigir de todas formas
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    // TODO: Implementar eliminación de factura cuando el backend lo soporte
    // Por ahora, solo revalidamos la caché
    console.log('Delete invoice:', id);
    revalidatePath('/dashboard/invoices');
    // No retornar nada para que sea compatible con form action
  } catch (error) {
    console.error(error);
    // En caso de error, redirigir de todas formas
  }
  redirect('/dashboard/invoices');
}

// Acciones para Clientes
export async function createCustomer(prevState: State, formData: FormData) {
  const validatedFields = CreateCliente.safeParse({
    nombre: formData.get('nombre'),
    correo: formData.get('correo'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Campos faltantes. No se pudo crear el cliente.',
    };
  }

  const { nombre, correo } = validatedFields.data;

  try {
    await clientesApi.createCliente({
      nombre,
      correo,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return {
      message: 'Error: No se pudo crear el cliente.',
    };
  }

  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

export async function updateCustomer(id: string, formData: FormData) {
  const validatedFields = CreateCliente.safeParse({
    nombre: formData.get('nombre'),
    correo: formData.get('correo'),
  });

  if (!validatedFields.success) {
    // En caso de error de validación, redirigir de todas formas
    console.error('Validation error:', validatedFields.error);
  } else {
    const { nombre, correo } = validatedFields.data;

    try {
      await clientesApi.updateCliente(Number(id), {
        nombre,
        correo,
      });
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  }

  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

export async function deleteCustomer(id: string) {
  try {
    await clientesApi.deleteCliente(Number(id));
    revalidatePath('/dashboard/customers');
  } catch (error) {
    console.error('Error deleting customer:', error);
  }
  redirect('/dashboard/customers');
}

// Acciones para Pedidos
export async function createOrder(prevState: State, formData: FormData) {
  // Extraer productos del formData
  const productos: Array<{ nombre: string; precio: number }> = [];
  let index = 0;
  
  while (formData.get(`producto_nombre_${index}`)) {
    const nombre = formData.get(`producto_nombre_${index}`) as string;
    const precio = formData.get(`producto_precio_${index}`) as string;
    
    if (nombre && precio) {
      productos.push({
        nombre: nombre.trim(),
        precio: parseFloat(precio),
      });
    }
    index++;
  }

  const validatedFields = CreateOrderSchema.safeParse({
    clienteId: formData.get('clienteId'),
    productos: productos,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Campos faltantes. No se pudo crear el pedido.',
    };
  }

  const { clienteId, productos: productosValidados } = validatedFields.data;

  try {
    await clientesApi.createPedido({
      clienteId: Number(clienteId),
      productos: productosValidados.map(p => ({
        nombre: p.nombre,
        precio: p.precio,
      })),
    });
  } catch (error) {
    console.error('Error creating order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return {
      message: `Error al crear el pedido: ${errorMessage}`,
    };
  }

  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

// Acciones para Proveedores
export async function createProvider(prevState: State, formData: FormData) {
  const validatedFields = CreateCliente.safeParse({
    nombre: formData.get('nombre'),
    correo: formData.get('correo'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Campos faltantes. No se pudo crear el proveedor.',
    };
  }

  const { nombre, correo } = validatedFields.data;

  try {
    await proveedoresApi.createProveedor({
      nombre,
      correo,
    });
  } catch (error) {
    console.error('Error creating provider:', error);
    return {
      message: 'Error: No se pudo crear el proveedor.',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}
