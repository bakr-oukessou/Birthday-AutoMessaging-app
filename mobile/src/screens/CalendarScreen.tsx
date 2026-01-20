import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { format } from 'date-fns';
import { contactService, CalendarData } from '../services';

interface CalendarScreenProps {
  navigation: any;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ navigation }) => {
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadCalendarData();
  }, [currentMonth]);

  const loadCalendarData = async () => {
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const data = await contactService.getBirthdayCalendar(year, month);
      setCalendarData(data);
      
      // Create marked dates for the calendar
      const marks: any = {};
      Object.keys(data).forEach((date) => {
        marks[date] = {
          marked: true,
          dotColor: '#667eea',
          selectedColor: '#667eea',
        };
      });
      setMarkedDates(marks);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    
    // Update marked dates to show selection
    const newMarkedDates = { ...markedDates };
    Object.keys(newMarkedDates).forEach((date) => {
      newMarkedDates[date] = {
        ...newMarkedDates[date],
        selected: date === day.dateString,
      };
    });
    
    if (!newMarkedDates[day.dateString]) {
      newMarkedDates[day.dateString] = { selected: true, selectedColor: '#667eea' };
    } else {
      newMarkedDates[day.dateString].selected = true;
      newMarkedDates[day.dateString].selectedColor = '#667eea';
    }
    
    setMarkedDates(newMarkedDates);
  };

  const onMonthChange = (month: DateData) => {
    setCurrentMonth(new Date(month.year, month.month - 1, 1));
    setSelectedDate(null);
  };

  const getBirthdaysForDate = () => {
    if (!selectedDate || !calendarData[selectedDate]) {
      return [];
    }
    return calendarData[selectedDate];
  };

  const birthdaysForSelectedDate = getBirthdaysForDate();

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
        <Text style={styles.headerTitle}>Birthday Calendar</Text>
        <Text style={styles.headerSubtitle}>
          Tap a date to see birthdays
        </Text>
      </View>

      <Calendar
        style={styles.calendar}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#667eea',
          selectedDayBackgroundColor: '#667eea',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#667eea',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#667eea',
          selectedDotColor: '#ffffff',
          arrowColor: '#667eea',
          monthTextColor: '#333',
          indicatorColor: '#667eea',
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

      <View style={styles.birthdayList}>
        {selectedDate ? (
          <>
            <Text style={styles.selectedDateTitle}>
              {format(new Date(selectedDate), 'MMMM d, yyyy')}
            </Text>
            {birthdaysForSelectedDate.length > 0 ? (
              birthdaysForSelectedDate.map((birthday) => (
                <View key={birthday.id} style={styles.birthdayCard}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                      {birthday.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.birthdayInfo}>
                    <Text style={styles.birthdayName}>{birthday.name}</Text>
                    <Text style={styles.birthdayAge}>
                      Turning {birthday.turningAge}
                    </Text>
                  </View>
                  <Text style={styles.birthdayEmoji}>🎂</Text>
                </View>
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
      </View>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  calendar: {
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  birthdayList: {
    flex: 1,
    padding: 16,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  birthdayCard: {
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
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  birthdayInfo: {
    flex: 1,
  },
  birthdayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  birthdayAge: {
    fontSize: 14,
    color: '#666',
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
    marginBottom: 8,
  },
  noBirthdaysText: {
    fontSize: 16,
    color: '#666',
  },
});
