// Custom Tab Bar Component
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, spacing, typography, shadows } from '../utils/theme';

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const getIconName = (routeName: string) => {
    switch (routeName) {
      case 'TasksTab':
        return 'clipboard-list';
      case 'HarvestTab':
        return 'qrcode-scan';
      case 'HomeTab':
        return 'home';
      case 'RequestTab':
        return 'file-document';
      case 'ProfileTab':
        return 'account';
      default:
        return 'circle';
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'TasksTab':
        return 'Tasks';
      case 'HarvestTab':
        return 'Harvest';
      case 'HomeTab':
        return 'Home';
      case 'RequestTab':
        return 'Request';
      case 'ProfileTab':
        return 'Profile';
      default:
        return routeName;
    }
  };

  // Render all other tabs normally and render the Home center button absolutely centered
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const isCenterTab = route.name === 'HomeTab';
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isCenterTab) {
            return (
              <View key={route.key} style={styles.centerTabSpace}>
                <TouchableOpacity
                  style={[styles.centerButton, isFocused && styles.centerButtonActive]}
                  onPress={onPress}
                  activeOpacity={0.7}
                >
                  <Icon name="home" size={32} color={colors.surface} />
                </TouchableOpacity>
              </View>
            );
          }
          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tab}
              onPress={onPress}
              activeOpacity={0.7}
            >
              <Icon
                name={getIconName(route.name)}
                size={24}
                color={isFocused ? colors.primary : colors.textDisabled}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? colors.primary : colors.textDisabled },
                ]}
              >
                {getTabLabel(route.name)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'relative',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    height: 65,
    ...shadows.large,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    ...typography.small,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  centerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -32,
    alignSelf: 'center',
    ...shadows.large,
    elevation: 8,
  },
  centerButtonActive: {
    backgroundColor: colors.primaryDark,
  },
  centerTabSpace: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomTabBar;
