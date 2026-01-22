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
  Platform,
} from 'react-native';
import { format, parse } from 'date-fns';
import { contactService, CreateContactData } from '../services';

interface AddContactScreenProps {
  navigation: any;
  route: any;
}

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
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (!dateOfBirth) {
      Alert.alert('Error', 'Please enter a date of birth');
      return;
    }

    if (!phone && !email) {
      Alert.alert('Error', 'Please enter at least a phone number or email');
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      Alert.alert('Error', 'Please enter date in YYYY-MM-DD format');
      return;
    }

    setIsLoading(true);

    try {
      const contactData: CreateContactData = {
        name: name.trim(),
        dateOfBirth: new Date(dateOfBirth).toISOString(),
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
        Alert.alert('Success', 'Contact updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await contactService.createContact(contactData);
        Alert.alert('Success', 'Contact added successfully', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date of Birth *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD (e.g., 1990-05-15)"
            placeholderTextColor="#999"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="+1 234 567 8900"
            placeholderTextColor="#999"
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
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
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
            trackColor={{ false: '#e9ecef', true: '#667eea' }}
            thumbColor="#fff"
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
          placeholderTextColor="#999"
          value={customMessage}
          onChangeText={setCustomMessage}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.hint}>
          Use {'{name}'} to include the contact's name
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Add any notes about this contact..."
          placeholderTextColor="#999"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Contact</Text>
        )}
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
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  dateButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  chipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
  },
  chipTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#aab4f0',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
