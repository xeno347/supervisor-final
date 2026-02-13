// API Configuration and Utilities

let ENV_BASE_URL: string | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ENV_BASE_URL = require('@env')?.BASE_URL;
} catch {
  ENV_BASE_URL = undefined;
}

// Base URL for API endpoints
export const BASE_URL =
  (typeof ENV_BASE_URL === 'string' && ENV_BASE_URL.trim().length > 0
    ? ENV_BASE_URL.trim()
    : undefined) ||
  // Fallback placeholder (should be overridden by `.env`)
  'https://farm-connect.amritagrotech.com/api';

// Enable verbose API logs while debugging network issues.
// Set to false once things are working.
const API_DEBUG = true;

// API Endpoints
export const API_ENDPOINTS = {
  SUPERVISOR_LOGIN: `${BASE_URL}/supervisor_management/supervisor_login`,
  // Add more endpoints here as needed
};

// API Response Types
export interface LoginResponse {
  success: boolean;
  supervisor_id?: string;
  name?: string;
  message?: string;
}

export interface MyTaskAllocationSchemaItem {
  allocated_acres: number;
  farm_id: string;
  completed_acres: number;
}

export interface MyTaskAssignedAcreItem {
  date: string;
  activity: string;
  assigned_acres: number;
  farm_id: string;
}

export interface MyTaskApiItem {
  // Backend returns `task_allocation` (not `allocation_schema`)
  task_allocation: MyTaskAllocationSchemaItem[];
  // Some backends may still send created_at; keep optional for compatibility
  created_at?: string;
  task_id: string;
  // Optional fields can be absent in response
  feild_id?: string[];
  assigned_acres?: MyTaskAssignedAcreItem[];
  vehicles?: any[];
  equipment?: any[];
}

export interface GetMyTasksResponse {
  tasks: MyTaskApiItem[];
}

export interface HarvestOrderVehicle {
  vehicle_id: string;
  driver_contact: string;
  vehicle_number: string;
}

export interface HarvestOrderApiItem {
  order_id: string;
  created_at: string;
  status: string;
  tipper_card_number: string | null;
  supervisor_details?: {
    supervisor_name?: string;
    suervisor_contact?: string;
    supervisor_id?: string;
  };
  farm_details?: {
    farm_id?: string;
    area?: number;
    block_name?: string;
    farming_option?: string;
    farmer_name?: string;
  };
  field_manager_details?: {
    name?: string;
    field_manager_id?: string;
    contact?: string;
  };
  vehicle_details?: {
    harvestors?: HarvestOrderVehicle[];
    tractors?: HarvestOrderVehicle[];
  };
  trip_sheet?: any[];
}

export interface GetHarvestOrdersResponse {
  harvest_orders: HarvestOrderApiItem[];
}

// Generic API request function
export const apiRequest = async (
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<any> => {
  try {
    const options: RequestInit = {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    if (API_DEBUG) {
      console.log('[API] Request:', {
        url,
        method,
        body: body ?? null,
      });
    }

    const response = await fetch(url, options);

    if (API_DEBUG) {
      console.log('[API] Response:', {
        url,
        method,
        status: response.status,
        ok: response.ok,
      });
    }

    const text = await response.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (API_DEBUG) {
      console.log('[API] Body:', data);
    }

    if (!response.ok) {
      const msg =
        (typeof data?.message === 'string' && data.message) ||
        (typeof data?.detail === 'string' && data.detail) ||
        `HTTP error! status: ${response.status}`;
      throw new Error(msg);
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Supervisor Login API
export const supervisorLogin = async (
  user_id: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const response = await apiRequest(
      API_ENDPOINTS.SUPERVISOR_LOGIN,
      'POST',
      {
        user_id,
        password,
      }
    );
    return response;
  } catch (error) {
    console.error('Login API Error:', error);
    throw error;
  }
};

// Get My Tasks API
export const getMyTasks = async (supervisorId: string): Promise<GetMyTasksResponse> => {
  // Backend endpoint is `get_my_tasks` (plural)
  const url = `${BASE_URL}/supervisor_management/get_my_tasks/${encodeURIComponent(supervisorId)}`;
  return apiRequest(url, 'GET');
};

// Get Harvest Orders API
export const getHarvestOrders = async (): Promise<GetHarvestOrdersResponse> => {
  const url = `${BASE_URL}/Harvest_management/get_harvest_orders`;
  return apiRequest(url, 'GET');
};

// Start Trip API for Harvest
export interface StartTripRequest {
  order_id: string;
  card_number: string;
}

export interface StartTripResponse {
  success?: boolean;
  message?: string;
  [key: string]: any;
}

export const startHarvestTrip = async (payload: StartTripRequest): Promise<StartTripResponse> => {
  const url = `${BASE_URL}/Harvest_management/start_trip`;
  return apiRequest(url, 'POST', payload);
};

// Get Farm Location API
export const getFarmLocation = async (farmId: string): Promise<{ location?: number[] }> => {
  const url = `${BASE_URL}/supervisor_management/get_farm_location/${encodeURIComponent(farmId)}`;
  return apiRequest(url, 'GET');
};

// Get Vehicle Data API (by task id)
export interface VehicleDataItem {
  driver_name?: string;
  driver_phone?: string;
  vehicle_number?: string;
  vehicle_id?: string;
}

export interface GetVehicleDataResponse {
  vehicle_data?: Record<string, VehicleDataItem>;
}

export const getVehicleData = async (taskId: string): Promise<GetVehicleDataResponse> => {
  const url = `${BASE_URL}/supervisor_management/get_vehicle_data/${encodeURIComponent(taskId)}`;
  return apiRequest(url, 'GET');
};

// Update Task Status API
export interface UpdateTaskStatusRequest {
  task_id: string;
  feild_id: string;
  completed_acres: number;
  status: string;
}

export const updateTaskStatus = async (payload: UpdateTaskStatusRequest): Promise<any> => {
  const url = `${BASE_URL}/admin_all_task/update_task_status`;
  return apiRequest(url, 'POST', payload);
};
