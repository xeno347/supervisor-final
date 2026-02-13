// My Requests Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RequestCard from '../../components/RequestCard';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';
import { requests as mockRequests } from '../../utils/emptyData';
import { Request } from '../../types';
import { formatDate, getPriorityColor } from '../../utils/helpers';

const MyRequestsScreen: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filteredRequests = mockRequests.filter(request =>
    selectedFilter === 'All' || request.status === selectedFilter
  );

  const handleRequestPress = (request: Request) => {
    setSelectedRequest(request);
    setModalVisible(true);
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(renderFilterChip)}
      </ScrollView>

      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RequestCard request={item} onPress={() => handleRequestPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
      />

      {/* Request Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.requestId}>{selectedRequest.id}</Text>
                <Text style={styles.requestTitle}>{selectedRequest.title}</Text>

                <View style={styles.badges}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{selectedRequest.category}</Text>
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedRequest.priority) + '20' }]}>
                    <Icon name="flag" size={12} color={getPriorityColor(selectedRequest.priority)} />
                    <Text style={[styles.priorityText, { color: getPriorityColor(selectedRequest.priority) }]}>
                      {selectedRequest.priority}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{selectedRequest.status}</Text>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Description</Text>
                  <Text style={styles.description}>{selectedRequest.description}</Text>
                </View>

                {selectedRequest.relatedField && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Related Field</Text>
                    <Text style={styles.sectionValue}>{selectedRequest.relatedField}</Text>
                  </View>
                )}

                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Submitted Date</Text>
                  <Text style={styles.sectionValue}>{formatDate(selectedRequest.submittedDate)}</Text>
                </View>

                {selectedRequest.response && (
                  <View style={[styles.section, styles.responseSection]}>
                    <Text style={styles.sectionLabel}>Response</Text>
                    <Text style={styles.responseText}>{selectedRequest.response}</Text>
                  </View>
                )}
              </ScrollView>
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
  filtersContainer: {
    backgroundColor: colors.surface,
    ...shadows.small,
  },
  filtersContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
    maxHeight: '80%',
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
  requestId: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  requestTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
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
    backgroundColor: colors.badgeGreen,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
    marginBottom: spacing.xs,
  },
  statusText: {
    ...typography.small,
    color: colors.success,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  sectionValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
  description: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  responseSection: {
    backgroundColor: colors.badgeGreen,
    padding: spacing.md,
    borderRadius: borderRadius.medium,
  },
  responseText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
  },
});

export default MyRequestsScreen;
