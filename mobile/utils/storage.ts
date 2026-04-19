import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { User } from "@/types/domain";

const ACCESS_TOKEN_KEY = "faceme.accessToken";
const REFRESH_TOKEN_KEY = "faceme.refreshToken";
const LANGUAGE_KEY = "faceme.language";
const USER_SNAPSHOT_KEY = "faceme.userSnapshot";
const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainService: "faceme.auth",
};

const migrateLegacyToken = async (key: string) => {
  const secureValue = await SecureStore.getItemAsync(key, SECURE_STORE_OPTIONS);

  if (secureValue) {
    return secureValue;
  }

  const legacyValue = await AsyncStorage.getItem(key);

  if (!legacyValue) {
    return null;
  }

  await SecureStore.setItemAsync(key, legacyValue, SECURE_STORE_OPTIONS);
  await AsyncStorage.removeItem(key);
  return legacyValue;
};

export const tokenStorage = {
  async getAccessToken() {
    return migrateLegacyToken(ACCESS_TOKEN_KEY);
  },
  async getRefreshToken() {
    return migrateLegacyToken(REFRESH_TOKEN_KEY);
  },
  async setTokens(accessToken: string, refreshToken: string) {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken, SECURE_STORE_OPTIONS),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken, SECURE_STORE_OPTIONS),
      AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]),
    ]);
  },
  async clear() {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY, SECURE_STORE_OPTIONS),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY, SECURE_STORE_OPTIONS),
      AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_SNAPSHOT_KEY]),
    ]);
  },
};

export const userSnapshotStorage = {
  async getUser() {
    const rawUser = await AsyncStorage.getItem(USER_SNAPSHOT_KEY);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as User;
    } catch {
      await AsyncStorage.removeItem(USER_SNAPSHOT_KEY);
      return null;
    }
  },
  async setUser(user: User) {
    await AsyncStorage.setItem(USER_SNAPSHOT_KEY, JSON.stringify(user));
  },
};

export const preferenceStorage = {
  async getLanguage() {
    return AsyncStorage.getItem(LANGUAGE_KEY);
  },
  async setLanguage(language: string) {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  },
  async clearLanguage() {
    await AsyncStorage.removeItem(LANGUAGE_KEY);
  },
};
