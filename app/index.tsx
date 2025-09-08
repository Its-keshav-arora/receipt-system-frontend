import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const BACKEND_URL = "https://receipt-system-zf7s.onrender.com"; // replace with your actual IP
  // const BACKEND_URL="http://172.20.10.2:5000";
  
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email || !pass) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    const url = `${BACKEND_URL}/api/auth/login`;
    const body = { email, password: pass };
    console.log(url);
    console.log(body);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log("data : ", data);
      await AsyncStorage.setItem("token", data.token); 
      await AsyncStorage.setItem('name', data.user.name);
      await AsyncStorage.setItem('mobile', data.user.mobile);

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      router.replace("/home");
    } catch (error: any) {
      Alert.alert("Validation", "Wrong email or password")
      // Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome 👋</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      {/* Email Input */}
      <View style={styles.inputGroup}>
        <Feather name="mail" size={20} color="gray" />
        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Password Input */}
      <View style={styles.inputGroup}>
        <Feather name="lock" size={20} color="gray" />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={pass}
          onChangeText={setPass}
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32, // Equivalent to px-8
  },
  title: {
    fontSize: 32, // text-4xl
    fontWeight: "bold",
    color: "#4F46E5", // text-indigo-700
    marginBottom: 8, // mb-2
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280", // text-gray-500
    marginBottom: 32, // mb-8
  },
  inputGroup: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderColor: "#D1D5DB", // border-gray-300
    paddingBottom: 8, // pb-2
    marginBottom: 24, // mb-6 or mb-8
  },
  input: {
    marginLeft: 8, // ml-2
    flex: 1,
    fontSize: 16, // text-base
    color: "#000000",
  },
  button: {
    backgroundColor: "#4F46E5", // bg-indigo-600
    width: "100%",
    paddingVertical: 12, // py-3
    borderRadius: 16, // rounded-xl
    marginBottom: 16, // mb-4
  },
  buttonText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
});
