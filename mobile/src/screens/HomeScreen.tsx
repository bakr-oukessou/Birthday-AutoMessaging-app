import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { contactService, Contact, UpcomingBirthday } from '../services';
import { useAuth } from '../context';
import { colors, spacing, radius, shadows, avatarColor, daysUntilColor } from '../theme';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<UpcomingBirthday[]>([]);
  const [todaysBirthdays, setTodaysBirthdays] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [upcoming, today] = await Promise.all([
        contactService.getUpcomingBirthdays(30),
        contactService.getTodaysBirthdays(),
      ]);
      setUpcomingBirthdays(upcoming);
      setTodaysBirthdays(today.birthdays);
      setLoadError(null);
    } catch (error: any) {
      setLoadError(error.message || 'Failed to load birthdays');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const getDaysUntilText = (daysUntil: number) => {
    if (daysUntil === 1) return 'Tomorrow';
    return `In ${daysUntil} days`;
  };

  const renderBirthdayItem = ({ item }: { item: UpcomingBirthday }) => (
    <TouchableOpacity
      style={styles.birthdayCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ContactDetails', { contactId: item.contact._id })}
    >
      <View style={[styles.avatar, { backgroundColor: avatarColor(item.contact.name) }]}>
        <Text style={styles.avatarText}>{item.contact.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.birthdayInfo}>
        <Text style={styles.contactName}>{item.contact.name}</Text>
        <Text style={styles.birthdayDate}>
          {format(parseISO(item.nextBirthday), 'MMMM d')} · Turning {item.turningAge}
        </Text>
      </View>
      <View style={[styles.daysUntilBadge, { backgroundColor: daysUntilColor(item.daysUntil) }]}>
        <Text style={styles.daysUntilText}>{getDaysUntilText(item.daysUntil)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {loadError ? (
        <TouchableOpacity style={styles.errorBanner} onPress={loadData}>
          <Ionicons name="cloud-offline-outline" size={18} color={colors.danger} />
          <Text style={styles.errorText}>{loadError} — tap to retry</Text>
        </TouchableOpacity>
      ) : null}

      {todaysBirthdays.length > 0 && (
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>🎂 Today's Birthdays</Text>
          {todaysBirthdays.map((contact) => (
            <TouchableOpacity
              key={contact._id}
              style={styles.todayCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ContactDetails', { contactId: contact._id })}
            >
              <Text style={styles.todayEmoji}>🎉</Text>
              <View style={styles.todayInfo}>
                <Text style={styles.todayName}>{contact.name}</Text>
                <Text style={styles.todayAge}>Turning {contact.age} today</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textOnPrimary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={[styles.sectionTitle, styles.upcomingTitle]}>📅 Upcoming Birthdays</Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'Friend'}! 👋</Text>
        <Text style={styles.subtitle}>
          {todaysBirthdays.length > 0
            ? `${todaysBirthdays.length} birthday${todaysBirthdays.length > 1 ? 's' : ''} today!`
            : 'No birthdays today'}
        </Text>
      </View>

      <FlatList
        data={upcomingBirthdays.filter((b) => b.daysUntil > 0)}
        renderItem={renderBirthdayItem}
        keyExtractor={(item) => item.contact._id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No upcoming birthdays</Text>
            <Text style={styles.emptySubtext}>Add contacts to see their birthdays here</Text>
          </View>
        }
      />

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
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    paddingTop: 60,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textOnPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 14,
  },
  todaySection: {
    paddingTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm + 4,
  },
  upcomingTitle: {
    marginTop: spacing.md,
  },
  todayCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  todayEmoji: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  todayInfo: {
    flex: 1,
  },
  todayName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  todayAge: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
    paddingBottom: 96,
  },
  birthdayCard: {
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
  birthdayInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  birthdayDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  daysUntilBadge: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  daysUntilText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textOnPrimary,
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
