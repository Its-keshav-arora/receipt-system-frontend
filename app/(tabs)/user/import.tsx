import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import XLSX from 'xlsx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToken } from '@/utils/authContext';
// import { BACKEND_URL } from '@env';

interface CustomerRow {
    name?: string;
    box?: string;
    mobile?: string;
    balance?: number;
    curr?: number;
    address?: string;
}

const ImportPage = () => {
    // const BACKEND_URL = process.env.BACKEND_URL;
    const BACKEND_URL="https://receipt-system-zf7s.onrender.com";
    // const BACKEND_URL = "http://172.20.10.3:5000";
    const [fileData, setFileData] = useState<CustomerRow[] | null>(null);
    const {token} = useToken();

    const handleUploadToBackend = async () => {
        const token = await AsyncStorage.getItem("token");
        console.log("this is the token while uploading : ", token);
        if (!fileData) {
            Alert.alert("Error", "No file data to upload");
            return;
        }

        console.log("This is the file data");
        console.log(fileData);
        console.log("url " , `${BACKEND_URL}/api/import`);

        try {
            const res = await fetch(`${BACKEND_URL}/api/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ customers: fileData }),
            });
            console.log("this is the response : " , res);

            const result = await res.json();

            if (!res.ok) throw new Error(result.message || 'Upload failed');

            Alert.alert("✅ Upload Success", result.message || "Data saved");
            setFileData(null); // Clear data on success
        } catch (error: any) {
            console.error("Upload error:", error);
            Alert.alert("❌ Upload Failed", error.message || "Something went wrong");
        }
    };

    const handleFilePick = async () => {
        try {
            const res = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel',
                ],
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (!res.canceled && res.assets && res.assets.length > 0) {
                const file = res.assets[0];

                const response = await fetch(file.uri);
                const blob = await response.blob();

                const reader = new FileReader();

                reader.onload = (e: ProgressEvent<FileReader>) => {
                    const arrayBuffer = e.target?.result;
                    if (!arrayBuffer) {
                        Alert.alert("Error", "Failed to read file buffer.");
                        return;
                    }

                    try {
                        const data = new Uint8Array(arrayBuffer as ArrayBuffer);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const json: CustomerRow[] = XLSX.utils.sheet_to_json<CustomerRow>(worksheet, { defval: '' });
                        setFileData(json);
                        Alert.alert("✅ Success", "Excel file loaded successfully!");
                    } catch (parseError) {
                        console.error(parseError);
                        Alert.alert("Error", "Failed to parse Excel file.");
                    }
                };

                reader.readAsArrayBuffer(blob);
            } else {
                Alert.alert("Cancelled", "File selection was cancelled.");
            }
        } catch (error) {
            console.error("File pick error:", error);
            Alert.alert("Error", "Could not read the Excel file.");
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>📥 Import Excel Sheet</Text>

            <TouchableOpacity style={styles.uploadButton} onPress={handleFilePick}>
                <Text style={styles.uploadText}>📁 Upload Excel File</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: 'green', marginBottom: 10 }]}
                onPress={handleUploadToBackend}
            >
                <Text style={styles.uploadText}>Submit</Text>
            </TouchableOpacity>

            <View style={styles.previewContainer}>
                <Text style={styles.previewTitle}>📄 Expected Format:</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator>
                    <View>
                        <View style={styles.tableHeader}>
                            <Text style={styles.cell}>Name</Text>
                            <Text style={styles.cell}>Customer Box</Text>
                            <Text style={styles.cell}>Mobile</Text>
                            <Text style={styles.cell}>Address</Text>
                            <Text style={styles.cell}>Balance</Text>
                            <Text style={styles.cell}>This Month</Text>
                        </View>

                        {fileData && fileData.map((row, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={styles.cell}>{row.name}</Text>
                                <Text style={styles.cell}>{row['box']}</Text>
                                <Text style={styles.cell}>{row['mobile']}</Text>
                                <Text style={styles.cell}>{row.address}</Text>
                                <Text style={styles.cell}>{row.balance}</Text>
                                <Text style={styles.cell}>{row['curr']}</Text>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>

        </ScrollView>
    );
};

export default ImportPage;

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f2f2f2',
        flexGrow: 1,
        alignItems: 'center',
        paddingTop:60,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        // marginVertical: 20,
        marginBottom : 40,
    },
    uploadButton: {
        backgroundColor: '#4C8EF7',
        padding: 14,
        borderRadius: 10,
        marginBottom: 25,
        width: '100%',
        alignItems: 'center',
    },
    uploadText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    previewContainer: {
        backgroundColor: '#fff',
        width: '100%',
        padding: 12,
        borderRadius: 8,
        elevation: 2,
    },
    previewTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#000',
        backgroundColor: '#e0e0e0',
    },
    tableRow: {
        flexDirection: 'row',
        borderLeftWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#000',
    },
    cell: {
        width: 100,
        fontSize: 12,
        borderRightWidth:1,
        borderRightColor:"#000",
        textAlign: "center",
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
});

// export default ImportPage;
