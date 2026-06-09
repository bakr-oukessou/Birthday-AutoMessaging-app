import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context';
import { authService, templateService, MessageTemplate } from '../services';
import { colors, spacing, radius, shadows } from '../theme';

const COMMON_TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Africa/Casablanca',
  'Africa/Cairo',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export const SettingsScreen: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    enableAutoSend: user?.settings?.enableAutoSend ?? true,
    preferredChannel: user?.settings?.preferredChannel ?? 'email',
    defaultSendingTime: user?.settings?.defaultSendingTime ?? '08:00',
    defaultTemplate: user?.settings?.defaultTemplate ?? '',
  });
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');

  // Template editor
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templateText, setTemplateText] = useState(settings.defaultTemplate);
  const [presets, setPresets] = useState<MessageTemplate[]>([]);

  // Modals
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [timezoneModalVisible, setTimezoneModalVisible] = useState(false);

  // Pull fresh settings so multiple devices stay in sync
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const data = await authService.getSettings();
        if (!isMounted) return;
        setSettings(data.settings);
        setTemplateText(data.settings.defaultTemplate || '');
        setTimezone(data.timezone || 'UTC');
      } catch {
        // Keep locally cached values when offline
      }

      try {
        const templates = await templateService.getTemplates();
        if (isMounted) setPresets(templates);
      } catch {
        // Presets are optional
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleToggleAutoSend = async (value: boolean) => {
    try {
      setSettings((prev) => ({ ...prev, enableAutoSend: value }));
      await authService.updateSettings({ enableAutoSend: value });
    } catch (error: any) {
      setSettings((prev) => ({ ...prev, enableAutoSend: !value }));
      Alert.alert('Error', error.message || 'Failed to update settings');
    }
  };

  const handleChangeChannel = async (channel: 'sms' | 'whatsapp' | 'email') => {
    const previous = settings.preferredChannel;
    try {
      setSettings((prev) => ({ ...prev, preferredChannel: channel }));
      await authService.updateSettings({ preferredChannel: channel });
    } catch (error: any) {
      setSettings((prev) => ({ ...prev, preferredChannel: previous }));
      Alert.alert('Error', error.message || 'Failed to update settings');
    }
  };

  const handleSaveTemplate = async () => {
    try {
      setIsLoading(true);
      await authService.updateSettings({ defaultTemplate: templateText });
      setSettings((prev) => ({ ...prev, defaultTemplate: templateText }));
      setShowTemplateEditor(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      setIsLoading(true);
      const updated = await authService.updateProfile({ name: profileName.trim() });
      updateUser(updated);
      setProfileModalVisible(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await authService.changePassword(currentPassword, newPassword);
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      Alert.alert('Success', 'Password changed successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTimezone = async (tz: string) => {
    const previous = timezone;
    setTimezone(tz);
    setTimezoneModalVisible(false);
    try {
      const updated = await authService.updateProfile({ timezone: tz });
      updateUser(updated);
    } catch (error: any) {
      setTimezone(previous);
      Alert.alert('Error', error.message || 'Failed to update timezone');
    }
  };

  const channels = [
    { key: 'email', label: '📧 Email', description: 'Send via email' },
    { key: 'sms', label: '📱 SMS', description: 'Send via text message' },
    { key: 'whatsapp', label: '💬 WhatsApp', description: 'Send via WhatsApp' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-send Messages</Text>
            <Text style={styles.settingDescription}>Automatically send birthday wishes</Text>
          </View>
          <Switch
            value={settings.enableAutoSend}
            onValueChange={handleToggleAutoSend}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.card}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferred Channel</Text>
        <Text style={styles.sectionDescription}>Default method for sending birthday messages</Text>

        {channels.map((channel) => (
          <TouchableOpacity
            key={channel.key}
            style={[
              styles.channelOption,
              settings.preferredChannel === channel.key && styles.channelOptionActive,
            ]}
            onPress={() => handleChangeChannel(channel.key as any)}
          >
            <View style={styles.channelInfo}>
              <Text style={styles.channelLabel}>{channel.label}</Text>
              <Text style={styles.channelDescription}>{channel.description}</Text>
            </View>
            {settings.preferredChannel === channel.key && (
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Message Template</Text>

        {!showTemplateEditor ? (
          <>
            <Text style={styles.templatePreview}>
              {settings.defaultTemplate || 'No custom template set'}
            </Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                setTemplateText(settings.defaultTemplate);
                setShowTemplateEditor(true);
              }}
            >
              <Text style={styles.editButtonText}>Edit Template</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.templateInput}
              value={templateText}
              onChangeText={setTemplateText}
              placeholder="Happy Birthday, {name}! 🎂 Wishing you a wonderful day!"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.hint}>
              Placeholders: {'{name}'}, {'{age}'}, {'{sender}'}
            </Text>
            {presets.length > 0 && (
              <View style={styles.presetContainer}>
                {presets.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={styles.presetChip}
                    onPress={() => setTemplateText(preset.message)}
                  >
                    <Text style={styles.presetChipText}>{preset.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.templateButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setTemplateText(settings.defaultTemplate);
                  setShowTemplateEditor(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveTemplateButton, isLoading && styles.buttonDisabled]}
                onPress={handleSaveTemplate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.textOnPrimary} size="small" />
                ) : (
                  <Text style={styles.saveTemplateButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            setProfileName(user?.name || '');
            setProfileModalVisible(true);
          }}
        >
          <Text style={styles.menuItemText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setPasswordModalVisible(true)}>
          <Text style={styles.menuItemText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setTimezoneModalVisible(true)}>
          <Text style={styles.menuItemText}>Timezone</Text>
          <Text style={styles.menuItemValue}>{timezone}</Text>
        </TouchableOpacity>

        <View style={[styles.menuItem, styles.menuItemLast]}>
          <Text style={styles.menuItemText}>Version</Text>
          <Text style={styles.menuItemValue}>1.0.0</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      {/* Edit Profile modal */}
      <Modal visible={profileModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              value={profileName}
              onChangeText={setProfileName}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setProfileModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveTemplateButton, isLoading && styles.buttonDisabled]}
                onPress={handleSaveProfile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.textOnPrimary} size="small" />
                ) : (
                  <Text style={styles.saveTemplateButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password modal */}
      <Modal visible={passwordModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Text style={styles.modalLabel}>Current Password</Text>
            <TextInput
              style={styles.modalInput}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="Current password"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.modalLabel}>New Password</Text>
            <TextInput
              style={styles.modalInput}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.modalLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.modalInput}
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              secureTextEntry
              placeholder="Repeat new password"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setPasswordModalVisible(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveTemplateButton, isLoading && styles.buttonDisabled]}
                onPress={handleChangePassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.textOnPrimary} size="small" />
                ) : (
                  <Text style={styles.saveTemplateButtonText}>Change</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Timezone picker modal */}
      <Modal visible={timezoneModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, styles.timezoneModal]}>
            <Text style={styles.modalTitle}>Select Timezone</Text>
            <FlatList
              data={COMMON_TIMEZONES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.timezoneRow} onPress={() => handleSelectTimezone(item)}>
                  <Text
                    style={[styles.timezoneText, item === timezone && styles.timezoneTextActive]}
                  >
                    {item}
                  </Text>
                  {item === timezone && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.cancelButton, styles.timezoneCancel]}
              onPress={() => setTimezoneModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: 60,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm + 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textOnPrimary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  section: {
    backgroundColor: colors.card,
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm + 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  channelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.inputBackground,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  channelOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  channelInfo: {
    flex: 1,
  },
  channelLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  channelDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  templatePreview: {
    fontSize: 14,
    color: colors.textSecondary,
    backgroundColor: colors.inputBackground,
    padding: spacing.sm + 4,
    borderRadius: radius.sm,
    marginBottom: spacing.sm + 4,
  },
  editButton: {
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  templateInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 14,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm + 4,
  },
  presetChip: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
  presetChipText: {
    fontSize: 13,
    color: colors.primaryDark,
    fontWeight: '500',
  },
  templateButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm + 4,
    gap: spacing.sm + 4,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  saveTemplateButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveTemplateButtonText: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  menuItemValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  logoutButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.raised,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  modalInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm + 4,
  },
  timezoneModal: {
    maxHeight: '70%',
  },
  timezoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timezoneText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  timezoneTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  timezoneCancel: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },
});
