import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { colors, gradients, radius } from "@/utils/theme";

type NeonLogoProps = {
  size?: number;
  animated?: boolean;
};

export const NeonLogo = ({ size = 44, animated = false }: NeonLogoProps) => {
  const pulse = useRef(new Animated.Value(0.72)).current;

  useEffect(() => {
    if (!animated) {
      pulse.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { duration: 900, toValue: 1, useNativeDriver: true }),
        Animated.timing(pulse, { duration: 900, toValue: 0.72, useNativeDriver: true }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [animated, pulse]);

  const borderRadius = Math.max(radius.md, size * 0.34);

  return (
    <Animated.View
      style={[
        styles.glow,
        {
          borderRadius,
          height: size,
          opacity: animated ? pulse : 1,
          transform: [{ scale: animated ? pulse.interpolate({ inputRange: [0.72, 1], outputRange: [0.96, 1.04] }) : 1 }],
          width: size,
        },
      ]}
    >
      <LinearGradient colors={gradients.logo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.bubble, { borderRadius }]}>
        <View style={[styles.inner, { borderRadius: borderRadius - 3 }]}>
          <Text style={[styles.face, { fontSize: size * 0.45, lineHeight: size * 0.5 }]}>◡</Text>
        </View>
        <View
          style={[
            styles.tail,
            {
              borderLeftWidth: size * 0.15,
              borderTopWidth: size * 0.15,
              right: size * 0.08,
            },
          ]}
        />
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  glow: {
    shadowColor: colors.energy,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 12,
  },
  bubble: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    overflow: "visible",
  },
  inner: {
    alignItems: "center",
    backgroundColor: "rgba(11, 11, 18, 0.24)",
    height: "72%",
    justifyContent: "center",
    width: "72%",
  },
  face: {
    color: colors.text,
    fontWeight: "900",
    includeFontPadding: false,
    marginTop: -2,
    textAlign: "center",
  },
  tail: {
    borderLeftColor: "transparent",
    borderTopColor: colors.gold,
    bottom: -1,
    height: 0,
    position: "absolute",
    width: 0,
  },
});
