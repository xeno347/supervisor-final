// Labours Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Modal,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LabourCard from '../../components/LabourCard';
import { Labour } from '../../types';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';
import { labour as mockLabour } from '../../utils/emptyData';
import { makePhoneCall } from '../../utils/helpers';

const LaboursScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Active' | 'Inactive' | 'On Leave'>('All');
  const [selectedLabour, setSelectedLabour] = useState<Labour | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filteredLabours = mockLabour.filter(labour => {
    const matchesSearch = labour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         labour.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'All' || labour.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleLabourPress = (labour: Labour) => {
    setSelectedLabour(labour);
    setModalVisible(true);
  };

  const renderFilterChip = (filter: typeof selectedFilter) => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterChip,
        selectedFilter === filter && styles.filterChipActive,
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text
        style={[
          styles.filterChipText,
          selectedFilter === filter && styles.filterChipTextActive,
        ]}
      >
        {filter}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Labour Management</Text>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search labours..."
          placeholderTextColor={colors.textDisabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filtersContainer}>
        {(['All', 'Active', 'Inactive', 'On Leave'] as const).map(renderFilterChip)}
      </View>

      <FlatList
        data={filteredLabours}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LabourCard labour={item} onPress={() => handleLabourPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="account-off" size={64} color={colors.textDisabled} />
            <Text style={styles.emptyText}>No labours found</Text>
          </View>
        }
      />

      {/* Labour Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Labour Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedLabour && (
              <View style={styles.modalBody}>
                <View style={styles.modalAvatar}>
                  <Icon name="account" size={48} color={colors.primary} />
                </View>

                <Text style={styles.modalName}>{selectedLabour.name}</Text>
                <Text style={styles.modalRole}>{selectedLabour.role}</Text>

                <View style={styles.modalInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>ID:</Text>
                    <Text style={styles.infoValue}>{selectedLabour.id}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status:</Text>
                    <Text style={styles.infoValue}>{selectedLabour.status}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Assigned Field:</Text>
                    <Text style={styles.infoValue}>{selectedLabour.assignedField}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Join Date:</Text>
                    <Text style={styles.infoValue}>{selectedLabour.joinDate}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => {
                    makePhoneCall(selectedLabour.phone);
                    setModalVisible(false);
                  }}
                >
                  <Icon name="phone" size={20} color={colors.surface} />
                  <Text style={styles.callButtonText}>Call {selectedLabour.phone}</Text>
                </TouchableOpacity>
              </View>
            )}
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
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    ...shadows.small,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    marginLeft: spacing.sm,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
    ...shadows.small,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textDisabled,
    marginTop: spacing.md,
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
    paddingBottom: spacing.xl,
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
    alignItems: 'center',
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modalRole: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  modalInfo: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.medium,
    ...shadows.medium,
  },
  callButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});

export default LaboursScreen;
