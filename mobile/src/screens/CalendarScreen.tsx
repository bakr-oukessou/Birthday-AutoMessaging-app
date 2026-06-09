import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { format } from 'date-fns';
import { contactService, CalendarData } from '../services';
import { colors, spacing, radius, shadows, avatarColor } from '../theme';

interface CalendarScreenProps {
  navigation: any;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ navigation }) => {
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Load the whole year at once so swiping months is instant
  const loadCalendarData = useCallback(async () => {
    try {
      const data = await contactService.getBirthdayCalendar(currentYear);
      setCalendarData(data);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentYear]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadCalendarData);
    return unsubscribe;
  }, [navigation, loadCalendarData]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    Object.keys(calendarData).forEach((date) => {
      marks[date] = { marked: true, dotColor: colors.primary };
    });
    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: colors.primary,
      };
    }
    return marks;
  }, [calendarData, selectedDate]);

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const onMonthChange = (month: DateData) => {
    if (month.year !== currentYear) {
      setCurrentYear(month.year);
    }
    setSelectedDate(null);
  };

  const birthdaysForSelectedDate = (selectedDate && calendarData[selectedDate]) || [];

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
        <Text style={styles.headerTitle}>Birthday Calendar</Text>
        <Text style={styles.headerSubtitle}>Tap a date to see birthdays</Text>
      </View>

      <Calendar
        style={styles.calendar}
        theme={{
          backgroundColor: colors.card,
          calendarBackground: colors.card,
          textSectionTitleColor: colors.primary,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: colors.textOnPrimary,
          todayTextColor: colors.primary,
          dayTextColor: colors.textPrimary,
          textDisabledColor: colors.border,
          dotColor: colors.primary,
          selectedDotColor: colors.textOnPrimary,
          arrowColor: colors.primary,
          monthTextColor: colors.textPrimary,
          indicatorColor: colors.primary,
          textDayFontWeight: '400',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
        markedDates={markedDates}
        onDayPress={onDayPress}
        onMonthChange={onMonthChange}
        enableSwipeMonths={true}
      />

      <ScrollView style={styles.birthdayList} contentContainerStyle={styles.birthdayListContent}>
        {selectedDate ? (
          <>
            <Text style={styles.selectedDateTitle}>
              {format(new Date(`${selectedDate}T00:00:00`), 'MMMM d, yyyy')}
            </Text>
            {birthdaysForSelectedDate.length > 0 ? (
              birthdaysForSelectedDate.map((birthday) => (
                <TouchableOpacity
                  key={birthday.id}
                  style={styles.birthdayCard}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('ContactDetails', { contactId: birthday.id })}
                >
                  <View style={[styles.avatar, { backgroundColor: avatarColor(birthday.name) }]}>
                    <Text style={styles.avatarText}>{birthday.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.birthdayInfo}>
                    <Text style={styles.birthdayName}>{birthday.name}</Text>
                    <Text style={styles.birthdayAge}>Turning {birthday.turningAge}</Text>
                  </View>
                  <Text style={styles.birthdayEmoji}>🎂</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noBirthdays}>
                <Text style={styles.noBirthdaysText}>No birthdays on this date</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.noBirthdays}>
            <Text style={styles.noBirthdaysEmoji}>📅</Text>
            <Text style={styles.noBirthdaysText}>Select a date to see birthdays</Text>
          </View>
        )}
      </ScrollView>
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
  calendar: {
    borderRadius: radius.lg,
    margin: spacing.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  birthdayList: {
    flex: 1,
  },
  birthdayListContent: {
    padding: spacing.md,
    paddingTop: 0,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm + 4,
  },
  birthdayCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textOnPrimary,
  },
  birthdayInfo: {
    flex: 1,
  },
  birthdayName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  birthdayAge: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  birthdayEmoji: {
    fontSize: 24,
  },
  noBirthdays: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noBirthdaysEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  noBirthdaysText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
