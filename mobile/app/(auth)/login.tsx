import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AxiosError } from "axios";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { GuestGuard } from "@/hooks/use-auth-guard";
import { useAuthStore } from "@/store/auth-store";
import { colors, radius, spacing } from "@/utils/theme";

const getApiErrorMessage = (error: AxiosError) => {
  if (!error.response) {
    return "Cannot reach the Faceme server right now. Check your internet connection and try again.";
  }

  const payload = error.response.data;

  if (typeof payload === "object" && payload && "issues" in payload) {
    const issues = payload.issues as {
      fieldErrors?: Record<string, string[] | undefined>;
      formErrors?: string[];
    };
    const fieldMessage = Object.values(issues.fieldErrors ?? {}).flat().find(Boolean);
    const formMessage = issues.formErrors?.find(Boolean);

    if (fieldMessage) {
      return fieldMessage;
    }

    if (formMessage) {
      return formMessage;
    }
  }

  if (typeof payload === "object" && payload && "message" in payload && typeof payload.message === "string") {
    return payload.message;
  }

  return "We could not log you in. Check your details and try again.";
};

const isEmail = (value: string) => /\S+@\S+\.\S+/.test(value);
const isUsername = (value: string) => /^[a-z0-9_]{3,30}$/i.test(value);

export default function LoginScreen() {
  const signIn = useAuthStore((state) => state.signIn);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const identifierError = useMemo(() => {
    const value = identifier.trim();

    if (!value) {
      return "Email ama username geli";
    }

    if (isEmail(value) || isUsername(value)) {
      return null;
    }

    return "Geli email sax ah ama username sax ah";
  }, [identifier]);

  const passwordError = useMemo(() => {
    if (!password) {
      return "Password geli";
    }

    return null;
  }, [password]);

  const canSubmit = !identifierError && !passwordError && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      await signIn({ identifier: identifier.trim().toLowerCase(), password });
      router.replace("/");
    } catch (error) {
      if (error instanceof AxiosError) {
        setServerError(getApiErrorMessage(error));
      } else {
        setServerError("We could not log you in. Check your details and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GuestGuard>
      <Screen style={styles.screen}>
        <View style={styles.shell}>
          <View style={styles.brandWrap}>
            <BrandLockup compact />
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>Gal</Text>
            <View style={styles.form}>
              <View style={styles.field}>
                <Input
                  label="Email ama username"
                  value={identifier}
                  onChangeText={(value) => {
                    setIdentifier(value);
                    if (serverError) {
                      setServerError(null);
                    }
                  }}
                  placeholder="you@example.com ama facemehandle"
                />
                {identifierError && identifier.trim() ? <Text style={styles.inlineError}>{identifierError}</Text> : null}
              </View>
              <View style={styles.field}>
                <Input
                  label="Password"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (serverError) {
                      setServerError(null);
                    }
                  }}
                  placeholder="Enter password"
                  secureTextEntry
                />
                {passwordError && password ? <Text style={styles.inlineError}>{passwordError}</Text> : null}
              </View>
            </View>
            <View style={styles.actions}>
              {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}
              <Button label={isSubmitting ? "Wuu galayaa..." : "Gal"} onPress={handleSubmit} disabled={!canSubmit} />
              <Link href="/(auth)/register" style={styles.linkWrap}>
                <Text style={styles.link}>Samee akoon</Text>
              </Link>
            </View>
          </View>
        </View>
      </Screen>
    </GuestGuard>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  shell: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
  },
  brandWrap: {
    alignItems: "center",
  },
  card: {
    backgroundColor: "rgba(38, 33, 63, 0.94)",
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
  },
  inlineError: {
    color: colors.danger,
    fontSize: 12,
    paddingHorizontal: spacing.sm,
  },
  serverError: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  linkWrap: {
    alignSelf: "center",
  },
  link: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
