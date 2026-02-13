// Harvest QR Scanner Screen
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
  type Code,
} from 'react-native-vision-camera';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';
import Toast from 'react-native-toast-message';
import { startHarvestTrip } from '../../utils/api';

type TripStatus = 'Idle' | 'Started' | 'Completed';

const HarvestScannerScreen: React.FC<any> = ({ route, navigation }) => {
  const order = route?.params?.order;
  const isActiveOrder = typeof order?.tipper_card_number === 'string' && order.tipper_card_number.trim().length > 0;
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [tripStatus, setTripStatus] = useState<TripStatus>('Idle');
  const [pendingScan, setPendingScan] = useState<any | null>(null);
  const [pendingCardNumber, setPendingCardNumber] = useState<string>('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [startingTrip, setStartingTrip] = useState(false);

  const orderId: string | undefined = order?.order_id ?? order?.orderNo;

  const extractCardNumber = (scanPayload: any, rawValue: string): string => {
    const n = scanPayload?.card_number ?? scanPayload?.cardNumber;
    if (typeof n === 'string' && n.trim().length > 0) return n.trim();
    // Fallback: if QR is plain text (not JSON), use raw value
    return rawValue;
  };

  const handleStartTrip = async () => {
    try {
      if (!orderId) {
        Alert.alert('Missing order', 'Order id not available.');
        return;
      }
      if (!pendingCardNumber) {
        Alert.alert('Missing card number', 'Card number not available from scan.');
        return;
      }

      setStartingTrip(true);
      await startHarvestTrip({ order_id: orderId, card_number: pendingCardNumber });

      setConfirmVisible(false);
      setPendingScan(null);
      setPendingCardNumber('');

      setTripStatus('Started');
      Toast.show({ type: 'success', text1: 'Trip Started' });
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to start trip',
        text2: e?.message ? String(e.message) : 'Please try again',
      });
    } finally {
      setStartingTrip(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (!hasPermission) {
        await requestPermission();
      }
    })();
  }, [hasPermission, requestPermission]);

  const handleScannedValue = useCallback((value: string) => {
    if (!isActiveOrder) {
      Alert.alert(
        'Order Inactive',
        'This harvest order has no tipper card number allocated yet. Scanning is disabled.'
      );
      return;
    }

    // First scan should open confirmation modal and allow starting trip.
    if (tripStatus === 'Idle') {
      let payload: any = null;
      try {
        payload = JSON.parse(value);
      } catch {
        payload = { raw: value };
      }

      const cardNo = extractCardNumber(payload, value);
      setPendingScan(payload);
      setPendingCardNumber(cardNo);
      setConfirmVisible(true);
      return;
    }

    // Second scan completes trip (existing behavior)
    if (tripStatus === 'Started') {
      setTripStatus('Completed');
      Alert.alert(
        'Trip Completed',
        `Shipment received by Weighment & QC.\n\nCode: ${value}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [isActiveOrder, navigation, tripStatus]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes: Code[]) => {
      const first = codes?.[0]?.value;
      if (first) handleScannedValue(first);
    },
  });

  const canShowCamera = useMemo(() => {
    return !!device && hasPermission;
  }, [device, hasPermission]);

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Icon name="camera-off" size={48} color={colors.textDisabled} />
        <Text style={styles.title}>Camera permission required</Text>
        <Text style={styles.subtitle}>Please allow camera access to scan QR codes.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Icon name="camera" size={48} color={colors.textDisabled} />
        <Text style={styles.title}>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBtn}>
          <Icon name="arrow-left" size={22} color={colors.surface} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Scan Harvest QR</Text>
        <View style={styles.topBtn} />
      </View>

      {order && (
        <View style={styles.orderBanner}>
          <Text style={styles.bannerTitle}>{order.order_id ?? order.orderNo ?? 'Harvest Order'}</Text>
          <Text style={styles.bannerSub}>
            {order?.farm_details?.block_name ?? order.fieldName ?? '—'}
            {' • '}
            {order?.farm_details?.farming_option ?? order.crop ?? '—'}
            {' • '}
            {typeof order?.farm_details?.area === 'number' ? `${order.farm_details.area} acres` : (order.quantity ?? '—')}
          </Text>
          <Text style={styles.bannerSub}>
            Tipper Card: {isActiveOrder ? order.tipper_card_number : 'Not Allocated'}
          </Text>
        </View>
      )}

      <View style={styles.cameraWrap}>
        {canShowCamera ? (
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={tripStatus !== 'Completed'}
            codeScanner={codeScanner}
          />
        ) : (
          <View style={styles.center}>
            <Text style={styles.subtitle}>Loading camera…</Text>
          </View>
        )}

        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>
            {tripStatus === 'Idle'
              ? 'Scan to start trip'
              : tripStatus === 'Started'
                ? 'Scan at Weighment/QC to complete trip'
                : 'Trip completed'}
          </Text>
        </View>
      </View>

      <View style={styles.bottomBar}>
        {tripStatus === 'Started' ? (
          <View style={styles.pillRow}>
            <View style={[styles.pill, { backgroundColor: colors.primary }]}>
              <Text style={styles.pillText}>Trip Started</Text>
            </View>
            <Text style={styles.bottomHint}>Waiting for Weighment & QC scan…</Text>
          </View>
        ) : tripStatus === 'Completed' ? (
          <View style={styles.pillRow}>
            <View style={[styles.pill, { backgroundColor: colors.success }]}>
              <Text style={styles.pillText}>Trip Completed</Text>
            </View>
          </View>
        ) : (
          <View style={styles.pillRow}>
            <View style={[styles.pill, { backgroundColor: colors.warning }]}>
              <Text style={styles.pillText}>Not Started</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, tripStatus === 'Idle' && { opacity: 0.6 }]}
          onPress={() => setTripStatus('Idle')}
          disabled={tripStatus === 'Idle'}
        >
          <Icon name="reload" size={18} color={colors.surface} />
          <Text style={[styles.buttonText, { marginLeft: 8 }]}>Reset</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!startingTrip) setConfirmVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Start Trip</Text>

            <Text style={styles.modalLabel}>Order ID</Text>
            <Text style={styles.modalValue}>{orderId ?? '—'}</Text>

            <Text style={styles.modalLabel}>Card Number</Text>
            <Text style={styles.modalValue}>{pendingCardNumber || '—'}</Text>

            {pendingScan?.name && (
              <>
                <Text style={styles.modalLabel}>Name</Text>
                <Text style={styles.modalValue}>{String(pendingScan.name)}</Text>
              </>
            )}

            {pendingScan?.valid_till && (
              <>
                <Text style={styles.modalLabel}>Valid Till</Text>
                <Text style={styles.modalValue}>{String(pendingScan.valid_till)}</Text>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                disabled={startingTrip}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.modalBtnTextSecondary}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, startingTrip && { opacity: 0.7 }]}
                disabled={startingTrip}
                onPress={handleStartTrip}
              >
                {startingTrip ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.modalBtnTextPrimary}>Start Trip</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  title: { ...typography.h3, color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.medium,
    ...shadows.small,
  },
  buttonText: { ...typography.body, color: colors.surface, fontWeight: '700' },
  topBar: {
    height: 56,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: { ...typography.h4, color: colors.surface, fontWeight: '800' },
  orderBanner: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  bannerTitle: { ...typography.h4, color: colors.textPrimary },
  bannerSub: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  cameraWrap: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  scanHint: {
    marginTop: spacing.md,
    ...typography.body,
    color: colors.surface,
    fontWeight: '700',
  },
  bottomBar: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  pillRow: { alignItems: 'center' },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillText: { ...typography.body, color: colors.surface, fontWeight: '800' },
  bottomHint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.lg,
    ...shadows.large,
  },
  modalTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.md },
  modalLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },
  modalValue: { ...typography.body, color: colors.textPrimary, marginTop: 2 },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
  },
  modalBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.medium,
    marginLeft: spacing.sm,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimary: { backgroundColor: colors.primary },
  modalBtnSecondary: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  modalBtnTextPrimary: { ...typography.body, color: colors.surface, fontWeight: '800' },
  modalBtnTextSecondary: { ...typography.body, color: colors.textPrimary, fontWeight: '700' },
});

export default HarvestScannerScreen;
