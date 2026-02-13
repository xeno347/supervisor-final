// Vehicles Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';
import VehicleCard from '../../components/VehicleCard';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';
import { vehicles as mockVehicles, fields as mockFields, labour as mockLabour } from '../../utils/emptyData';

const VehiclesScreen: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Available' | 'In Use' | 'Maintenance'>('All');
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedField, setSelectedField] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [purpose, setPurpose] = useState('');

  const filteredVehicles = mockVehicles.filter(vehicle => 
    selectedFilter === 'All' || vehicle.status === selectedFilter
  );

  const handleSchedule = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
    setScheduleModalVisible(true);
  };

  const handleSubmitSchedule = () => {
    if (!selectedVehicle || !selectedField || !selectedDriver || !purpose) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill all required fields',
      });
      return;
    }

    Toast.show({
      type: 'success',
      text1: 'Vehicle Scheduled',
      text2: 'The vehicle has been scheduled successfully',
    });
    
    setScheduleModalVisible(false);
    setSelectedVehicle('');
    setSelectedField('');
    setSelectedDriver('');
    setPurpose('');
  };

  const renderFilterChip = (filter: typeof selectedFilter) => (
    <TouchableOpacity
      key={filter}
      style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[styles.filterChipText, selectedFilter === filter && styles.filterChipTextActive]}>
        {filter}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filtersContainer}>
        {(['All', 'Available', 'In Use', 'Maintenance'] as const).map(renderFilterChip)}
      </View>

      <FlatList
        data={filteredVehicles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <VehicleCard vehicle={item} onSchedule={() => handleSchedule(item.id)} />
        )}
        contentContainerStyle={styles.listContent}
      />

      {/* Schedule Modal */}
      <Modal
        visible={scheduleModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setScheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule Vehicle</Text>
              <TouchableOpacity onPress={() => setScheduleModalVisible(false)}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Vehicle</Text>
              <View style={styles.input}>
                <Text style={styles.inputText}>
                  {mockVehicles.find(v => v.id === selectedVehicle)?.type || 'Select Vehicle'}
                </Text>
              </View>

              <Text style={styles.label}>Date & Time</Text>
              <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.inputText}>{selectedDate.toLocaleDateString()}</Text>
                <Icon name="calendar" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) setSelectedDate(date);
                  }}
                />
              )}

              <Text style={styles.label}>Select Field</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Field Location</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {mockFields.map(field => (
                    <TouchableOpacity
                      key={field.id}
                      style={[styles.chip, selectedField === field.id && styles.chipActive]}
                      onPress={() => setSelectedField(field.id)}
                    >
                      <Text style={[styles.chipText, selectedField === field.id && styles.chipTextActive]}>
                        {field.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.label}>Assign Driver</Text>
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Select Driver</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {mockLabour.filter(l => l.role.includes('Driver') || l.role.includes('Operator')).map(labour => (
                    <TouchableOpacity
                      key={labour.id}
                      style={[styles.chip, selectedDriver === labour.id && styles.chipActive]}
                      onPress={() => setSelectedDriver(labour.id)}
                    >
                      <Text style={[styles.chipText, selectedDriver === labour.id && styles.chipTextActive]}>
                        {labour.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.label}>Purpose / Task Description</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe the purpose..."
                placeholderTextColor={colors.textDisabled}
                value={purpose}
                onChangeText={setPurpose}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setScheduleModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitButton} onPress={handleSubmitSchedule}>
                  <Text style={styles.submitButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
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
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.surface,
  },
  listContent: {
    padding: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  modalBody: {
    padding: spacing.lg,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  pickerContainer: {
    marginBottom: spacing.md,
  },
  pickerLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.surface,
  },
  textArea: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 100,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
  },
});

export default VehiclesScreen;
