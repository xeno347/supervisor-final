// Helper utility functions
import { Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
};

export const formatTime = (timeString: string): string => {
  // If already formatted like "09:00 AM", return as is
  if (timeString.includes('AM') || timeString.includes('PM')) {
    return timeString;
  }
  
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const formatDateTime = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('en-US', options);
};

export const formatElapsedTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const calculateTimeDifference = (startTime: string, endTime?: string): number => {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  return Math.floor((end - start) / 1000); // Return seconds
};

export const makePhoneCall = (phoneNumber: string) => {
  const url = `tel:${phoneNumber}`;
  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to make phone call');
      }
    })
    .catch((err) => console.error('Error making phone call:', err));
};

export const sendEmail = (email: string) => {
  const url = `mailto:${email}`;
  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to send email');
      }
    })
    .catch((err) => console.error('Error sending email:', err));
};

export const generateId = (prefix: string): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}${timestamp}${random}`;
};

export const getPriorityColor = (priority: 'High' | 'Medium' | 'Low'): string => {
  switch (priority) {
    case 'High':
      return '#ef4444';
    case 'Medium':
      return '#f59e0b';
    case 'Low':
      return '#10b981';
    default:
      return '#6b7280';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Active':
    case 'Available':
    case 'Completed':
    case 'Approved':
      return '#10b981';
    case 'Pending':
    case 'In Progress':
    case 'In Use':
      return '#f59e0b';
    case 'Inactive':
    case 'Maintenance':
    case 'Rejected':
      return '#ef4444';
    case 'On Leave':
      return '#3b82f6';
    default:
      return '#6b7280';
  }
};

export const getStatusBackgroundColor = (status: string): string => {
  switch (status) {
    case 'Active':
    case 'Available':
    case 'Completed':
    case 'Approved':
      return '#d1fae5';
    case 'Pending':
    case 'In Progress':
    case 'In Use':
      return '#fed7aa';
    case 'Inactive':
    case 'Maintenance':
    case 'Rejected':
      return '#fee2e2';
    case 'On Leave':
      return '#dbeafe';
    default:
      return '#f3f4f6';
  }
};

export const getCropConditionColor = (condition: string): string => {
  switch (condition) {
    case 'Excellent':
      return '#10b981';
    case 'Good':
      return '#34d399';
    case 'Fair':
      return '#f59e0b';
    case 'Poor':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Get cached supervisor data
export const getSupervisorData = async (): Promise<{ supervisor_id: string | null; name: string | null }> => {
  try {
    const supervisor_id = await AsyncStorage.getItem('supervisor_id');
    const name = await AsyncStorage.getItem('supervisor_name');
    return { supervisor_id, name };
  } catch (error) {
    console.error('Error getting supervisor data:', error);
    return { supervisor_id: null, name: null };
  }
};

// Clear supervisor cache
export const clearSupervisorData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('supervisor_id');
    await AsyncStorage.removeItem('supervisor_name');
  } catch (error) {
    console.error('Error clearing supervisor data:', error);
  }
};
