import type { ExpoConfig, ConfigContext } from "expo/config";

const appName = process.env.APP_NAME ?? "Faceme";
const appSlug = process.env.APP_SLUG ?? "faceme-wqk2zo";
const appOwner = process.env.EXPO_OWNER ?? "xd-tech";
const iosBundleIdentifier = process.env.IOS_BUNDLE_ID ?? "com.xdtech.faceme";
const androidPackage = process.env.ANDROID_PACKAGE_ID ?? "com.xdtech.faceme";
const appVersion = "0.1.1";
const defaultAndroidVersionCode = 5;
const androidVersionCode = Number.parseInt(process.env.ANDROID_VERSION_CODE ?? String(defaultAndroidVersionCode), 10);
const easProjectId = process.env.EAS_PROJECT_ID ?? "7f86ffc9-354f-484b-90ff-14bf288323c9";
const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? "development";

const plugins: ExpoConfig["plugins"] = [
  "expo-router",
  "expo-asset",
  "expo-font",
  "expo-secure-store",
  "expo-video",
  [
    "expo-image-picker",
    {
      photosPermission: "Faceme needs access to your photos and videos so you can publish posts, statuses, reels, and message attachments.",
    },
  ],
];

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: appName,
  description: "Faceme hybrid social platform with premium chat-first identity",
  slug: appSlug,
  owner: appOwner,
  scheme: "faceme",
  version: appVersion,
  orientation: "portrait",
  userInterfaceStyle: "dark",
  icon: "./assets/icon.png",
  newArchEnabled: false,
  runtimeVersion: appVersion,
  updates: {
    fallbackToCacheTimeout: 0,
  },
  experiments: {
    typedRoutes: true,
  },
  assetBundlePatterns: ["**/*"],
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#0B0B12",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: iosBundleIdentifier,
    buildNumber: "1.0.0",
  },
  android: {
    package: androidPackage,
    versionCode: Number.isFinite(androidVersionCode) ? androidVersionCode : defaultAndroidVersionCode,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0B0B12",
    },
  },
  plugins,
  extra: {
    ...config.extra,
    eas: {
      ...(config.extra?.eas ?? {}),
      ...(easProjectId ? { projectId: easProjectId } : {}),
    },
  },
});
