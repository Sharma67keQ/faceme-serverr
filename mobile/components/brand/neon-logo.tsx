import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
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
          <View style={[styles.eye, { height: size * 0.08, left: size * 0.17, top: size * 0.2, width: size * 0.08 }]} />
          <View style={[styles.eye, { height: size * 0.08, right: size * 0.17, top: size * 0.2, width: size * 0.08 }]} />
          <View
            style={[
              styles.smile,
              {
                borderBottomWidth: Math.max(2, size * 0.055),
                borderRadius: size * 0.2,
                bottom: size * 0.15,
                height: size * 0.17,
                width: size * 0.28,
              },
            ]}
          />
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
    elevation: 12,
    shadowColor: colors.energy,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
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
    backgroundColor: "rgba(11, 11, 18, 0.22)",
    height: "72%",
    overflow: "hidden",
    position: "relative",
    width: "72%",
  },
  eye: {
    backgroundColor: colors.text,
    borderRadius: 999,
    position: "absolute",
  },
  smile: {
    borderBottomColor: colors.text,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    position: "absolute",
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
