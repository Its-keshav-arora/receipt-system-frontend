import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToken } from '../utils/authContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
// import {BACKEND_URL} from "@env";

const HomePage = () => {
  const router = useRouter();
  // const BACKEND_URL = process.env.BACKEND_URL;
  const BACKEND_URL = "https://receipt-system-zf7s.onrender.com";

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      Alert.alert("Logged Out", "You have been logged out.");
      router.replace('/');
    } catch (err) {
      console.error("Logout error:", err);
      Alert.alert("Error", "Something went wrong while logging out.");
    }
  };

  const handleExportExcel = async () => {
    Alert.alert(
      'Confirm Download',
      'Do you want to export customer data as an Excel file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              const downloadUrl = `${BACKEND_URL}/api/customer/export`;
              const fileUri = FileSystem.documentDirectory + 'CustomerReport.csv';

              const { uri } = await FileSystem.downloadAsync(
                downloadUrl,
                fileUri,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
              } else {
                Alert.alert('Success', 'File downloaded to ' + uri);
              }
            } catch (error) {
              console.error('Download error:', error);
              Alert.alert('Error', 'Failed to export file.');
            }
          },
        },
      ]
    );
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Dashboard</Text>
      <View style={styles.menuBox}>
        <TouchableOpacity style={styles.option} onPress={() => router.push('/(tabs)/user/customers')}>
          <Text style={styles.icon}>📊</Text>
          <Text style={styles.text}>View Customers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.option}
          onPress={handleExportExcel}
        >
          <Image source={require('@/assets/icons/excel_icon.jpg')} style={styles.icon} />
          <Text style={styles.text}>Export Excel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => router.push('/(tabs)/user/import')}>
          <Image source={require('@/assets/icons/excel_icon.jpg')} style={styles.icon} />
          <Text style={styles.text}>Import Excel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => router.push('/(tabs)/user/collectionHistory')}>
          {/* <Image source={require('@/assets/icons/history_icon.png')} style={styles.icon} /> */}
          <Text style={styles.text}>📅 Collection Insights</Text>
        </TouchableOpacity>


        <TouchableOpacity style={styles.option} onPress={() => router.push('/(tabs)/user/addCustomer')}>
          <Text style={styles.icon}>➕</Text>
          <Text style={styles.text}>Add Customer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.option, styles.logout]} onPress={handleLogout}>
          <Text style={styles.icon}>🚪</Text>
          <Text style={styles.text}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  menuBox: {
    height: '40%',
    justifyContent: 'space-evenly',
    width: '85%',
  },
  option: {
    backgroundColor: '#4C8EF7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 8,
    elevation: 2,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  logout: {
    backgroundColor: '#FF4C4C',
  },
});


export default HomePage;
