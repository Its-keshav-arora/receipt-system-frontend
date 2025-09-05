import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';

type Customer = {
  _id: string;
  name: string;
  mobile: string;
  address: string;
  boxNumbers: string[];
  previousBalance: number;
  currentMonthPayment: number;
};

const Payment = () => {
  const BACKEND_URL = "https://receipt-system-zf7s.onrender.com";
  // const BACKEND_URL="http://172.20.10.2:5000";

  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [waLink, setWaLink] = useState("");
  const [smsLink, setSmsLink] = useState("");
  const [receiptText, setReceiptText] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);

  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [address, setAddress] = useState("");

  const paymentMethods = ['Cash', 'GPay', 'PhonePe', 'Paytm', 'Other'];

  useEffect(() => {
    if (customerId) fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/customer/${customerId}`);
      setCustomer(data.customer);
      setAddress(data.customer.address);
    } catch (err) {
      Alert.alert('Error', 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (!amountPaid || isNaN(Number(amountPaid)) || Number(amountPaid) <= 0) {
      return Alert.alert('Validation', 'Please enter a valid amount');
    }

    Alert.alert(
      'Confirm Payment',
      `Pay ₹${amountPaid} via ${paymentMethod}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setPaying(true);

              const response = await axios.post(`${BACKEND_URL}/api/receipt`, {
                customerId,
                amountPaid: Number(amountPaid),
                paymentMethod,
              });

              const { newBalance, date, time } = response.data;
              console.log("This is customer : ", customer);

              const { whatsappLink, smsLink } = generateReceipt(
                customer?.name,
                amountPaid,
                paymentMethod,
                date,
                time,
                String(newBalance),
                // customer?.address,
                customer?.boxNumbers // <-- pass array here
              );
              setWaLink(whatsappLink);
              setSmsLink(smsLink);
              setShowReceipt(true);
            } catch (err) {
              Alert.alert('Error', 'Failed to record payment');
            } finally {
              setPaying(false);
            }
          },
        },
      ],
    );
  };

  const generateReceipt = (
    name: any,
    amount: string,
    method: string,
    date: string,
    time: string,
    newBalance: string,
    boxNumbers?: string[]
  ) => {
    const boxes = boxNumbers && boxNumbers.length > 0 ? boxNumbers.join(", ") : "N/A";
    const receipt = `

      FW / net+ Cable
Complaint No : 9217092170/7087570875

******************************
                 RECEIPT
******************************
Name        : ${name}
Date        : ${date}
Time        : ${time}
Address     : ${address}
Box/Id      : ${boxes}
Amount Paid : ₹${Number(amount).toFixed(2)}
Method      : ${method}

******************************
Current Outstanding : ₹${Number(newBalance).toFixed(2)}
******************************

             THANK YOU
  `;

    const encodedMessage = encodeURIComponent(receipt);
    const whatsappLink = `https://wa.me/91${customer?.mobile}?text=${encodedMessage}`;
    const smsLink = `sms:91${customer?.mobile}?body=${encodedMessage}`;
    setReceiptText(receipt);
    setShowReceipt(true);

    return { receipt, whatsappLink, smsLink };
  };

  if (loading || !customer) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  const totalBalance = customer.previousBalance + customer.currentMonthPayment;

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 160 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.heading}>Pay Bill</Text>

          <Label text="Name" />
          <TextInput style={styles.input} value={customer.name} editable={false} />

          <Label text="Mobile" />
          <TextInput style={styles.input} value={customer.mobile} editable={false} />

          <Label text="Address" />
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={customer.address || ''}
            editable={false}
            multiline
          />

          <Label text="Boxes" />
          <TextInput
            style={styles.input}
            value={customer.boxNumbers.join(', ')}
            editable={false}
          />

          <Label text="Total Balance" />
          <TextInput
            style={styles.input}
            value={`₹${totalBalance}`}
            editable={false}
          />

          <Label text="Amount Paid" />
          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            keyboardType="numeric"
            value={amountPaid}
            onChangeText={setAmountPaid}
          />

          <Label text="Payment Method" />
          <View style={styles.dropdown}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.dropdownOption,
                  paymentMethod === method && styles.selectedOption,
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text
                  style={[
                    styles.optionText,
                    paymentMethod === method && { color: '#fff' },
                  ]}
                >
                  {method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.payBtn}
            onPress={handlePayment}
            disabled={paying}
          >
            {paying ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payText}>Pay Bill</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {showReceipt && (
        <View style={styles.overlay}>
          {/* Make entire modal scrollable on small screens */}
          <ScrollView
            style={{ flex: 1, width: '100%' }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.receiptContainer}>
              {/* Close Button (✕) */}
              <TouchableOpacity
                onPress={() => setShowReceipt(false)}
                style={styles.closeIcon}
              >
                <Text style={{ fontSize: 20, color: '#000' }}>✕</Text>
              </TouchableOpacity>

              {/* Header */}
              <Text style={styles.receiptHeader}>🧾 Receipt Preview</Text>

              {/* Scrollable Receipt Text */}
              <ScrollView style={styles.receiptBox} keyboardShouldPersistTaps="handled">
                <Text style={styles.receiptText}>{receiptText}</Text>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => console.log("print")} style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>Print</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => Linking.openURL(waLink)} style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => Linking.openURL(smsLink)} style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>SMS</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
};

export default Payment;

const Label = ({ text }: { text: string }) => (
  <Text style={styles.label}>{text}</Text>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F4F6F8', position: 'relative', top: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    marginTop: 14,
    marginBottom: 4,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  dropdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  dropdownOption: {
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  selectedOption: {
    backgroundColor: '#1A73E8',
  },
  optionText: {
    fontSize: 14,
    color: '#000',
  },
  payBtn: {
    marginTop: 24,
    backgroundColor: '#1A73E8',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  payText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  // Overlay + Receipt Modal (now scroll-friendly)
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  receiptContainer: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    position: 'relative',
  },

  receiptHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },

  receiptBox: {
    maxHeight: 300,
    marginBottom: 16,
  },

  receiptText: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },

  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 6,
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  actionBtn: {
    flex: 1,
    backgroundColor: '#1A73E8',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },

  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
