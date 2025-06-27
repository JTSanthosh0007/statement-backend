import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import * as Contacts from 'expo-contacts';

export default function AppPermissions() {
  useEffect(() => {
    requestAllPermissions();
  }, []);

  const requestAllPermissions = async () => {
    try {
      // File Storage
      const { status: storageStatus } = await MediaLibrary.requestPermissionsAsync();
      // Contacts
      const { status: contactStatus } = await Contacts.requestPermissionsAsync();

      handlePermission(storageStatus, 'Storage');
      handlePermission(contactStatus, 'Contacts');
    } catch (err) {
      console.warn(err);
    }
  };

  const handlePermission = (status, name) => {
    if (status === 'granted') {
      console.log(`${name} permission granted`);
    } else {
      Alert.alert(
        `${name} Permission Required`,
        `Please enable ${name} permission from settings.`
      );
    }
  };

  return null;
} 