import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';
import { clientesApi, proveedoresApi, type ClienteDTO, type FacturaDTO, type PedidoDTO } from './api-client';

// Helper para convertir ClienteDTO a CustomerField
function clienteToCustomer(cliente: ClienteDTO): CustomerField {
  return {
    id: cliente.id.toString(),
    name: cliente.nombre,
  };
}

// Helper para convertir FacturaDTO a Invoice
function facturaToInvoice(factura: FacturaDTO): InvoiceForm {
  return {
    id: factura.id.toString(),
    customer_id: factura.proveedorId.toString(), // Mapear proveedor como cliente para invoices
    amount: Number(factura.totalFactura),
    status: 'pending' as const, // Por defecto pending
  };
}

// Función mock para revenue - los microservicios no tienen esta funcionalidad aún
export async function fetchRevenue(): Promise<Revenue[]> {
  try {
    // Simulamos datos de revenue por ahora
    // TODO: Implementar cuando el backend tenga esta funcionalidad
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const facturas = await proveedoresApi.getFacturas();
    // Generar datos mensuales basados en facturas
    const revenue: Revenue[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 12; i++) {
      revenue.push({
        month: months[i],
        revenue: Math.floor(Math.random() * 5000) + 1000,
      });
    }
    
    return revenue;
  } catch (error) {
    console.error('Error fetching revenue:', error);
    return [];
  }
}

export async function fetchLatestInvoices() {
  try {
    const facturas = await proveedoresApi.getFacturas();
    const proveedores = await proveedoresApi.getProveedores();
    
    // Obtener las últimas 5 facturas
    const latestFacturas = facturas.slice(-5).reverse();
    
    const latestInvoices = latestFacturas.map((factura) => {
      const proveedor = proveedores.find(p => p.id === factura.proveedorId);
      return {
        id: factura.id.toString(),
        name: proveedor?.nombre || 'Desconocido',
        image_url: '', // Ya no se usan imágenes
        email: proveedor?.correo || '',
        amount: formatCurrency(Number(factura.totalFactura) * 100), // Convertir a formato de centavos
      };
    });

    return latestInvoices;
  } catch (error) {
    console.error('Error fetching latest invoices:', error);
    // Retornar array vacío en lugar de lanzar error para evitar problemas en prerendering
    return [];
  }
}

export async function fetchCardData() {
  try {
    // Obtener datos de ambos microservicios en paralelo
    const [clientes, facturas, pedidos] = await Promise.all([
      clientesApi.getClientes(),
      proveedoresApi.getFacturas(),
      clientesApi.getPedidos(),
    ]);

    const numberOfCustomers = clientes.length;
    const numberOfInvoices = facturas.length;
    
    // Calcular totales de facturas
    const totalPaidInvoices = facturas.reduce((sum, f) => sum + Number(f.totalFactura), 0);
    const totalPendingInvoices = totalPaidInvoices * 0.3; // Simulación: 30% pendiente
    
    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices: formatCurrency(totalPaidInvoices * 100),
      totalPendingInvoices: formatCurrency(totalPendingInvoices * 100),
    };
  } catch (error) {
    console.error('Error fetching card data:', error);
    // Retornar valores por defecto en lugar de lanzar error
    return {
      numberOfCustomers: 0,
      numberOfInvoices: 0,
      totalPaidInvoices: formatCurrency(0),
      totalPendingInvoices: formatCurrency(0),
    };
  }
}

const ITEMS_PER_PAGE = 6;

