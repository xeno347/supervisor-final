// Field Visit List Screen
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';
import { formatDate, formatTime } from '../../utils/helpers';
import { FieldVisit } from '../../types';
import DataCollectionModal from './DataCollectionModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { getMyTasks, MyTaskApiItem } from '../../utils/api';

const FieldVisitListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [expandedSection, setExpandedSection] = useState<'pending' | 'completed'>('pending');
  const [dataCollectionVisible, setDataCollectionVisible] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<FieldVisit | null>(null);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [apiTasks, setApiTasks] = useState<MyTaskApiItem[]>([]);

  const loadFieldVisitTasks = async () => {
    setLoading(true);
    try {
      const supervisorId = await AsyncStorage.getItem('supervisor_id');
      if (!supervisorId) {
        setApiTasks([]);
        return;
      }
      const res = await getMyTasks(supervisorId);
      setApiTasks(res.tasks ?? []);
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load field visits',
        text2: e?.message ? String(e.message) : 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFieldVisitTasks();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadFieldVisitTasks();
    } finally {
      setRefreshing(false);
    }
  };

  const apiFieldVisits: FieldVisit[] = useMemo(() => {
    // Convert API tasks with activity == "Field Visits" / "Field Visit" into FieldVisit cards.
    const items: FieldVisit[] = [];

    for (const t of apiTasks) {
      const assigned = t.assigned_acres ?? [];
      const isFieldVisitTask = assigned.some(a => a.activity === 'Field Visits' || a.activity === 'Field Visit');
      if (!isFieldVisitTask) continue;

      // Create one FieldVisit item per assigned_acres entry (so each farm/date shows as a visit)
      for (const a of assigned.filter(x => x.activity === 'Field Visits' || x.activity === 'Field Visit')) {
        items.push({
          id: `${t.task_id}:${a.farm_id}:${a.date}`,
          fieldId: a.farm_id,
          fieldName: `Farm ${a.farm_id.slice(0, 6)}`,
          date: a.date,
          time: '09:00',
          status: 'Pending',
        });
      }

      // If backend ever sends a Field Visit task with empty assigned_acres, still show a placeholder
      if (assigned.length === 0) {
        items.push({
          id: t.task_id,
          fieldId: (t.task_allocation?.[0]?.farm_id ?? 'UNKNOWN'),
          fieldName: 'Field Visit',
          date: new Date().toISOString().split('T')[0],
          time: '09:00',
          status: 'Pending',
        });
      }
    }

    return items;
  }, [apiTasks]);

  const pendingVisits = apiFieldVisits.filter(v => v.status === 'Pending');
  const completedVisits = apiFieldVisits.filter(v => v.status === 'Completed');

  const handleStartVisit = (visit: FieldVisit) => {
    setSelectedVisit(visit);
    setDataCollectionVisible(true);
  };

  const handleDataSubmit = (data: any) => {
    console.log('Data collected:', data);
    Alert.alert('Success', 'Field visit data collected successfully');
    setDataCollectionVisible(false);
    setSelectedVisit(null);
  };

  const renderVisitCard = (visit: FieldVisit) => {
    const isPending = visit.status === 'Pending';

    return (
      <TouchableOpacity
        key={visit.id}
        style={styles.visitCard}
        onPress={() => {
          if (isPending) {
            handleStartVisit(visit);
          } else {
            navigation.navigate('VisitDetail', { visit });
          }
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <Icon name="map-marker" size={20} color={colors.primary} />
            <Text style={styles.fieldName}>{visit.fieldName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isPending ? colors.badgeOrange : colors.badgeGreen }]}>
            <Text style={[styles.statusText, { color: isPending ? colors.statusPending : colors.statusCompleted }]}>
              {visit.status}
            </Text>
          </View>
        </View>
        <View style={styles.cardInfo}>
          <Icon name="calendar" size={14} color={colors.textSecondary} />
          <Text style={styles.infoText}>{formatDate(visit.date)} at {formatTime(visit.time)}</Text>
        </View>
        {!isPending && visit.cropCondition && (
          <View style={styles.conditionRow}>
            <Icon name="sprout" size={14} color={colors.success} />
            <Text style={styles.conditionText}>Condition: {visit.cropCondition}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>{isPending ? 'Collect Data' : 'View Details'}</Text>
          <Icon name="chevron-right" size={20} color={colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Field Visits</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading field visits...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setExpandedSection(expandedSection === 'pending' ? 'completed' : 'pending')}
          >
            <Text style={styles.sectionTitle}>Pending Visits ({pendingVisits.length})</Text>
            <Icon
              name={expandedSection === 'pending' ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>

          {expandedSection === 'pending' && pendingVisits.map(renderVisitCard)}

          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setExpandedSection(expandedSection === 'completed' ? 'pending' : 'completed')}
          >
            <Text style={styles.sectionTitle}>Completed Visits ({completedVisits.length})</Text>
            <Icon
              name={expandedSection === 'completed' ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>

          {expandedSection === 'completed' && completedVisits.map(renderVisitCard)}
        </ScrollView>
      )}

      {/* Data Collection Modal */}
      {selectedVisit && (
        <DataCollectionModal
          visible={dataCollectionVisible}
          onClose={() => {
            setDataCollectionVisible(false);
            setSelectedVisit(null);
          }}
          onSubmit={handleDataSubmit}
          fieldName={selectedVisit.fieldName}
        />
      )}
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
  statsRow: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    ...shadows.small,
  },
  statValue: {
    ...typography.h2,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  visitCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fieldName: {
    ...typography.h4,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
  },
  statusText: {
    ...typography.small,
    fontWeight: '600',
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  conditionText: {
    ...typography.caption,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  actionText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});

export default FieldVisitListScreen;
