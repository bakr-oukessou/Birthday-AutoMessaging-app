import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { format } from 'date-fns';
import { contactService, CreateContactData } from '../services';
import { colors, spacing, radius, shadows } from '../theme';

interface AddContactScreenProps {
  navigation: any;
  route: any;
}

// Auto-insert dashes while typing a YYYY-MM-DD date
const formatDateInput = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

const parseDateOfBirth = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split('-').map(Number);
  // Build as UTC midnight (how the backend stores birthdays) and verify the
  // components survived, which catches impossible dates like 2000-02-31
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  if (year < 1900 || date.getTime() > Date.now()) return null;
  return date;
};

export const AddContactScreen: React.FC<AddContactScreenProps> = ({ navigation, route }) => {
  const contactId = route?.params?.contactId as string | undefined;
  const isEditing = Boolean(contactId);
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [relationship, setRelationship] = useState<'family' | 'friend' | 'colleague' | 'other'>('friend');
  const [enableNotification, setEnableNotification] = useState(true);
  const [sendingChannel, setSendingChannel] = useState<'sms' | 'whatsapp' | 'email' | 'user_default'>('user_default');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit Contact' : 'Add Contact' });
  }, [isEditing, navigation]);

  useEffect(() => {
    let isMounted = true;

    const loadContact = async () => {
      if (!contactId) return;

      setIsLoading(true);
      try {
        const contact = await contactService.getContact(contactId);
        if (!isMounted) return;

        setName(contact.name || '');
        setDateOfBirth(format(new Date(contact.dateOfBirth), 'yyyy-MM-dd'));
        setPhone(contact.phone || '');
        setEmail(contact.email || '');
        setCustomMessage(contact.customMessage || '');
        setRelationship(contact.relationship || 'friend');
        setEnableNotification(contact.notificationSettings?.enableNotification ?? true);
        setSendingChannel(contact.notificationSettings?.sendingChannel || 'user_default');
        setNotes(contact.notes || '');
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to load contact');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadContact();
    return () => {
      isMounted = false;
    };
  }, [contactId]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a name');
      return;
    }

    const parsedDob = parseDateOfBirth(dateOfBirth);
    if (!parsedDob) {
      Alert.alert('Invalid Date', 'Please enter a valid past date of birth in YYYY-MM-DD format');
      return;
    }

    if (!phone.trim() && !email.trim()) {
      Alert.alert('Missing Contact Method', 'Please enter at least a phone number or email');
      return;
    }

    setIsLoading(true);

    try {
      const contactData: CreateContactData = {
        name: name.trim(),
        dateOfBirth: parsedDob.toISOString(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        customMessage: customMessage.trim() || undefined,
        relationship,
        notes: notes.trim() || undefined,
        notificationSettings: {
          enableNotification,
          sendingChannel,
          reminderDaysBefore: 1,
        },
      };

      if (isEditing && contactId) {
        await contactService.updateContact(contactId, contactData);
      } else {
        await contactService.createContact(contactData);
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || (isEditing ? 'Failed to update contact' : 'Failed to add contact'));
    } finally {
      setIsLoading(false);
    }
  };

  const relationships = [
    { key: 'family', label: '👨‍👩‍👧 Family' },
    { key: 'friend', label: '👋 Friend' },
    { key: 'colleague', label: '💼 Colleague' },
    { key: 'other', label: '👤 Other' },
  ];

  const channels = [
    { key: 'user_default', label: 'Default' },
    { key: 'email', label: '📧 Email' },
    { key: 'sms', label: '📱 SMS' },
    { key: 'whatsapp', label: '💬 WhatsApp' },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date of Birth *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD (e.g., 1990-05-15)"
            placeholderTextColor={colors.textMuted}
            value={dateOfBirth}
            onChangeText={(text) => setDateOfBirth(formatDateInput(text))}
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="+1 234 567 8900"
            placeholderTextColor={colors.textMuted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Relationship</Text>
          <View style={styles.chipContainer}>
            {relationships.map((rel) => (
              <TouchableOpacity
                key={rel.key}
                style={[
                  styles.chip,
                  relationship === rel.key && styles.chipActive,
                ]}
                onPress={() => setRelationship(rel.key as any)}
              >
                <Text
                  style={[
                    styles.chipText,
                    relationship === rel.key && styles.chipTextActive,
                  ]}
                >
                  {rel.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Enable Birthday Notification</Text>
          <Switch
            value={enableNotification}
            onValueChange={setEnableNotification}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.card}
          />
        </View>

        {enableNotification && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Sending Channel</Text>
            <View style={styles.chipContainer}>
              {channels.map((channel) => (
                <TouchableOpacity
                  key={channel.key}
                  style={[
                    styles.chip,
                    sendingChannel === channel.key && styles.chipActive,
                  ]}
                  onPress={() => setSendingChannel(channel.key as any)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      sendingChannel === channel.key && styles.chipTextActive,
                    ]}
                  >
                    {channel.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Message (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Write a custom birthday message..."
          placeholderTextColor={colors.textMuted}
          value={customMessage}
          onChangeText={setCustomMessage}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.hint}>
          Use {'{name}'} for the contact's name and {'{age}'} for the age they're turning
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Add any notes about this contact..."
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          maxLength={1000}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <Text style={styles.saveButtonText}>{isEditing ? 'Save Changes' : 'Save Contact'}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textOnPrimary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
