// Authentication Context
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Attendance } from '../types';
import { supervisorLogin, LoginResponse } from '../utils/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (supervisorId: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  attendance: Attendance | null;
  checkIn: () => Promise<void>;
  checkOut: () => Promise<void>;
  elapsedTime: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    loadUser();
    loadAttendance();
  }, []);

  // Update elapsed time every second when checked in
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (attendance && !attendance.checkOutTime) {
      interval = setInterval(() => {
        const start = new Date(attendance.checkInTime).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - start) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [attendance]);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const attendanceData = await AsyncStorage.getItem(`attendance_${today}`);
      if (attendanceData) {
        setAttendance(JSON.parse(attendanceData));
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const login = async (supervisorId: string, password: string): Promise<boolean> => {
    try {
      // Call actual API
      const response: LoginResponse = await supervisorLogin(supervisorId, password);
      
      if (response.success && response.supervisor_id && response.name) {
        // Create user object with API data
        const userData: User = {
          id: response.supervisor_id,
          supervisorId: response.supervisor_id,
          name: response.name,
          role: 'Agricultural Supervisor',
          phone: '', // These will be updated from profile API later
          email: '',
          assignedFields: [],
        };
        
        // Cache user data and credentials
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('supervisor_id', response.supervisor_id);
        await AsyncStorage.setItem('supervisor_name', response.name);
        
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Check out if still checked in
      if (attendance && !attendance.checkOutTime) {
        await checkOut();
      }
      
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('supervisor_id');
      await AsyncStorage.removeItem('supervisor_name');
      setUser(null);
      setIsAuthenticated(false);
      setAttendance(null);
      setElapsedTime(0);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const checkIn = async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const newAttendance: Attendance = {
        id: `ATT_${Date.now()}`,
        supervisorId: user?.supervisorId || '',
        date: today,
        checkInTime: now.toISOString(),
      };

      await AsyncStorage.setItem(`attendance_${today}`, JSON.stringify(newAttendance));
      setAttendance(newAttendance);
    } catch (error) {
      console.error('Error checking in:', error);
      throw error;
    }
  };

  const checkOut = async () => {
    try {
      if (!attendance) return;

      const now = new Date();
      const checkInTime = new Date(attendance.checkInTime);
      const totalHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

      const updatedAttendance: Attendance = {
        ...attendance,
        checkOutTime: now.toISOString(),
        totalHours: parseFloat(totalHours.toFixed(2)),
      };

      const today = now.toISOString().split('T')[0];
      await AsyncStorage.setItem(`attendance_${today}`, JSON.stringify(updatedAttendance));
      setAttendance(updatedAttendance);
      setElapsedTime(0);
    } catch (error) {
      console.error('Error checking out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        attendance,
        checkIn,
        checkOut,
        elapsedTime,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
