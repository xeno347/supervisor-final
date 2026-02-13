// Login Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';

const LoginScreen: React.FC = () => {
  const [supervisorId, setSupervisorId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!supervisorId || !password) {
      Alert.alert(
        'Validation Error',
        'Please enter both Supervisor ID and Password'
      );
      return;
    }

    setLoading(true);
    try {
      const success = await login(supervisorId, password);
      if (success) {
        // Navigation happens automatically via AuthContext
      } else {
        Alert.alert(
          'Login Failed',
          'Invalid credentials. Please check your Supervisor ID and Password.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Unable to connect to server. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Icon name="tractor" size={80} color={colors.primary} />
          </View>
          <Text style={styles.title}>Agricultural Supervisor</Text>
          <Text style={styles.subtitle}>Field Management System</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Icon name="account" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Supervisor ID"
              placeholderTextColor={colors.textDisabled}
              value={supervisorId}
              onChangeText={setSupervisorId}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textDisabled}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon 
                name={showPassword ? 'eye-off' : 'eye'} 
                size={20} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <Icon 
              name={rememberMe ? 'checkbox-marked' : 'checkbox-blank-outline'} 
              size={24} 
              color={rememberMe ? colors.primary : colors.textSecondary} 
            />
            <Text style={styles.checkboxLabel}>Remember Me</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    backgroundColor: colors.surface,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.large,
  },
  title: {
    ...typography.h2,
    color: colors.surface,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.surface,
    opacity: 0.9,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.lg,
    ...shadows.large,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  checkboxLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.medium,
  },
  loginButtonText: {
    ...typography.h4,
    color: colors.surface,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