export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const facturas = await proveedoresApi.getFacturas();
    const proveedores = await proveedoresApi.getProveedores();

    // Filtrar facturas
    const filtered = facturas.filter((factura) => {
      const proveedor = proveedores.find(p => p.id === factura.proveedorId);
      const searchTerm = query.toLowerCase();
      return (
        proveedor?.nombre.toLowerCase().includes(searchTerm) ||
        proveedor?.correo.toLowerCase().includes(searchTerm) ||
        factura.totalFactura.toString().includes(searchTerm) ||
        factura.id.toString().includes(searchTerm)
      );
    });

    // Paginar
    const paginated = filtered.slice(offset, offset + ITEMS_PER_PAGE);

    // Convertir a formato InvoicesTable
    const invoices: InvoicesTable[] = paginated.map((factura) => {
      const proveedor = proveedores.find(p => p.id === factura.proveedorId);
      return {
        id: factura.id.toString(),
        customer_id: factura.proveedorId.toString(),
        name: proveedor?.nombre || 'Desconocido',
        email: proveedor?.correo || '',
        image_url: '', // Ya no se usan imágenes
        date: new Date().toISOString().split('T')[0], // Fecha actual como placeholder
        amount: Number(factura.totalFactura) * 100, // Convertir a centavos
        status: 'pending' as const,
      };
    });

    return invoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const facturas = await proveedoresApi.getFacturas();
    const proveedores = await proveedoresApi.getProveedores();

    // Filtrar facturas
    const filtered = facturas.filter((factura) => {
      const proveedor = proveedores.find(p => p.id === factura.proveedorId);
      const searchTerm = query.toLowerCase();
      return (
        proveedor?.nombre.toLowerCase().includes(searchTerm) ||
        proveedor?.correo.toLowerCase().includes(searchTerm) ||
        factura.totalFactura.toString().includes(searchTerm) ||
        factura.id.toString().includes(searchTerm)
      );
    });

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const factura = await proveedoresApi.getFactura(Number(id));
    
    return {
      id: factura.id.toString(),
      customer_id: factura.proveedorId.toString(),
      amount: Number(factura.totalFactura),
      status: 'pending' as const,
    };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    // Retornar null en lugar de lanzar error durante build/prerendering
    return null;
  }
}

export async function fetchCustomers() {
  try {
    const clientes = await clientesApi.getClientes();
    return clientes.map(clienteToCustomer);
  } catch (err) {
    console.error('Error fetching customers:', err);
    // Retornar array vacío durante build/prerendering
    return [];
  }
}

export async function fetchCustomerById(id: string) {
  try {
    const cliente = await clientesApi.getCliente(Number(id));
    return {
      id: cliente.id.toString(),
      name: cliente.nombre,
      email: cliente.correo,
    };
  } catch (error) {
    console.error('Error fetching customer:', error);
    return null;
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const clientes = await clientesApi.getClientes();
    
    // Intentar obtener pedidos, pero si falla, continuar sin ellos
    let pedidos: PedidoDTO[] = [];
    try {
      pedidos = await clientesApi.getPedidos();
    } catch (pedidosError) {
      console.warn('No se pudieron obtener pedidos, continuando sin estadísticas:', pedidosError);
      // Continuar sin pedidos
    }

    // Filtrar clientes
    const filtered = clientes.filter((cliente) => {
      const searchTerm = query.toLowerCase();
      return (
        cliente.nombre.toLowerCase().includes(searchTerm) ||
        cliente.correo.toLowerCase().includes(searchTerm)
      );
    });

    // Mapear a CustomersTableType con información de pedidos
    const customers: CustomersTableType[] = filtered.map((cliente) => {
      const clientePedidos = pedidos.filter(p => p.clienteId === cliente.id);
      const total_invoices = clientePedidos.length;
      const total_pending = clientePedidos.reduce((sum, p) => sum + Number(p.total || 0), 0) * 0.3;
      const total_paid = clientePedidos.reduce((sum, p) => sum + Number(p.total || 0), 0) * 0.7;

      return {
        id: cliente.id.toString(),
        name: cliente.nombre,
        email: cliente.correo,
        image_url: '', // Ya no se usan imágenes
        total_invoices,
        total_pending: total_pending * 100, // Convertir a centavos
        total_paid: total_paid * 100, // Convertir a centavos
      };
    });

    return customers.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));
  } catch (err) {
    console.error('Error fetching filtered customers:', err);
    // Retornar array vacío durante build/prerendering o si hay error
    return [];
  }
}
