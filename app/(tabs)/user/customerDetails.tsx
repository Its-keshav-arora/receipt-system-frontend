import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { formatDate } from '@/utils/formatDate';

type Payment = {
  date: string;
  time: string;
  amount: number;
  method: string;
};

type Customer = {
  _id: string;
  name: string;
  mobile: string;
  address?: string;
  boxNumbers: string[];
  previousBalance: number;
  currentMonthPayment: number;
  history: Payment[];
};

const CustomerDetail = () => {
  const BACKEND_URL = 'https://receipt-system-zf7s.onrender.com';
    // const BACKEND_URL="http://172.20.10.3:5000";

  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBox, setNewBox] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (customerId) fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const { data } = await axios.get(
        `${BACKEND_URL}/api/customer/${customerId}`
      );

      setCustomer(data.customer);
    } catch (err) {
      Alert.alert('Error', 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const saveCustomer = async () => {
    if (!customer) return;
    setSaving(true);
    try {
      await axios.put(`${BACKEND_URL}/api/customer/${customerId}`, customer);
      Alert.alert('Success', 'Customer updated');
    } catch {
      Alert.alert('Error', 'Could not update customer');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBox = async () => {
    if (!newBox.trim()) return;
    try {
      setCustomer((prev) =>
        prev
          ? { ...prev, boxNumbers: [...prev.boxNumbers, newBox.trim()] }
          : prev
      );
      setNewBox('');
    } catch {
      Alert.alert('Error', 'Box could not be added');
    }
  };

  const handleDeleteBox = async (boxNumber: string) => {
    Alert.alert('Confirm', `Delete box ${boxNumber}?`, [
      {
        text: 'Delete',
        onPress: async () => {
          try {
            setCustomer((prev) =>
              prev
                ? {
                  ...prev,
                  boxNumbers: prev.boxNumbers.filter((b) => b !== boxNumber),
                }
                : prev
            );
          } catch {
            Alert.alert('Error', 'Failed to delete box');
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleDeleteCustomer = (customerId: string) => {
    Alert.alert('Confirm Deletion', 'Are you sure you want to delete this customer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${BACKEND_URL}/api/customer/delete/${customerId}`);
            Alert.alert('Success', 'Customer deleted successfully');
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete customer');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  if (!customer) return null;

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.heading}>Customer Details</Text>
          <TouchableOpacity onPress={() => handleDeleteCustomer(customerId)} style={styles.deleteBtn}>
            <Image source={require('@/assets/icons/delete_button.png')} style={styles.icon} />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={customer.name}
          onChangeText={(text) => setCustomer({ ...customer, name: text })}
        />

        <Text style={styles.label}>Mobile</Text>
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          value={customer.mobile}
          onChangeText={(text) => setCustomer({ ...customer, mobile: text })}
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline
          value={customer.address || ''}
          onChangeText={(text) => setCustomer({ ...customer, address: text })}
        />

        {/* Boxes */}
        <Text style={[styles.subheading, { marginTop: 20 }]}>Boxes</Text>
        {customer.boxNumbers.map((box) => (
          <View key={box} style={styles.boxItem}>
            <Text style={styles.boxText}>{box}</Text>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteBox(box)}>
              <Text style={styles.deleteTxt}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.addBoxRow}>
          <TextInput
            placeholder="Add new box"
            style={[styles.input, { flex: 1 }]}
            value={newBox}
            onChangeText={setNewBox}
          />
          <TouchableOpacity onPress={handleAddBox} style={styles.addBtn}>
            <Text style={styles.addTxt}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Payments */}
        <Text style={styles.subheading}>Payments</Text>
        <Text style={styles.paymentText}>Previous Balance: ₹{customer.previousBalance}</Text>
        <Text style={styles.paymentText}>Current Month: ₹{customer.currentMonthPayment}</Text>
        <Text style={styles.paymentText}>
          Total Balance ₹{customer.currentMonthPayment + customer.previousBalance}
        </Text>

        {/* History Button */}
        <TouchableOpacity
          style={[styles.payBtn, { marginTop: 12, backgroundColor: '#F9AB00' }]}
          onPress={() => setShowHistory(!showHistory)}
        >
          <Text style={styles.payTxt}>
            {showHistory ? 'Hide History' : 'Show History'}
          </Text>
        </TouchableOpacity>

        {/* History Section */}
        {showHistory && (
          <View style={styles.historyContainer}>
            {customer.history.length === 0 ? (
              <Text style={styles.noHistoryText}>No payment history available.</Text>
            ) : (
              [...customer.history].reverse().map((entry, index) => (
                <View key={index} style={styles.historyItem}>
                  <Text style={styles.historyText}>
                    ₹{entry.amount} on {formatDate(entry.date)} at {entry.time} via {entry.method}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity onPress={saveCustomer} style={styles.saveBtn}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveTxt}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default CustomerDetail;

// ,paddingTop : 80,
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F4F6F8', position: 'relative',paddingTop : 60, },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  subheading: { fontSize: 18, fontWeight: '600', marginVertical: 12 },
  label: { fontSize: 14, marginTop: 12, color: '#333' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    fontSize: 16,
  },
  boxItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 4,
    paddingRight: 0,
    marginTop: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  boxText: { flex: 1, fontSize: 16 },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#EA4335',
    borderRadius: 12,
  },
  deleteTxt: { color: '#fff', fontWeight: 'bold' },
  addBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  addBtn: {
    backgroundColor: '#1A73E8',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addTxt: { color: '#fff', fontWeight: '600' },
  paymentText: { fontSize: 16, marginVertical: 4 },
  saveBtn: {
    marginTop: 24,
    backgroundColor: '#1A73E8',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveTxt: { color: '#fff', fontWeight: '600', fontSize: 16 },
  payBtn: {
    marginTop: 14,
    backgroundColor: '#34A853',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  payTxt: { color: '#fff', fontWeight: '600', fontSize: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },

  // History styles
  historyContainer: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  historyText: {
    fontSize: 15,
    color: '#333',
  },
  noHistoryText: {
    fontSize: 15,
    color: '#888',
    fontStyle: 'italic',
  },
});
