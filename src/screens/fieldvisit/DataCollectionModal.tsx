// Field Visit Data Collection Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';

interface DataCollectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  fieldName: string;
}

const DataCollectionModal: React.FC<DataCollectionModalProps> = ({
  visible,
  onClose,
  onSubmit,
  fieldName,
}) => {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [avgLengthLeaves, setAvgLengthLeaves] = useState('');
  const [avgWidthLeaves, setAvgWidthLeaves] = useState('');
  const [saplings, setSaplings] = useState('');
  const [tillers, setTillers] = useState('');
  const [avgHeightPlant, setAvgHeightPlant] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [moisture, setMoisture] = useState('');
  const [temperature, setTemperature] = useState('');
  const [npkValue, setNpkValue] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    // Validate required fields
    if (!avgLengthLeaves || !avgWidthLeaves || !saplings || !tillers || !avgHeightPlant || !moisture || !temperature) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    const data = {
      date: date.toISOString(),
      avgLengthLeaves: parseFloat(avgLengthLeaves),
      avgWidthLeaves: parseFloat(avgWidthLeaves),
      saplings: parseInt(saplings),
      tillers: parseInt(tillers),
      avgHeightPlant: parseFloat(avgHeightPlant),
      images,
      moisture: parseFloat(moisture),
      temperature: parseFloat(temperature),
      npkValue: npkValue || undefined,
      note: note || undefined,
    };

    onSubmit(data);
    resetForm();
  };

  const resetForm = () => {
    setDate(new Date());
    setAvgLengthLeaves('');
    setAvgWidthLeaves('');
    setSaplings('');
    setTillers('');
    setAvgHeightPlant('');
    setImages([]);
    setMoisture('');
    setTemperature('');
    setNpkValue('');
    setNote('');
  };

  const handleImagePick = () => {
    // Placeholder for image picker
    Alert.alert('Image Upload', 'Image picker functionality to be implemented');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Data Collection</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.fieldTitle}>{fieldName}</Text>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date *</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
              <Icon name="calendar" size={20} color={colors.textSecondary} />
              <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}
          </View>

          {/* Avg Length of Leaves */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Avg Length of Leaves (cm) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter length in cm"
              placeholderTextColor={colors.textDisabled}
              value={avgLengthLeaves}
              onChangeText={setAvgLengthLeaves}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Avg Width of Leaves */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Avg Width of Leaves (cm) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter width in cm"
              placeholderTextColor={colors.textDisabled}
              value={avgWidthLeaves}
              onChangeText={setAvgWidthLeaves}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Saplings */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Saplings Count *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter number of saplings"
              placeholderTextColor={colors.textDisabled}
              value={saplings}
              onChangeText={setSaplings}
              keyboardType="number-pad"
            />
          </View>

          {/* Tillers */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tillers Count *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter number of tillers"
              placeholderTextColor={colors.textDisabled}
              value={tillers}
              onChangeText={setTillers}
              keyboardType="number-pad"
            />
          </View>

          {/* Avg Height of Plant */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Avg Height of Plant (cm) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter height in cm"
              placeholderTextColor={colors.textDisabled}
              value={avgHeightPlant}
              onChangeText={setAvgHeightPlant}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Upload Images */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Upload Images of Plant *</Text>
            <Text style={styles.helpText}>Different sections of the field</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={handleImagePick}>
              <Icon name="camera-plus" size={24} color={colors.primary} />
              <Text style={styles.uploadText}>Add Photos ({images.length})</Text>
            </TouchableOpacity>
          </View>

          {/* Moisture */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Moisture (%) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter moisture percentage"
              placeholderTextColor={colors.textDisabled}
              value={moisture}
              onChangeText={setMoisture}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Temperature */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Temperature (°C) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter temperature"
              placeholderTextColor={colors.textDisabled}
              value={temperature}
              onChangeText={setTemperature}
              keyboardType="decimal-pad"
            />
          </View>

          {/* NPK Value (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>NPK Value (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter NPK value (e.g., 10-20-10)"
              placeholderTextColor={colors.textDisabled}
              value={npkValue}
              onChangeText={setNpkValue}
            />
          </View>

          {/* Note */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Note (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any additional notes..."
              placeholderTextColor={colors.textDisabled}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Data</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.small,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  fieldTitle: {
    ...typography.h4,
    color: colors.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  helpText: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  uploadText: {
    ...typography.body,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.medium,
    marginTop: spacing.md,
  },
  submitButtonText: {
    ...typography.h4,
    color: colors.surface,
    fontWeight: 'bold',
  },
});

export default DataCollectionModal;
