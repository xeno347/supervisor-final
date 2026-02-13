// Make Request Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';
import { fields as mockFields } from '../../utils/emptyData';
import { generateId, getPriorityColor } from '../../utils/helpers';

const MakeRequestScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Equipment' | 'Maintenance' | 'Resource' | 'Personnel'>('Equipment');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [relatedField, setRelatedField] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!title || !description) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all required fields',
      });
      return;
    }

    const requestId = generateId('REQ');
    
    Toast.show({
      type: 'success',
      text1: 'Request Submitted',
      text2: `Request ${requestId} has been submitted successfully`,
    });

    // Clear form
    setTitle('');
    setCategory('Equipment');
    setPriority('Medium');
    setRelatedField('');
    setDescription('');

    // Navigate to My Requests tab
    navigation.navigate('MyRequests');
  };

  const categories: Array<'Equipment' | 'Maintenance' | 'Resource' | 'Personnel'> = ['Equipment', 'Maintenance', 'Resource', 'Personnel'];
  const priorities: Array<'High' | 'Medium' | 'Low'> = ['High', 'Medium', 'Low'];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Request Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter request title"
          placeholderTextColor={colors.textDisabled}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Category *</Text>
        <View style={styles.chipsContainer}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Priority *</Text>
        <View style={styles.priorityContainer}>
          {priorities.map(pri => (
            <TouchableOpacity
              key={pri}
              style={[
                styles.priorityChip,
                priority === pri && { backgroundColor: getPriorityColor(pri) }
              ]}
              onPress={() => setPriority(pri)}
            >
              <Text style={[styles.priorityText, priority === pri && styles.priorityTextActive]}>
                {pri}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Related Field/Location</Text>
        <View style={styles.fieldContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {mockFields.map(field => (
              <TouchableOpacity
                key={field.id}
                style={[styles.chip, relatedField === field.id && styles.chipActive]}
                onPress={() => setRelatedField(field.id)}
              >
                <Text style={[styles.chipText, relatedField === field.id && styles.chipTextActive]}>
                  {field.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={styles.label}>Detailed Description *</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe your request in detail..."
          placeholderTextColor={colors.textDisabled}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.photoButton}>
          <Icon name="camera" size={24} color={colors.primary} />
          <Text style={styles.photoButtonText}>Attach Photos</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Request</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body,
    color: colors.textPrimary,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
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
    fontWeight: '600',
  },
  priorityContainer: {
    flexDirection: 'row',
  },
  priorityChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  priorityText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  priorityTextActive: {
    color: colors.surface,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body,
    color: colors.textPrimary,
    minHeight: 120,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginTop: spacing.md,
  },
  photoButtonText: {
    ...typography.body,
    color: colors.primary,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.large,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.medium,
  },
  submitButtonText: {
    ...typography.h4,
    color: colors.surface,
    fontWeight: 'bold',
  },
});

export default MakeRequestScreen;
