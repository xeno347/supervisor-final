// Type definitions for the Agricultural Supervisor App

export interface User {
  id: string;
  supervisorId: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  assignedFields: string[];
  photo?: string;
}

export interface Field {
  id: string;
  name: string;
  area: string;
  crop: string;
  status: 'Active' | 'Preparing' | 'Harvesting';
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface Labour {
  id: string;
  name: string;
  role: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  assignedField: string;
  photo?: string;
  joinDate: string;
}

export interface Vehicle {
  id: string;
  type: string;
  registrationNumber: string;
  driver: string;
  status: 'Available' | 'In Use' | 'Maintenance';
  location: string;
  fuelLevel: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'Cultivation' | 'Driver' | 'Contract' | 'Other';
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
  assignedField: string;
  assignedTo: string;
  startDate: string;
  dueDate: string;
  progress: number;
  // Farm details
  farmLocation?: string;
  farmArea?: string;
  vehiclesAssigned?: string[];
  // Status verification levels
  selfVerified?: boolean;
  fieldManagerVerified?: boolean;
  farmerVerified?: boolean; // For contract farming only
  // Number of acres completed for this task (optional)
  completedAcres?: number;
  // IDs of farms related to this task (from API farm_id values)
  farmIds?: string[];
  // Farming option for the task's farm (e.g. 'Lease Farming', 'Contract Farming')
  farmingOption?: string;
}

export interface FieldVisit {
  id: string;
  fieldId: string;
  fieldName: string;
  date: string;
  time: string;
  status: 'Pending' | 'Completed';
  cropCondition?: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  observations?: string;
  recommendations?: string;
  issues?: string[];
  photos?: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  // Data collection fields
  avgLengthLeaves?: number;
  avgWidthLeaves?: number;
  saplings?: number;
  tillers?: number;
  avgHeightPlant?: number;
  moisture?: number;
  temperature?: number;
  npkValue?: string;
  note?: string;
}

export interface Request {
  id: string;
  title: string;
  category: 'Equipment' | 'Maintenance' | 'Resource' | 'Personnel';
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Approved' | 'Rejected';
  description: string;
  relatedField?: string;
  photos?: string[];
  submittedDate: string;
  response?: string;
}

export interface Attendance {
  id: string;
  supervisorId: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  totalHours?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface ReportingOfficer {
  id: string;
  name: string;
  designation: string;
  phone: string;
  email: string;
}
