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
import { format, differenceInDays, parseISO } from 'date-fns';
import { contactService, UpcomingBirthday } from '../services';
import { useAuth } from '../context';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<UpcomingBirthday[]>([]);
  const [todaysBirthdays, setTodaysBirthdays] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [upcoming, today] = await Promise.all([
        contactService.getUpcomingBirthdays(30),
        contactService.getTodaysBirthdays(),
      ]);
      setUpcomingBirthdays(upcoming);
      setTodaysBirthdays(today.birthdays);
    } catch (error) {
      console.error('Failed to load birthdays:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const getDaysUntilText = (daysUntil: number) => {
    if (daysUntil === 0) return 'Today! 🎉';
    if (daysUntil === 1) return 'Tomorrow';
    return `In ${daysUntil} days`;
  };

  const getDaysUntilColor = (daysUntil: number) => {
    if (daysUntil === 0) return '#e74c3c';
    if (daysUntil <= 3) return '#f39c12';
    if (daysUntil <= 7) return '#3498db';
    return '#95a5a6';
  };

  const renderBirthdayItem = ({ item }: { item: UpcomingBirthday }) => (
    <TouchableOpacity
      style={styles.birthdayCard}
      onPress={() => navigation.navigate('ContactDetails', { contactId: item.contact._id })}
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {item.contact.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.birthdayInfo}>
        <Text style={styles.contactName}>{item.contact.name}</Text>
        <Text style={styles.birthdayDate}>
          {format(parseISO(item.nextBirthday), 'MMMM d')} • Turning {item.turningAge}
        </Text>
      </View>
      <View style={[styles.daysUntilBadge, { backgroundColor: getDaysUntilColor(item.daysUntil) }]}>
        <Text style={styles.daysUntilText}>{getDaysUntilText(item.daysUntil)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
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

      {todaysBirthdays.length > 0 && (
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>🎂 Today's Birthdays</Text>
          {todaysBirthdays.map((contact) => (
            <TouchableOpacity
              key={contact._id}
              style={styles.todayCard}
              onPress={() => navigation.navigate('ContactDetails', { contactId: contact._id })}
            >
              <Text style={styles.todayEmoji}>🎉</Text>
              <Text style={styles.todayName}>{contact.name}</Text>
              <Text style={styles.todayAge}>Turning {contact.age + 1}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.upcomingSection}>
        <Text style={styles.sectionTitle}>📅 Upcoming Birthdays</Text>
        <FlatList
          data={upcomingBirthdays.filter((b) => b.daysUntil > 0)}
          renderItem={renderBirthdayItem}
          keyExtractor={(item) => item.contact._id}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
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
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddContact')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#667eea',
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  todaySection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  todayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  todayEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  todayName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  todayAge: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '500',
  },
  upcomingSection: {
    flex: 1,
    padding: 16,
    paddingTop: 8,
  },
  listContent: {
    paddingBottom: 80,
  },
  birthdayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  birthdayInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  birthdayDate: {
    fontSize: 14,
    color: '#666',
  },
  daysUntilBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  daysUntilText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
});
