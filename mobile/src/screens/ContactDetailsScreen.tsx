import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { contactService, Contact } from '../services';

interface ContactDetailsScreenProps {
  navigation: any;
  route: any;
}

export const ContactDetailsScreen: React.FC<ContactDetailsScreenProps> = ({ navigation, route }) => {
  const contactId = route?.params?.contactId as string | undefined;
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadContact = async () => {
      if (!contactId) {
        Alert.alert('Error', 'Missing contact id');
        navigation.goBack();
        return;
      }

      try {
        const data = await contactService.getContact(contactId);
        if (isMounted) setContact(data);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to load contact');
        navigation.goBack();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadContact();
    return () => {
      isMounted = false;
    };
  }, [contactId, navigation]);

  const handleDelete = () => {
    if (!contact) return;

    Alert.alert('Delete Contact', `Delete ${contact.name}?`, [
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  if (!contact) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>Contact not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.name}>{contact.name}</Text>
        <Text style={styles.subText}>Relationship: {contact.relationship}</Text>
        <Text style={styles.subText}>Age: {contact.age}</Text>
        <Text style={styles.subText}>Next Birthday: {new Date(contact.nextBirthday).toDateString()}</Text>
        <Text style={styles.subText}>
          Birthday message sent: {contact.birthdayMessageSent ? 'Yes' : 'No'}
        </Text>
        {contact.lastBirthdayMessage?.sentAt ? (
          <Text style={styles.subText}>
            Last sent: {new Date(contact.lastBirthdayMessage.sentAt).toDateString()} ({contact.lastBirthdayMessage.channel})
          </Text>
        ) : null}
        {contact.phone ? <Text style={styles.subText}>Phone: {contact.phone}</Text> : null}
        {contact.email ? <Text style={styles.subText}>Email: {contact.email}</Text> : null}
        {contact.notes ? <Text style={styles.notes}>Notes: {contact.notes}</Text> : null}
      </View>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('AddContact', { contactId: contact._id })}
      >
        <Text style={styles.editText}>Edit Contact</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteText}>Delete Contact</Text>
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
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 6,
  },
  notes: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  deleteButton: {
    marginTop: 16,
    backgroundColor: '#e74c3c',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButton: {
    marginTop: 16,
    backgroundColor: '#667eea',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  editText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
