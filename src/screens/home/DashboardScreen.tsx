// Dashboard/Home Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker } from 'react-native-maps';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import FieldCard from '../../components/FieldCard';
import AttendanceButton from '../../components/AttendanceButton';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';
import {
  fields as mockFields,
  reportingOfficer,
  getActiveLabourCount,
  getActiveVehiclesCount,
  getTotalArea,
  getPendingVisitsCount,
  getCompletedVisitsToday,
} from '../../utils/emptyData';
import { makePhoneCall } from '../../utils/helpers';
import { Field } from '../../types';

const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, attendance, checkIn, checkOut, elapsedTime } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [mapModalVisible, setMapModalVisible] = useState(false);

  const userFields = mockFields.filter(field => 
    user?.assignedFields.includes(field.id)
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Toast.show({
        type: 'success',
        text1: 'Data Refreshed',
      });
    }, 1000);
  }, []);

  const handleCheckInOut = async () => {
    try {
      if (attendance && !attendance.checkOutTime) {
        Alert.alert(
          'Check Out',
          'Are you sure you want to check out?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Check Out',
              onPress: async () => {
                await checkOut();
                Toast.show({
                  type: 'success',
                  text1: 'Checked Out',
                  text2: 'Have a great day!',
                });
              },
            },
          ]
        );
      } else {
        await checkIn();
        Toast.show({
          type: 'success',
          text1: 'Checked In',
          text2: 'Your shift has started',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update attendance',
      });
    }
  };

  const handleFieldPress = (field: Field) => {
    setSelectedField(field);
    setMapModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="bell" size={24} color={colors.textPrimary} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.avatar}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            <Icon name="account-circle" size={36} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Attendance Card */}
        <AttendanceButton
          isCheckedIn={!!(attendance && !attendance.checkOutTime)}
          checkInTime={attendance?.checkInTime}
          elapsedTime={elapsedTime}
          onPress={handleCheckInOut}
          userName={user?.name || ''}
        />

        {/* Assigned Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned Fields</Text>
          {userFields.length > 0 ? (
            userFields.map((field) => (
              <FieldCard
                key={field.id}
                field={field}
                onPress={() => handleFieldPress(field)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="map-marker-off" size={48} color={colors.textDisabled} />
              <Text style={styles.emptyText}>No fields assigned</Text>
            </View>
          )}
        </View>

        {/* Workers Under Supervision */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workers Under Your Supervision</Text>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('HomeTab', { screen: 'Labours' })}
          >
            <Text style={styles.viewAllText}>View All Workers</Text>
            <Icon name="chevron-right" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Reporting Officer */}
        {(() => {
          const officer = reportingOfficer;
          if (!officer) return null;
          return (
            <View style={styles.reportingCard}>
              <Text style={styles.reportingTitle}>Reporting Officer</Text>
              <Text style={styles.reportingName}>{officer.name}</Text>
              <Text style={styles.reportingDesignation}>{officer.designation}</Text>
              <TouchableOpacity
                style={styles.phoneButton}
                onPress={() => makePhoneCall(officer.phone)}
              >
                <Icon name="phone" size={18} color={colors.primary} />
                <Text style={styles.phoneText}>{officer.phone}</Text>
              </TouchableOpacity>
            </View>
          );
        })()}
      </ScrollView>

      {/* Field Map Modal */}
      <Modal
        visible={mapModalVisible}
        animationType="slide"
        onRequestClose={() => setMapModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setMapModalVisible(false)}>
              <Icon name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedField?.name}</Text>
            <View style={{ width: 28 }} />
          </View>
          {selectedField && (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: selectedField.location.latitude,
                longitude: selectedField.location.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              <Marker
                coordinate={selectedField.location}
                title={selectedField.name}
                description={`${selectedField.crop} - ${selectedField.area}`}
              />
            </MapView>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.small,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: spacing.md,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    ...typography.small,
    color: colors.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.large,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.medium,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryTitle: {
    ...typography.h4,
    color: colors.surface,
    marginLeft: spacing.sm,
  },
  summaryGrid: {
    flexDirection: 'row',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    ...typography.h2,
    color: colors.surface,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.surface,
    opacity: 0.9,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.surface + '30',
    marginHorizontal: spacing.lg,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
  },
  emptyText: {
    ...typography.body,
    color: colors.textDisabled,
    marginTop: spacing.sm,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  viewAllText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  reportingCard: {
    backgroundColor: colors.badgeGreen,
    borderRadius: borderRadius.medium,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  reportingTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  reportingName: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  reportingDesignation: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    ...typography.body,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  map: {
    flex: 1,
  },
});

export default DashboardScreen;
