// Tasks Screen
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import TaskCard from '../../components/TaskCard';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFarmLocation, getMyTasks, MyTaskApiItem, updateTaskStatus } from '../../utils/api';
import { tasks as mockTasks } from '../../utils/emptyData';
import { Task } from '../../types';

const TasksScreen: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Pending' | 'In Progress' | 'Completed'>('All');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // cache farmId -> farming option to avoid repeated network calls
  const [farmOptionCache, setFarmOptionCache] = useState<Record<string, string>>({});

  const mapApiTaskToUiTask = (t: MyTaskApiItem): Task => {
    const allocations = t.task_allocation ?? [];
    const totalAllocated = allocations.reduce((sum, a) => sum + (a.allocated_acres ?? 0), 0);
    const totalCompleted = allocations.reduce((sum, a) => sum + (a.completed_acres ?? 0), 0);
    const progress = totalAllocated > 0 ? Math.round((totalCompleted / totalAllocated) * 100) : 0;

    const status: Task['status'] = progress >= 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Pending';

    const assigned = t.assigned_acres ?? [];
    const primaryActivity = assigned[0]?.activity;
    const totalAssigned = assigned.reduce((sum, a) => sum + (a.assigned_acres ?? 0), 0);

    const isFieldVisit = primaryActivity === 'Field Visits' || primaryActivity === 'Field Visit';
    const type: Task['type'] = isFieldVisit ? 'Cultivation' : 'Other';
    const title = primaryActivity ? `${primaryActivity}` : 'Task';

    // determine farming option from allocation items if backend provides it
    const farmOptionFromAlloc = (allocations as any[]).find((a: any) => a?.farming_option)?.farming_option as string | undefined;
    const farmOptionFromAssigned = (assigned as any[]).find((a: any) => a?.farming_option)?.farming_option as string | undefined;

    return {
      id: t.task_id,
      title,
      description:
        assigned.length > 0
          ? `Assigned acres: ${totalAssigned}`
          : `Allocated acres: ${totalAllocated}`,
      type,
      priority: 'Medium',
      status,
      farmingOption: farmOptionFromAlloc ?? farmOptionFromAssigned,
      // map farm ids from allocations and assigned acres
      farmIds: Array.from(new Set([
        ...(allocations?.map(a => a.farm_id).filter(Boolean) ?? []),
        ...(assigned?.map(a => a.farm_id).filter(Boolean) ?? []),
      ])),
      // handle both possible API keys: `field_id` and misspelled `feild_id`
      assignedField: (() => {
        const raw = (t as any).field_id ?? (t as any).feild_id ?? [];
        const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
        return arr.join(', ');
      })(),
      assignedTo: 'You',
      startDate: t.created_at ?? new Date().toISOString(),
      dueDate: assigned[0]?.date ?? t.created_at ?? new Date().toISOString(),
      progress,
      farmArea: `${assigned.length > 0 ? totalAssigned : totalAllocated} acres`,
      vehiclesAssigned: (t.vehicles ?? []).map((v: any) => v?.id ?? v?.registrationNumber ?? String(v)),
      selfVerified: false,
      fieldManagerVerified: false,
    };
  };

  const hydrateFarmingOptions = async (uiTasks: Task[]) => {
    const farmIds = Array.from(
      new Set(
        uiTasks
          .flatMap(t => (t.farmIds && t.farmIds.length > 0 ? [t.farmIds[0]] : []))
          .filter(Boolean)
      )
    ) as string[];

    const missing = farmIds.filter(fid => !farmOptionCache[fid]);
    if (missing.length === 0) {
      // apply cache to tasks
      setTasks(prev =>
        prev.map(t => {
          const fid = t.farmIds?.[0];
          return fid && farmOptionCache[fid] ? { ...t, farmingOption: farmOptionCache[fid] } : t;
        })
      );
      return;
    }

    const results = await Promise.all(
      missing.map(async (farmId) => {
        try {
          const res = await getFarmLocation(farmId);
          const opt = (res as any)?.farming_options;
          return typeof opt === 'string' && opt.trim().length > 0 ? { farmId, opt: opt.trim() } : null;
        } catch {
          return null;
        }
      })
    );

    const updates: Record<string, string> = {};
    for (const r of results) {
      if (r?.farmId && r?.opt) updates[r.farmId] = r.opt;
    }
    if (Object.keys(updates).length > 0) {
      setFarmOptionCache(prev => ({ ...prev, ...updates }));
      setTasks(prev =>
        prev.map(t => {
          const fid = t.farmIds?.[0];
          return fid && updates[fid] ? { ...t, farmingOption: updates[fid] } : t;
        })
      );
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const supervisorId = await AsyncStorage.getItem('supervisor_id');
      if (!supervisorId) {
        setTasks([]);
        return;
      }
      const res = await getMyTasks(supervisorId);
      const uiTasks = (res.tasks ?? []).map(mapApiTaskToUiTask);
      setTasks(uiTasks);
      // fetch and populate farming options immediately on load
      hydrateFarmingOptions(uiTasks);
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load tasks',
        text2: e?.message ? String(e.message) : 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTasks();
    } finally {
      setRefreshing(false);
    }
  };

  const filteredTasks = useMemo(() => {
    // This screen should show non-Field-Visit tasks only.
    // Field Visit activities will be shown in the Field Visit section/tab.
    return tasks
      .filter(t => t.title !== 'Field Visit' && t.title !== 'Field Visits')
      .filter(task => selectedFilter === 'All' || task.status === selectedFilter);
  }, [tasks, selectedFilter]);

  const handleTaskUpdate = async (taskId: string, newStatus: string, completedAcres?: number) => {
    if (newStatus !== 'Completed') {
      // keep local-only updates for non-complete statuses (currently not used)
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? {
                ...task,
                status: newStatus as Task['status'],
              }
            : task
        )
      );
      return;
    }

    const task = tasks.find(t => t.id === taskId);
    const acres = typeof completedAcres === 'number' ? completedAcres : 0;
    // Prefer farmIds (coming from API farm_id) since backend expects feild_id but payload key is misspelled.
    // Fallbacks are kept for backward compatibility.
    const feildId =
      (task?.farmIds && task.farmIds.length > 0 ? String(task.farmIds[0]).trim() : '') ||
      (task?.assignedField ?? '').split(',')[0]?.trim() ||
      '';

    if (!feildId) {
      Toast.show({
        type: 'error',
        text1: 'Feild_id is missing',
        text2: `taskId=${taskId} assignedField=${task?.assignedField ?? 'N/A'} farmIds=${task?.farmIds?.join('|') ?? 'N/A'}`,
      });
      return;
    }

    try {
      setUpdatingTaskId(taskId);
      await updateTaskStatus({
        task_id: taskId,
        feild_id: feildId,
        completed_acres: acres,
        status: 'sup_task_completed',
      });

      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId
            ? {
                ...t,
                status: 'Completed',
                progress: 100,
                completedAcres: acres,
                description: `Completed: ${acres} acres`,
              }
            : t
        )
      );

      Toast.show({
        type: 'success',
        text1: 'Task Completed',
        text2: 'Status updated successfully',
      });
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to complete task',
        text2: e?.message ? String(e.message) : 'Please try again',
      });
    } finally {
      setUpdatingTaskId(null);
    }
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
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.filtersContainer}>
              <FlatList
                horizontal
                data={(['All', 'Pending', 'In Progress', 'Completed'] as const)}
                keyExtractor={(item) => String(item)}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContent}
                renderItem={({ item }) => renderFilterChip(item as any)}
              />
            </View>
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onUpdate={handleTaskUpdate}
              isUpdating={updatingTaskId === item.id}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="clipboard-off" size={64} color={colors.textDisabled} />
              <Text style={styles.emptyText}>No tasks found</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 20 }} />}
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
  filtersContainer: {
    backgroundColor: colors.surface,
    ...shadows.small,
    // Let the filter bar size to its content so it doesn't leave a big empty area
    // when the tasks list is empty.
    paddingVertical: spacing.xs,
  },
  filtersContent: {
    paddingHorizontal: spacing.md,
    // keep vertical padding small so chips don't stretch
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    // smaller vertical padding + minHeight to avoid stretching
    paddingVertical: spacing.xs,
    minHeight: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    // keep same minHeight so active chip doesn't grow
    minHeight: 36,
    // reduce horizontal padding when active so the pill doesn't overflow
    paddingHorizontal: spacing.sm,
  },
  filterChipText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  filterChipTextActive: {
    color: colors.surface,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.textDisabled,
    marginTop: spacing.md,
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

export default TasksScreen;
