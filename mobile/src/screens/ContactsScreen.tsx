import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { contactService, Contact } from '../services';
import { colors, spacing, radius, shadows, avatarColor } from '../theme';

interface ContactsScreenProps {
  navigation: any;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  family: 'Family',
  friend: 'Friend',
  colleague: 'Colleague',
  other: 'Other',
};

export const ContactsScreen: React.FC<ContactsScreenProps> = ({ navigation }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce typing so we don't hit the API on every keystroke
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery]);

  const loadContacts = useCallback(async () => {
    try {
      const params: any = { limit: 100 };
      if (debouncedQuery) params.search = debouncedQuery;
      if (selectedFilter !== 'all') params.relationship = selectedFilter;

      const response = await contactService.getContacts(params);
      setContacts(response.contacts);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [debouncedQuery, selectedFilter]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadContacts);
    return unsubscribe;
  }, [navigation, loadContacts]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadContacts();
  };

  const handleDeleteContact = (contact: Contact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await contactService.deleteContact(contact._id);
              setContacts((prev) => prev.filter((c) => c._id !== contact._id));
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete contact');
            }
          },
        },
      ]
    );
  };

  const renderContactItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.contactCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ContactDetails', { contactId: item._id })}
      onLongPress={() => handleDeleteContact(item)}
    >
      <View style={[styles.avatar, { backgroundColor: avatarColor(item.name) }]}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactDetails}>
          {RELATIONSHIP_LABELS[item.relationship] || 'Other'} · 🎂 {format(parseISO(item.nextBirthday), 'MMM d')}
        </Text>
      </View>
      <Ionicons
        name={item.notificationSettings.enableNotification ? 'notifications' : 'notifications-off-outline'}
        size={20}
        color={item.notificationSettings.enableNotification ? colors.primary : colors.textMuted}
      />
    </TouchableOpacity>
  );

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'family', label: 'Family' },
    { key: 'friend', label: 'Friends' },
    { key: 'colleague', label: 'Colleagues' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contacts</Text>
        <Text style={styles.headerSubtitle}>
          {contacts.length} contact{contacts.length === 1 ? '' : 's'}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter.key && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item._id}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyText}>No contacts found</Text>
              <Text style={styles.emptySubtext}>
                {debouncedQuery ? 'Try a different search' : 'Add your first contact to get started'}
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddContact')}
      >
        <Ionicons name="add" size={30} color={colors.textOnPrimary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textOnPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  searchContainer: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    ...shadows.card,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.textOnPrimary,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 96,
  },
  contactCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm + 4,
    ...shadows.card,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  contactDetails: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm + 4,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 58,
    height: 58,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.raised,
  },
});
