// Harvest Orders Screen
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';
import { getHarvestOrders, HarvestOrderApiItem, BASE_URL } from '../../utils/api';

type HarvestOrder = {
  id: string;
  orderNo: string;
  fieldName: string;
  crop: string;
  quantity: string;
  scheduledDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  isActive: boolean;
  raw: HarvestOrderApiItem;
};

type TripSheetRow = {
  tripNo: string;
  netWeightTon: number;
  moisturePercent: number;
  foreignMaterialPercent: number;
};

type HarvestWsMessage = {
  event?: string;
  data?: {
    net_weight?: number | string;
    moisture_level?: number | string;
    foregine_material?: number | string;
    trip_sheet_length?: number | string;
    order_id?: string;
    supervisor_id?: string;
  };
};

const HarvestOrdersScreen: React.FC<any> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<HarvestOrderApiItem[]>([]);
  const [tripSheetVisible, setTripSheetVisible] = useState(false);
  const [tripSheetOrder, setTripSheetOrder] = useState<HarvestOrder | null>(null);
  const [wsTripUpdates, setWsTripUpdates] = useState<Record<string, TripSheetRow[]>>({});

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await getHarvestOrders();
      setOrders(res.harvest_orders ?? []);
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load harvest orders',
        text2: e?.message ? String(e.message) : 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadOrders();
    } finally {
      setRefreshing(false);
    }
  };

  const uiOrders = useMemo(() => {
    // Match cached supervisor_id with response.supervisor_details.supervisor_id
    return (async () => {
      const cachedSupervisorId = await AsyncStorage.getItem('supervisor_id');
      const filtered = (orders ?? []).filter(o => {
        if (!cachedSupervisorId) return true;
        const remoteId = o?.supervisor_details?.supervisor_id;
        return typeof remoteId === 'string' ? remoteId === cachedSupervisorId : true;
      });

      const mapped: HarvestOrder[] = filtered.map((o) => {
        const area = o?.farm_details?.area;
        const isActive = typeof o?.tipper_card_number === 'string' && o.tipper_card_number.trim().length > 0;

        return {
          id: o.order_id,
          orderNo: o.order_id,
          fieldName: o?.farm_details?.block_name ?? 'Unknown Block',
          crop: o?.farm_details?.farming_option ?? 'Harvest',
          quantity: typeof area === 'number' ? `${area} acres` : '—',
          scheduledDate: (o.created_at ?? '').split('T')[0] || '—',
          status: o.status === 'completed' ? 'Completed' : o.status === 'started' ? 'In Progress' : 'Pending',
          isActive,
          raw: o,
        };
      });

      return mapped;
    })();
  }, [orders]);

  const [resolvedOrders, setResolvedOrders] = useState<HarvestOrder[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await uiOrders;
        if (!cancelled) setResolvedOrders(r);
      } catch {
        if (!cancelled) setResolvedOrders([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uiOrders]);

  const statusStyle = (status: HarvestOrder['status']) => {
    switch (status) {
      case 'Pending':
        return styles.status_Pending;
      case 'In Progress':
        return styles.status_InProgress;
      case 'Completed':
        return styles.status_Completed;
      default:
        return styles.status_Pending;
    }
  };

  const canUseNotifee = () => {
    try {
      // If native module isn't linked/loaded, notifee methods throw.
      return typeof (notifee as any)?.displayNotification === 'function';
    } catch {
      return false;
    }
  };

  const ensureUnloadChannel = async () => {
    try {
      if (!canUseNotifee()) return;
      // Android requires a channel
      if (Platform.OS === 'android') {
        await notifee.createChannel({
          id: 'harvest',
          name: 'Harvest',
          importance: AndroidImportance.HIGH,
        });
      }
    } catch {
      // ignore
    }
  };

  const showTipperUnloadedNotification = async () => {
    // Always show in-app toast, and use native notification when available.
    Toast.show({ type: 'info', text1: 'tripper has been unloaded' });

    try {
      if (!canUseNotifee()) return;
      await ensureUnloadChannel();
      await notifee.displayNotification({
        title: 'Harvest Update',
        body: 'tripper has been unloaded',
        android: {
          channelId: 'harvest',
          pressAction: { id: 'default' },
        },
      });
    } catch {
      // ignore
    }
  };

  const wsUrl = useMemo(() => {
    // BASE_URL is like https://.../api, websocket is BASE_URL/ws/harvest (per requirement)
    // Convert http(s) -> ws(s)
    const base = String(BASE_URL || '').replace(/\/$/, '');
    const baseWs = base.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
    return `${baseWs}/ws/harvest`;
  }, []);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let isClosed = false;

    const connect = async () => {
      const cachedSupervisorId = await AsyncStorage.getItem('supervisor_id');

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          // no-op
        };

        ws.onmessage = async (evt) => {
          let msg: HarvestWsMessage | null = null;
          try {
            msg = JSON.parse(String(evt.data));
          } catch {
            return;
          }

          if (msg?.event !== 'TIPPER_UNLOADED') return;
          const data = msg?.data;
          if (!data) return;

          const remoteSupervisorId = data.supervisor_id;
          if (cachedSupervisorId && remoteSupervisorId && remoteSupervisorId !== cachedSupervisorId) return;

          const orderId = data.order_id;
          if (!orderId) return;

          const tripNo = String(data.trip_sheet_length ?? '');
          const netWeightTon = Number(data.net_weight);
          const moisturePercent = Number(data.moisture_level);
          const foreignMaterialPercent = Number(data.foregine_material);

          const row: TripSheetRow = {
            tripNo: tripNo && tripNo !== 'NaN' ? tripNo : '-',
            netWeightTon: Number.isFinite(netWeightTon) ? netWeightTon : 0,
            moisturePercent: Number.isFinite(moisturePercent) ? moisturePercent : 0,
            foreignMaterialPercent: Number.isFinite(foreignMaterialPercent) ? foreignMaterialPercent : 0,
          };

          setWsTripUpdates((prev) => {
            const existing = prev[orderId] ?? [];
            return {
              ...prev,
              [orderId]: [...existing, row],
            };
          });

          await showTipperUnloadedNotification();
        };

        ws.onerror = () => {
          // no-op
        };

        ws.onclose = () => {
          if (isClosed) return;
          // simple retry
          setTimeout(() => {
            if (!isClosed) connect();
          }, 2000);
        };
      } catch {
        // retry
        setTimeout(() => {
          if (!isClosed) connect();
        }, 2000);
      }
    };

    connect();

    return () => {
      isClosed = true;
      try {
        ws?.close();
      } catch {
        // ignore
      }
      ws = null;
    };
  }, [wsUrl]);

  const normalizeTripSheet = (raw: any): TripSheetRow[] => {
    const arr = Array.isArray(raw) ? raw : [];
    return arr
      .map((r: any, idx: number) => {
        // New API shape:
        // {
        //   weighment: { gross_weight, tare_weight, net_weight },
        //   quality_check: { moisture_percentage, foreign_material_percentage, chopping_size }
        // }
        const weighment = r?.weighment ?? r?.weighment_details ?? r?.weighmentDetails;
        const quality = r?.quality_check ?? r?.qualityCheck ?? r?.quality;

        const tripNo =
          (r?.trip_no ?? r?.tripNo ?? r?.trip ?? r?.trip_number ?? r?.tripNumber ?? idx + 1) as any;

        const nw =
          (weighment?.net_weight ??
            r?.nw ??
            r?.net_weight ??
            r?.netWeight ??
            r?.net_wight ??
            r?.netWight ??
            r?.net_weight_ton);

        const moist =
          (quality?.moisture_percentage ??
            quality?.moisturePercent ??
            r?.moist ??
            r?.moisture ??
            r?.moist_percent ??
            r?.moisture_percent ??
            r?.moisturePercentage);

        const fm =
          (quality?.foreign_material_percentage ??
            quality?.foreignMaterialPercent ??
            r?.fm ??
            r?.foreign_material ??
            r?.foreignMaterial ??
            r?.fm_percent ??
            r?.foreignMaterialPercentage);

        const netWeightTon = Number(nw);
        const moisturePercent = Number(moist);
        const foreignMaterialPercent = Number(fm);

        return {
          tripNo: String(tripNo ?? idx + 1),
          netWeightTon: Number.isFinite(netWeightTon) ? netWeightTon : 0,
          moisturePercent: Number.isFinite(moisturePercent) ? moisturePercent : 0,
          foreignMaterialPercent: Number.isFinite(foreignMaterialPercent) ? foreignMaterialPercent : 0,
        };
      })
      .filter(Boolean);
  };

  const tripSheetRows = useMemo(() => {
    if (!tripSheetOrder) return [];
    const apiRows = normalizeTripSheet(tripSheetOrder.raw?.trip_sheet);
    const wsRows = wsTripUpdates[tripSheetOrder.raw?.order_id ?? tripSheetOrder.id] ?? [];

    // If API doesn’t have trip_no, keep WS rows appended.
    // If API has rows, still append WS rows to show latest.
    return [...apiRows, ...wsRows];
  }, [tripSheetOrder, wsTripUpdates]);

  const totalNetWeightTon = useMemo(() => {
    return tripSheetRows.reduce((sum, r) => sum + (Number.isFinite(r.netWeightTon) ? r.netWeightTon : 0), 0);
  }, [tripSheetRows]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Harvest Orders</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading harvest orders...</Text>
        </View>
      ) : (
        <FlatList
          data={resolvedOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.isActive && styles.cardInactive]}
              activeOpacity={0.8}
              onPress={() => {
                if (!item.isActive) {
                  Alert.alert(
                    'Order Inactive',
                    'This harvest order has no tipper card number allocated yet. You cannot scan this order.'
                  );
                  return;
                }
                navigation.navigate('HarvestScanner', { order: item.raw });
              }}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderNo}>{item.orderNo}</Text>
                  <Text style={styles.subText}>
                    {item.fieldName} • {item.crop}
                  </Text>
                </View>
                <Icon
                  name={item.isActive ? 'qrcode-scan' : 'qrcode-remove'}
                  size={26}
                  color={item.isActive ? colors.primary : colors.textDisabled}
                />
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.meta}>Area: {item.quantity}</Text>
                <Text style={styles.meta}>Date: {item.scheduledDate}</Text>
              </View>

              <View style={styles.pillRow}>
                <View style={[styles.statusPill, statusStyle(item.status)]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
                <View style={[styles.activePill, item.isActive ? styles.activePillOn : styles.activePillOff]}>
                  <Text style={styles.activeText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.tripSheetButton}
                  activeOpacity={0.85}
                  onPress={(e) => {
                    // prevent parent card onPress
                    // @ts-ignore
                    e?.stopPropagation?.();
                    setTripSheetOrder(item);
                    setTripSheetVisible(true);
                  }}
                >
                  <Icon name="file-table" size={18} color={colors.primary} />
                  <Text style={styles.tripSheetButtonText}>Trip Sheet</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No harvest orders.</Text>}
        />
      )}

      <View style={styles.hint}>
        <Icon name="information" size={18} color={colors.textSecondary} />
        <Text style={styles.hintText}>Only Active orders (with tipper card number) can be scanned.</Text>
      </View>

      {/* Trip Sheet Modal */}
      {/* NOTE: Using a simple full-screen overlay modal to avoid extra deps */}
      {tripSheetVisible && (
        <View style={styles.tripSheetOverlay}>
          <View style={styles.tripSheetModal}>
            <View style={styles.tripSheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tripSheetTitle}>Trip Sheet</Text>
                {!!tripSheetOrder?.orderNo && (
                  <Text style={styles.tripSheetSubTitle}>Order: {tripSheetOrder.orderNo}</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => {
                  setTripSheetVisible(false);
                  setTripSheetOrder(null);
                }}
              >
                <Icon name="close" size={26} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <Text style={[styles.cell, styles.colTrip, styles.tableHeaderText]}>Trip no.</Text>
                <Text style={[styles.cell, styles.colNW, styles.tableHeaderText]}>NW (ton)</Text>
                <Text style={[styles.cell, styles.colMoist, styles.tableHeaderText]}>Moist %</Text>
                <Text style={[styles.cell, styles.colFM, styles.tableHeaderText]}>FM %</Text>
              </View>

              {tripSheetRows.length === 0 ? (
                <View style={styles.tableEmpty}>
                  <Text style={styles.tableEmptyText}>No trip sheet data.</Text>
                </View>
              ) : (
                tripSheetRows.map((r, idx) => (
                  <View key={`${r.tripNo}-${idx}`} style={styles.tableRow}>
                    <Text style={[styles.cell, styles.colTrip]}>{r.tripNo}</Text>
                    <Text style={[styles.cell, styles.colNW]}>{r.netWeightTon.toFixed(2)}</Text>
                    <Text style={[styles.cell, styles.colMoist]}>{r.moisturePercent.toFixed(1)}</Text>
                    <Text style={[styles.cell, styles.colFM]}>{r.foreignMaterialPercent.toFixed(1)}</Text>
                  </View>
                ))
              )}

              <View style={[styles.tableRow, styles.tableTotalRow]}>
                <Text style={[styles.cell, styles.colTrip, styles.totalLabel]}>Total</Text>
                <Text style={[styles.cell, styles.colNW, styles.totalValue]}>{totalNetWeightTon.toFixed(2)}</Text>
                <Text style={[styles.cell, styles.colMoist]} />
                <Text style={[styles.cell, styles.colFM]} />
              </View>
            </View>

            <TouchableOpacity
              style={styles.tripSheetCloseButton}
              onPress={() => {
                setTripSheetVisible(false);
                setTripSheetOrder(null);
              }}
            >
              <Text style={styles.tripSheetCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    ...typography.h3,
    color: colors.textPrimary,
    padding: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  cardInactive: {
    opacity: 0.6,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  orderNo: { ...typography.h4, color: colors.textPrimary },
  subText: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  meta: { ...typography.caption, color: colors.textSecondary },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  activePill: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  activePillOn: { backgroundColor: colors.success },
  activePillOff: { backgroundColor: colors.textDisabled },
  statusText: { ...typography.small, color: colors.surface, fontWeight: '700' },
  activeText: { ...typography.small, color: colors.surface, fontWeight: '700' },
  status_Pending: { backgroundColor: colors.warning },
  status_InProgress: { backgroundColor: colors.primary },
  status_Completed: { backgroundColor: colors.success },
  empty: { ...typography.body, color: colors.textDisabled, padding: spacing.md },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  hintText: { ...typography.caption, color: colors.textSecondary, marginLeft: spacing.sm },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },

  actionsRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  tripSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight + '20',
    borderWidth: 1,
    borderColor: colors.primaryLight + '55',
  },
  tripSheetButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: spacing.xs,
  },

  tripSheetOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  tripSheetModal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    ...shadows.large,
  },
  tripSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tripSheetTitle: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  tripSheetSubTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  table: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tableHeaderRow: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 0,
    marginBottom: spacing.sm,
  },
  tableHeaderText: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '800',
  },
  cell: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  colTrip: { flex: 1.2 },
  colNW: { flex: 1.1, textAlign: 'right' },
  colMoist: { flex: 1.0, textAlign: 'right' },
  colFM: { flex: 1.0, textAlign: 'right' },

  tableEmpty: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableEmptyText: {
    ...typography.body,
    color: colors.textDisabled,
  },

  tableTotalRow: {
    borderBottomWidth: 0,
    paddingTop: spacing.md,
  },
  totalLabel: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  totalValue: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'right',
  },

  tripSheetCloseButton: {
    margin: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripSheetCloseButtonText: {
    ...typography.body,
    color: colors.surface,
    fontWeight: '800',
  },
});

export default HarvestOrdersScreen;
