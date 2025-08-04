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
} from 'react-native';
// import { BluetoothEscposPrinter } from 'react-native-bluetooth-escpos-printer';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
// import { BACKEND_URL } from '@env';

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
  // const BACKEND_URL = process.env.BACKEND_URL;
  const BACKEND_URL="https://receipt-system-zf7s.onrender.com";
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
  const [address, setAddress] = useState("null");

  const paymentMethods = ['Cash', 'GPay', 'PhonePe', 'Paytm', 'Other'];

  useEffect(() => {
    if (customerId) fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      const { data } = await axios.get(
        `${BACKEND_URL}/api/customer/${customerId}`,
      );
      console.log(data.customer);
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
              const { whatsappLink, smsLink } = generateReceipt(customer?.name, amountPaid, paymentMethod, date, time, newBalance);
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
    newBalance: string
  ) => {
    const receipt = `

      Fastway Cable Network
Complaint No : 9356216091

******************************
                 RECEIPT
******************************
Name        : ${name}
Date        : ${date}
Time        : ${time}
Address     : ${address}

Amount Paid : ₹${amount}
Method      : ${method}

******************************
Current Outstanding : ₹${newBalance}
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

  const totalBalance =
    customer.previousBalance + customer.currentMonthPayment;



  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
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

      {showReceipt && (
        <View style={styles.overlay}>
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
            <ScrollView style={styles.receiptBox}>
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
  // overlay: {
  //   position: 'absolute',
  //   top: 0,
  //   left: 0,
  //   right: 0,
  //   bottom: 0,
  //   backgroundColor: 'rgba(0,0,0,0.5)',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   zIndex: 1000,
  // },
  // receiptContainer: {
  //   width: '90%',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   maxHeight: '80%',
  //   backgroundColor: '#fff',
  //   borderRadius: 12,
  //   padding: 20,
  //   elevation: 6,
  //   shadowColor: '#000',
  //   shadowOpacity: 0.2,
  //   shadowRadius: 6,
  //   shadowOffset: { width: 0, height: 2 },
  // },
  // receiptHeader: {
  //   fontSize: 18,
  //   fontWeight: 'bold',
  //   textAlign: 'center',
  //   marginBottom: 10,
  // },
  // receiptBox: {
  //   maxHeight: '80%',
  //   padding: 10,
  // },
  // receiptText: {
  //   fontFamily: 'monospace',
  //   fontSize: 14,
  //   color: '#333',
  // },
  closeReceiptBtn: {
    backgroundColor: '#1A73E8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
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
    width: '90%',
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
    maxHeight: 250,
    marginBottom: 16,
  },

  receiptText: {
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 22,
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