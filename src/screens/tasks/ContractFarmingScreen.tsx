// Contract Farming Screen
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { tasks as mockTasks, fieldVisits as mockFieldVisits } from '../../utils/emptyData';
import TaskCard from '../../components/TaskCard';
import { colors, typography, spacing } from '../../utils/theme';
import { Task, FieldVisit } from '../../types';

const ContractFarmingScreen: React.FC = () => {
  // Contract tasks
  const contractTasks = mockTasks.filter(t => t.type === 'Contract');

  // Contract field visits (show those related to contract tasks' fields)
  const relatedFieldIds = contractTasks.map(t => t.assignedField);
  const contractFieldVisits = mockFieldVisits.filter(v => relatedFieldIds.includes(v.fieldId));

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Contract Tasks</Text>
      <FlatList
        data={contractTasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <TaskCard task={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No contract tasks found.</Text>}
      />

      <Text style={styles.heading}>Related Field Visits</Text>
      <FlatList
        data={contractFieldVisits}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.visitCard}>
            <Text style={styles.visitTitle}>{item.fieldName}</Text>
            <Text style={styles.visitText}>{item.date} • {item.time}</Text>
            <Text style={styles.visitText}>Status: {item.status}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>No related field visits.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  heading: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  listContent: { paddingBottom: 120 },
  visitCard: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: 8, marginBottom: spacing.md },
  visitTitle: { ...typography.h4, color: colors.textPrimary },
  visitText: { ...typography.caption, color: colors.textSecondary },
  empty: { ...typography.body, color: colors.textDisabled },
});

export default ContractFarmingScreen;
