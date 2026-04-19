import { Href, router } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { ListCard } from "@/components/ui/list-card";
import { Screen } from "@/components/ui/screen";
import { SectionHeader } from "@/components/ui/section-header";
import { buildInfo } from "@/utils/build-info";

const settingsRows: Array<{ title: string; subtitle: string; href?: Href; logout?: boolean }> = [
  { title: "Edit profile", subtitle: "Update your public details", href: "/profile/edit" as Href },
  { title: "Saved", subtitle: "Review saved posts and listings", href: "/saved" as Href },
  { title: "Notifications", subtitle: "Review activity and read state", href: "/notifications" as Href },
  { title: "Help and support", subtitle: "Support discovery and moderation tools are available from Explore." },
  { title: "Log out", subtitle: "Sign out of this device", logout: true },
];

export default function SettingsScreen() {
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <Screen scroll>
      <SectionHeader title="Settings" />
      {settingsRows.map((item) => (
        <ListCard
          key={item.title}
          title={item.title}
          subtitle={item.subtitle}
          onPress={(() => {
            if (item.logout) {
              return () => {
                void signOut().then(() => router.replace("/login"));
              };
            }

            if (item.href) {
              return () => router.push(item.href as Href);
            }

            return undefined;
          })()}
        />
      ))}
      <ListCard title="App build" subtitle={`${buildInfo.label} - ${buildInfo.releaseMarker}`} />
    </Screen>
  );
}
