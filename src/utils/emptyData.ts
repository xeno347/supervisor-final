// Empty data placeholders (production mode)
// These keep screens compiling until real APIs are wired up.
import { Field, Labour, Vehicle, Task, FieldVisit, Request, ReportingOfficer } from '../types';

export const fields: Field[] = [];
export const labour: Labour[] = [];
export const vehicles: Vehicle[] = [];
export const tasks: Task[] = [];
export const fieldVisits: FieldVisit[] = [];
export const requests: Request[] = [];
export const reportingOfficer: ReportingOfficer | null = null;

export const getActiveLabourCount = () => 0;
export const getActiveVehiclesCount = () => 0;
export const getTotalArea = () => '0 acres';
export const getPendingVisitsCount = () => 0;
export const getCompletedVisitsToday = () => 0;
