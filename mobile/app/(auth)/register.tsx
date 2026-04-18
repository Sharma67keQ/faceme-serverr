import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { AxiosError } from "axios";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Screen } from "@/components/ui/screen";
import { GuestGuard } from "@/hooks/use-auth-guard";
import { useAuthStore } from "@/store/auth-store";
import { colors, radius, spacing } from "@/utils/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

  return "We could not create your account. Check your details and try again.";
};

const usernamePattern = /^[a-z0-9_]{3,30}$/i;
const emailPattern = /\S+@\S+\.\S+/;

export default function RegisterScreen() {
  const signUp = useAuthStore((state) => state.signUp);
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const fullNameError = useMemo(() => {
    const value = fullName.trim();

    if (!value) {
      return "Full name geli";
    }

    if (value.length < 2) {
      return "Full name waa inuu ka bato 1 xaraf";
    }

    return null;
  }, [fullName]);

  const usernameError = useMemo(() => {
    const value = username.trim();

    if (!value) {
      return "Username geli";
    }

    if (!usernamePattern.test(value)) {
      return "Username wuxuu noqon karaa letters, numbers, ama underscore oo keliya";
    }

    return null;
  }, [username]);

  const emailError = useMemo(() => {
    const value = email.trim();

    if (!value) {
      return "Email geli";
    }

    if (!emailPattern.test(value)) {
      return "Email sax ah geli";
    }

    return null;
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) {
      return "Password geli";
    }

    if (password.length < 10) {
      return "Password-ku waa inuu ahaadaa ugu yaraan 10 xaraf";
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return "Password-ku waa inuu lahaadaa xaraf weyn, yar, iyo number";
    }

    return null;
  }, [password]);

  const canContinue = !fullNameError && !usernameError;
  const canSubmit = !emailError && !passwordError && !isSubmitting;

  const goToStepTwo = () => {
    if (!canContinue) {
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setServerError(null);
    setStep(2);
  };

  const goBack = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setServerError(null);
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      await signUp({
        name: fullName.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      router.replace("/");
    } catch (error) {
      if (error instanceof AxiosError) {
        setServerError(getApiErrorMessage(error));
      } else {
        setServerError("We could not create your account. Check your details and try again.");
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
            <View style={styles.header}>
              <Text style={styles.title}>{step === 1 ? "Samee akoon" : "Xaqiiji akoonka"}</Text>
              <Text style={styles.stepMeta}>{step === 1 ? "Tallaabo 1/2" : "Tallaabo 2/2"}</Text>
            </View>

            {step === 1 ? (
              <View style={styles.body}>
                <View style={styles.field}>
                  <Input
                    label="Full name"
                    value={fullName}
                    onChangeText={(value) => {
                      setFullName(value);
                      if (serverError) {
                        setServerError(null);
                      }
                    }}
                    placeholder="Magacaaga oo dhan"
                  />
                  {fullNameError && fullName.trim() ? <Text style={styles.inlineError}>{fullNameError}</Text> : null}
                </View>
                <View style={styles.field}>
                  <Input
                    label="Username"
                    value={username}
                    onChangeText={(value) => {
                      setUsername(value);
                      if (serverError) {
                        setServerError(null);
                      }
                    }}
                    placeholder="facemehandle"
                  />
                  {usernameError && username.trim() ? <Text style={styles.inlineError}>{usernameError}</Text> : null}
                </View>
                <View style={styles.actions}>
                  <Button label="Continue" onPress={goToStepTwo} disabled={!canContinue} />
                  <View style={styles.linkRow}>
                    <Text style={styles.linkHint}>Already have an account?</Text>
                    <Link href="/(auth)/login">
                      <Text style={styles.link}>Log in</Text>
                    </Link>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.body}>
                <Pressable onPress={goBack} hitSlop={10}>
                  <Text style={styles.backLink}>Dib ugu noqo</Text>
                </Pressable>
                <View style={styles.field}>
                  <Input
                    label="Email"
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      if (serverError) {
                        setServerError(null);
                      }
                    }}
                    placeholder="you@example.com"
                  />
                  {emailError && email.trim() ? <Text style={styles.inlineError}>{emailError}</Text> : null}
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
                    placeholder="Create password"
                    secureTextEntry
                  />
                  {passwordError && password ? <Text style={styles.inlineError}>{passwordError}</Text> : null}
                </View>
                <View style={styles.actions}>
                  {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}
                  <Button label={isSubmitting ? "Akoon waa la samaynayaa..." : "Samee akoon"} onPress={handleSubmit} disabled={!canSubmit} />
                </View>
              </View>
            )}
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
    minHeight: 360,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
  },
  stepMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  body: {
    flex: 1,
    gap: spacing.md,
    justifyContent: "space-between",
  },
  field: {
    gap: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xs,
  },
  linkHint: {
    color: colors.textMuted,
    fontSize: 14,
  },
  link: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  backLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
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
});
