/**
 * Cliente API para comunicarse con los microservicios Java
 */

// Declaración de tipo para process.env en Next.js
declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

// Tipos basados en los DTOs de Java
export type ClienteDTO = {
  id: number;
  nombre: string;
  correo: string;
};

export type ClienteInputDTO = {
  nombre: string;
  correo: string;
};

export type ProductoDTO = {
  nombre: string;
  precio: number;
};

export type PedidoDTO = {
  id: number;
  clienteId: number;
  productos: ProductoDTO[];
  total: number;
};

export type PedidoInputDTO = {
  clienteId: number;
  productos: ProductoDTO[];
};

export type ProveedorDTO = {
  id: number;
  nombre: string;
  correo: string;
};

export type ProveedorInputDTO = {
  nombre: string;
  correo: string;
};

export type PedidoReferenciaDTO = {
  pedidoId: number;
  total: number;
};

export type FacturaDTO = {
  id: number;
  proveedorId: number;
  pedidos: PedidoReferenciaDTO[];
  totalFactura: number;
};

export type FacturaInputDTO = {
  proveedorId: number;
  pedidos: PedidoReferenciaDTO[];
};

// URLs base de los microservicios
// En Next.js, las variables NEXT_PUBLIC_* están disponibles en el cliente
const getEnvVar = (key: string, defaultValue: string): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  return defaultValue;
};

const CLIENTES_API_URL = getEnvVar('NEXT_PUBLIC_CLIENTES_API_URL', 'http://localhost:8080');
const PROVEEDORES_API_URL = getEnvVar('NEXT_PUBLIC_PROVEEDORES_API_URL', 'http://localhost:8081');

/**
 * Cliente para el microservicio de Clientes y Pedidos
 */
class ClientesApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      cache: 'no-store', // Evitar cache para datos dinámicos
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = `API Error: ${response.status} - ${errorText}`;
      console.error(errorMessage);
      // Para errores del servidor (500), lanzar error para que el caller lo maneje
      // Para errores de cliente (400-499), también lanzar pero con más información
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T; // No content
    }

    return response.json();
  }

  // Clientes
  async getClientes(): Promise<ClienteDTO[]> {
    return this.request<ClienteDTO[]>('/api/clientes');
  }

  async getCliente(id: number): Promise<ClienteDTO> {
    return this.request<ClienteDTO>(`/api/clientes/${id}`);
  }

  async createCliente(data: ClienteInputDTO): Promise<ClienteDTO> {
    return this.request<ClienteDTO>('/api/clientes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCliente(id: number, data: ClienteInputDTO): Promise<ClienteDTO> {
    return this.request<ClienteDTO>(`/api/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCliente(id: number): Promise<void> {
    await this.request<void>(`/api/clientes/${id}`, {
      method: 'DELETE',
    });
  }

  // Pedidos
  async getPedidos(): Promise<PedidoDTO[]> {
    try {
      return await this.request<PedidoDTO[]>('/api/pedidos');
    } catch (error) {
      console.error('Error fetching pedidos:', error);
      // Si hay error (ej: tabla vacía, error 500), retornar array vacío
      return [];
    }
  }

  async getPedido(id: number): Promise<PedidoDTO> {
    return this.request<PedidoDTO>(`/api/pedidos/${id}`);
  }

  async getPedidosByCliente(clienteId: number): Promise<PedidoDTO[]> {
    return this.request<PedidoDTO[]>(`/api/pedidos/cliente/${clienteId}`);
  }

  async createPedido(data: PedidoInputDTO): Promise<PedidoDTO> {
    return this.request<PedidoDTO>('/api/pedidos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

/**
 * Cliente para el microservicio de Proveedores y Facturación
 */
class ProveedoresApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      cache: 'no-store', // Evitar cache para datos dinámicos
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = `API Error: ${response.status} - ${errorText}`;
      console.error(errorMessage);
      // Para errores del servidor (500), lanzar error para que el caller lo maneje
      // Para errores de cliente (400-499), también lanzar pero con más información
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Proveedores
  async getProveedores(): Promise<ProveedorDTO[]> {
    return this.request<ProveedorDTO[]>('/api/proveedores');
  }

  async getProveedor(id: number): Promise<ProveedorDTO> {
    return this.request<ProveedorDTO>(`/api/proveedores/${id}`);
  }

  async createProveedor(data: ProveedorInputDTO): Promise<ProveedorDTO> {
    return this.request<ProveedorDTO>('/api/proveedores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Facturas
  async getFacturas(): Promise<FacturaDTO[]> {
    return this.request<FacturaDTO[]>('/api/facturas');
  }

  async getFactura(id: number): Promise<FacturaDTO> {
    return this.request<FacturaDTO>(`/api/facturas/${id}`);
  }

  async createFactura(data: FacturaInputDTO): Promise<FacturaDTO> {
    return this.request<FacturaDTO>('/api/facturas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Exportar instancias singleton
export const clientesApi = new ClientesApiClient(CLIENTES_API_URL);
export const proveedoresApi = new ProveedoresApiClient(PROVEEDORES_API_URL);

