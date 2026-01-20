import React, { useState } from 'react';
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
} from 'react-native';
import { useAuth } from '../context';
import { authService, User } from '../services';

export const SettingsScreen: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    enableAutoSend: user?.settings?.enableAutoSend ?? true,
    preferredChannel: user?.settings?.preferredChannel ?? 'email',
    defaultSendingTime: user?.settings?.defaultSendingTime ?? '08:00',
    defaultTemplate: user?.settings?.defaultTemplate ?? '',
  });
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templateText, setTemplateText] = useState(settings.defaultTemplate);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleToggleAutoSend = async (value: boolean) => {
    try {
      setSettings((prev) => ({ ...prev, enableAutoSend: value }));
      await authService.updateSettings({ enableAutoSend: value });
    } catch (error) {
      setSettings((prev) => ({ ...prev, enableAutoSend: !value }));
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const handleChangeChannel = async (channel: 'sms' | 'whatsapp' | 'email') => {
    try {
      setSettings((prev) => ({ ...prev, preferredChannel: channel }));
      await authService.updateSettings({ preferredChannel: channel });
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const handleSaveTemplate = async () => {
    try {
      setIsLoading(true);
      await authService.updateSettings({ defaultTemplate: templateText });
      setSettings((prev) => ({ ...prev, defaultTemplate: templateText }));
      setShowTemplateEditor(false);
      Alert.alert('Success', 'Template saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save template');
    } finally {
      setIsLoading(false);
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
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-send Messages</Text>
            <Text style={styles.settingDescription}>
              Automatically send birthday wishes
            </Text>
          </View>
          <Switch
            value={settings.enableAutoSend}
            onValueChange={handleToggleAutoSend}
            trackColor={{ false: '#e9ecef', true: '#667eea' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferred Channel</Text>
        <Text style={styles.sectionDescription}>
          Default method for sending birthday messages
        </Text>

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
              <Text style={styles.checkmark}>✓</Text>
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
              onPress={() => setShowTemplateEditor(true)}
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
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.hint}>
              Available placeholders: {'{name}'}, {'{age}'}
            </Text>
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
                style={[styles.saveTemplateButton, isLoading && styles.saveButtonDisabled]}
                onPress={handleSaveTemplate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
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

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Edit Profile</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Change Password</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Timezone</Text>
          <Text style={styles.menuItemValue}>{user?.timezone || 'UTC'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Privacy Policy</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>Terms of Service</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.menuItem}>
          <Text style={styles.menuItemText}>Version</Text>
          <Text style={styles.menuItemValue}>1.0.0</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#667eea',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  channelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  channelOptionActive: {
    borderColor: '#667eea',
    backgroundColor: '#f0f2ff',
  },
  channelInfo: {
    flex: 1,
  },
  channelLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  channelDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: 'bold',
  },
  templatePreview: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  editButton: {
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  templateInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  templateButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  saveTemplateButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#aab4f0',
  },
  saveTemplateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  menuItemValue: {
    fontSize: 14,
    color: '#666',
  },
  menuItemArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  logoutButtonText: {
    color: '#e74c3c',
    fontSize: 16,
    fontWeight: '600',
  },
});
