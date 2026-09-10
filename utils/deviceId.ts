import AsyncStorage from "@react-native-async-storage/async-storage";

const DEVICE_ID_KEY = "mama_meadow_device_id";

export async function getOrCreateDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = "device_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    console.log("[DeviceId] Created new device_id:", id);
  } else {
    console.log("[DeviceId] Loaded existing device_id:", id);
  }
  return id;
}
