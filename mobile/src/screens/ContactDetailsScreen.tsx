import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { contactService, Contact } from '../services';
import { colors, spacing, radius, shadows, avatarColor } from '../theme';

interface ContactDetailsScreenProps {
  navigation: any;
  route: any;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  family: '👨‍👩‍👧 Family',
  friend: '👋 Friend',
  colleague: '💼 Colleague',
  other: '👤 Other',
};

export const ContactDetailsScreen: React.FC<ContactDetailsScreenProps> = ({ navigation, route }) => {
  const contactId = route?.params?.contactId as string | undefined;
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const loadContact = useCallback(async () => {
    if (!contactId) {
      Alert.alert('Error', 'Missing contact id');
      navigation.goBack();
      return;
    }

    try {
      const data = await contactService.getContact(contactId);
      setContact(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load contact');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  }, [contactId, navigation]);

  // Reload on focus so changes made on the edit screen are reflected
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadContact);
    return unsubscribe;
  }, [navigation, loadContact]);

  const handleSendMessage = () => {
    if (!contact) return;

    const message = (contact.customMessage || 'Happy Birthday, {name}! 🎂 Wishing you a wonderful day!')
      .replace(/{name}/g, contact.name)
      .replace(/{age}/g, String(contact.age));

    Alert.alert('Send Birthday Message', `"${message}"`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send',
        onPress: async () => {
          setIsSending(true);
          try {
            const result = await contactService.sendMessage(contact._id, message);
            Alert.alert('Sent! 🎉', `Message sent to ${result.to} via ${result.channel}`);
            loadContact();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to send message');
          } finally {
            setIsSending(false);
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    if (!contact) return;

    Alert.alert('Delete Contact', `Delete ${contact.name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await contactService.deleteContact(contact._id);
            navigation.goBack();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete contact');
          }
        },
      },
    ]);
  };

  if (isLoading || !contact) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const nextBirthday = parseISO(contact.nextBirthday);
  const daysUntil = Math.max(0, differenceInCalendarDays(nextBirthday, new Date()));
  const isToday = daysUntil === 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Identity */}
      <View style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: avatarColor(contact.name) }]}>
          <Text style={styles.avatarText}>{contact.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{contact.name}</Text>
        <View style={styles.relationshipChip}>
          <Text style={styles.relationshipText}>
            {RELATIONSHIP_LABELS[contact.relationship] || RELATIONSHIP_LABELS.other}
          </Text>
        </View>
      </View>

      {/* Birthday countdown */}
      <View style={[styles.birthdayCard, isToday && styles.birthdayCardToday]}>
        <Text style={styles.birthdayEmoji}>{isToday ? '🎉' : '🎂'}</Text>
        <View style={styles.birthdayInfo}>
          <Text style={[styles.birthdayCountdown, isToday && styles.birthdayTextToday]}>
            {isToday
              ? `Birthday today — turning ${contact.age}!`
              : daysUntil === 1
                ? 'Birthday tomorrow!'
                : `Birthday in ${daysUntil} days`}
          </Text>
          <Text style={[styles.birthdayDate, isToday && styles.birthdayTextToday]}>
            {format(nextBirthday, 'EEEE, MMMM d')} · {contact.age} years old
          </Text>
        </View>
      </View>

      {/* Contact info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Info</Text>
        {contact.phone ? (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>{contact.phone}</Text>
          </View>
        ) : null}
        {contact.email ? (
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={20} color={colors.primary} />
            <Text style={styles.infoText}>{contact.email}</Text>
          </View>
        ) : null}
        <View style={styles.infoRow}>
          <Ionicons
            name={contact.notificationSettings.enableNotification ? 'notifications-outline' : 'notifications-off-outline'}
            size={20}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            Auto-send {contact.notificationSettings.enableNotification ? 'enabled' : 'disabled'}
          </Text>
        </View>
        {contact.lastBirthdayMessage?.sentAt ? (
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
            <Text style={styles.infoText}>
              Message sent {format(parseISO(contact.lastBirthdayMessage.sentAt), 'MMM d, yyyy')}
              {contact.lastBirthdayMessage.channel ? ` via ${contact.lastBirthdayMessage.channel}` : ''}
            </Text>
          </View>
        ) : (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={colors.textMuted} />
            <Text style={styles.infoText}>No birthday message sent this year</Text>
          </View>
        )}
      </View>

      {/* Notes */}
      {contact.notes ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notesText}>{contact.notes}</Text>
        </View>
      ) : null}

      {/* Actions */}
      <TouchableOpacity
        style={[styles.primaryButton, isSending && styles.buttonDisabled]}
        onPress={handleSendMessage}
        disabled={isSending}
        activeOpacity={0.8}
      >
        {isSending ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <>
            <Ionicons name="paper-plane-outline" size={18} color={colors.textOnPrimary} />
            <Text style={styles.primaryButtonText}>Send Birthday Message</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('AddContact', { contactId: contact._id })}
        activeOpacity={0.8}
      >
        <Ionicons name="create-outline" size={18} color={colors.primary} />
        <Text style={styles.secondaryButtonText}>Edit Contact</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.8}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
        <Text style={styles.deleteButtonText}>Delete Contact</Text>
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
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm + 4,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  relationshipChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  relationshipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  birthdayCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  birthdayCardToday: {
    backgroundColor: colors.primary,
  },
  birthdayEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  birthdayInfo: {
    flex: 1,
  },
  birthdayCountdown: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  birthdayDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  birthdayTextToday: {
    color: colors.textOnPrimary,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm + 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    paddingVertical: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  notesText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm + 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm + 4,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
});
