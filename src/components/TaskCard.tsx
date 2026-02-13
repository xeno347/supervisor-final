// TaskCard Component
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Linking, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Task } from '../types';
import { colors, typography, spacing, borderRadius, shadows } from '../utils/theme';
import { getPriorityColor, getStatusColor, getStatusBackgroundColor, formatDate } from '../utils/helpers';
import { getFarmLocation, getVehicleData, VehicleDataItem } from '../utils/api';
import Toast from 'react-native-toast-message';

interface TaskCardProps {
  task: Task;
  // onUpdate accepts optional completedAcres when completing a task
  onUpdate?: (taskId: string, status: string, completedAcres?: number) => void;
  isUpdating?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate, isUpdating }) => {
  const [expanded, setExpanded] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showVehiclesModal, setShowVehiclesModal] = useState(false);
  const [completedAcresInput, setCompletedAcresInput] = useState('');
  const [farmingOption, setFarmingOption] = useState<string | undefined>(undefined);

  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [vehicleItems, setVehicleItems] = useState<VehicleDataItem[]>([]);

  const fetchVehiclesForTask = async () => {
    try {
      setVehicleLoading(true);
      setVehicleError(null);
      const res = await getVehicleData(task.id);
      const dict = (res as any)?.vehicle_data;
      if (!dict || typeof dict !== 'object') {
        setVehicleItems([]);
        return;
      }
      const items = Object.values(dict).filter(Boolean) as VehicleDataItem[];
      setVehicleItems(items);
    } catch (e: any) {
      setVehicleError(e?.message ? String(e.message) : 'Failed to load vehicles');
      setVehicleItems([]);
    } finally {
      setVehicleLoading(false);
    }
  };

  const getTypeIcon = (typeOrOption: string) => {
    switch (typeOrOption) {
      case 'Cultivation':
        return 'sprout';
      case 'Driver':
        return 'truck';
      case 'Contract':
        return 'file-document';
      default:
        return 'clipboard-list';
    }
  };

  const displayType = farmingOption ?? task.farmingOption;

  const statusAccent = useMemo(() => {
    switch (task.status) {
      case 'Completed':
        return { tint: colors.success + '10', border: colors.success, icon: 'check-circle' as const };
      case 'In Progress':
        return { tint: colors.warning + '12', border: colors.warning, icon: 'progress-clock' as const };
      case 'Pending':
      default:
        return { tint: colors.info + '10', border: colors.info, icon: 'clock-outline' as const };
    }
  }, [task.status]);

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        {
          borderLeftColor: statusAccent.border,
          borderLeftWidth: 5,
          backgroundColor: statusAccent.tint,
        },
      ]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Icon name={getTypeIcon(displayType ?? task.type)} size={20} color={colors.primary} />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{task.title}</Text>
            <Text style={styles.id}>{task.id}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.statusIconWrap}>
            <Icon name={statusAccent.icon} size={20} color={statusAccent.border} />
          </View>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={(e) => {
              // prevent card expand toggle
              // @ts-ignore
              e?.stopPropagation?.();
              setShowVehiclesModal(true);
              fetchVehiclesForTask();
            }}
            activeOpacity={0.8}
          >
            <Icon name="truck" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Icon 
            name={expanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color={colors.textSecondary} 
          />
        </View>
      </View>

      {/* Vehicles modal */}
      <Modal visible={showVehiclesModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.vehiclesModalHeader}>
              <Text style={styles.modalTitle}>Assigned Vehicles</Text>
              <TouchableOpacity onPress={() => setShowVehiclesModal(false)}>
                <Icon name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {vehicleLoading ? (
              <View style={{ paddingVertical: spacing.md }}>
                <Text style={styles.vehicleSub}>Loading vehicles...</Text>
              </View>
            ) : vehicleError ? (
              <View style={{ paddingVertical: spacing.md }}>
                <Text style={styles.vehicleSub}>{vehicleError}</Text>
                <TouchableOpacity
                  style={[styles.modalConfirmButton, { marginTop: spacing.sm }]}
                  onPress={fetchVehiclesForTask}
                >
                  <Text style={[styles.modalButtonText, { color: colors.surface, textAlign: 'center' }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : vehicleItems.length === 0 ? (
              <View style={{ paddingVertical: spacing.md }}>
                <Text style={styles.vehicleSub}>No vehicles assigned</Text>
              </View>
            ) : (
              vehicleItems.map((v, idx) => (
                <View key={`${v.vehicle_id ?? v.vehicle_number ?? idx}`} style={styles.vehicleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vehicleTitle}>{v.vehicle_number ?? 'Vehicle'}</Text>
                    {!!v.driver_name && <Text style={styles.vehicleSub}>Driver: {v.driver_name}</Text>}
                    {!!v.driver_phone && <Text style={styles.vehicleSub}>Contact: {v.driver_phone}</Text>}
                  </View>
                  <Icon name="steering" size={18} color={colors.textSecondary} />
                </View>
              ))
            )}

            <TouchableOpacity style={styles.modalConfirmButton} onPress={() => setShowVehiclesModal(false)}>
              <Text style={[styles.modalButtonText, { color: colors.surface, textAlign: 'center' }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.badges}>
        {!!displayType && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{displayType}</Text>
          </View>
        )}
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
          <Icon name="flag" size={12} color={getPriorityColor(task.priority)} />
          <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
            {task.priority}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBackgroundColor(task.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
            {task.status}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Icon name="calendar" size={14} color={colors.textSecondary} />
        <Text style={styles.infoText}>Due: {formatDate(task.dueDate)}</Text>
      </View>

      <View style={styles.infoRow}>
        <Icon name="map-marker" size={14} color={colors.textSecondary} />
        <Text style={styles.infoText}>Field: {task.assignedField}</Text>
        {/* Location icon — fetch farm location and open maps on press */}
        <TouchableOpacity
          style={styles.locationIconWrapper}
          onPress={async () => {
            try {
              const farmId = (task.farmIds && task.farmIds.length > 0) ? task.farmIds[0] : undefined;
              if (!farmId) {
                Toast.show({ type: 'info', text1: 'No farm id available' });
                return;
              }
              const res = await getFarmLocation(farmId);
              const loc = res?.location;
              // set farming option when available
              if (typeof (res as any)?.farming_options === 'string') {
                setFarmingOption((res as any).farming_options);
              }
              if (!Array.isArray(loc) || loc.length < 2) {
                Toast.show({ type: 'error', text1: 'Location not available' });
                return;
              }
              const [lat, lng] = loc;
              const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat + ',' + lng)}`;
              const opened = await Linking.canOpenURL(url);
              if (opened) {
                await Linking.openURL(url);
              } else {
                Toast.show({ type: 'error', text1: 'Cannot open maps' });
              }
            } catch (err) {
              Toast.show({ type: 'error', text1: 'Failed to open location' });
            }
          }}
        >
          <Icon name="map-marker" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {expanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.description}>{task.description}</Text>
          
          {/* Farm Details */}
          {(task.farmLocation || task.farmArea) && (
            <View style={styles.farmDetailsSection}>
              <Text style={styles.sectionTitle}>Farm Details</Text>
              {task.farmLocation && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location:</Text>
                  <Text style={styles.detailValue}>{task.farmLocation}</Text>
                </View>
              )}
              {task.farmArea && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Area:</Text>
                  <Text style={styles.detailValue}>{task.farmArea}</Text>
                </View>
              )}
              {task.vehiclesAssigned && task.vehiclesAssigned.length > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Vehicles:</Text>
                  <Text style={styles.detailValue}>{task.vehiclesAssigned.join(', ')}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned to:</Text>
            <Text style={styles.detailValue}>{task.assignedTo}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start Date:</Text>
            <Text style={styles.detailValue}>{formatDate(task.startDate)}</Text>
          </View>

          {/* Completion flow: ask user for completed acres, then call onUpdate */}
          {task.status !== 'Completed' && onUpdate && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton, isUpdating ? { opacity: 0.7 } : null]}
                onPress={() => {
                  if (isUpdating) return;
                  setShowCompleteModal(true);
                }}
                disabled={!!isUpdating}
              >
                {isUpdating ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={colors.surface} />
                    <Text style={[styles.actionText, styles.completeText, { marginLeft: spacing.xs }]}>Updating...</Text>
                  </View>
                ) : (
                  <Text style={[styles.actionText, styles.completeText]}>Complete</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Complete modal */}
          <Modal visible={showCompleteModal} transparent animationType="fade">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>Complete Task</Text>
                <Text style={styles.modalLabel}>Enter completed acres</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={completedAcresInput}
                  onChangeText={setCompletedAcresInput}
                  placeholder="e.g. 12"
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={styles.modalButton} onPress={() => { setShowCompleteModal(false); setCompletedAcresInput(''); }}>
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalConfirmButton]}
                    onPress={() => {
                      const acres = Number(completedAcresInput) || 0;
                      setShowCompleteModal(false);
                      setCompletedAcresInput('');
                      onUpdate?.(task.id, 'Completed', acres);
                    }}
                  >
                    <Text style={[styles.modalButtonText, { color: colors.surface }]}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  titleContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  title: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  id: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconWrap: {
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    marginRight: 2,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  badge: {
    backgroundColor: colors.badgeBlue,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  badgeText: {
    ...typography.small,
    color: colors.info,
    fontWeight: '500',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  priorityText: {
    ...typography.small,
    fontWeight: '600',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
    marginBottom: spacing.xs,
  },
  statusText: {
    ...typography.small,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  locationIconWrapper: {
    marginLeft: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: spacing.sm,
  },
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  farmDetailsSection: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.badgeGray,
    borderRadius: borderRadius.small,
  },
  verificationSection: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.badgeGreen + '20',
    borderRadius: borderRadius.small,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  verificationText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  progressContainer: {
    marginVertical: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  progressValue: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.divider,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.small,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  actionText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: colors.primary,
    marginRight: 0,
  },
  completeText: {
    color: colors.surface,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: spacing.md,
  },
  modalBox: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.md,
  },
  modalTitle: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  modalLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: borderRadius.small,
    padding: spacing.sm,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.small,
    marginLeft: spacing.sm,
    backgroundColor: colors.badgeGray,
  },
  modalConfirmButton: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  vehiclesModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  vehicleTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  vehicleSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default TaskCard;
