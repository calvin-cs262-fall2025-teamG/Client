import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const logo = require("../assets/images/logo.png");

// tiny sample items
const previewItems = [
  { id: 1, icon: "flash-outline" as const, label: "USB-C charger", tag: "Tech" },
  { id: 2, icon: "book-outline" as const, label: "Core 100 book", tag: "Books" },
  { id: 3, icon: "home-outline" as const, label: "Desk lamp", tag: "Dorm" },
  { id: 4, icon: "cafe-outline" as const, label: "Keurig", tag: "Shared kitchen" },
];

export default function Onboarding() {
  const router = useRouter();
  const [pageIndex, setPageIndex] = useState(0);

  // track horizontal scroll for tiny parallax
  const scrollX = useRef(new Animated.Value(0)).current;

  // gentle float animation for hero circle & badges
  const floatAnim = useRef(new Animated.Value(0)).current;

  // intro animations for first page
  const heroIntro = useRef(new Animated.Value(0)).current;
  const textIntro = useRef(new Animated.Value(0)).current;
  const previewIntro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // looped float (always running)
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();

    Animated.stagger(140, [
      Animated.timing(heroIntro, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(textIntro, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(previewIntro, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      loop.stop();
    };
  }, [floatAnim, heroIntro, textIntro, previewIntro]);

  // Parallax transforms for each main content block
  const heroParallax = {
    transform: [
      {
        translateX: scrollX.interpolate({
          inputRange: [0, width],
          outputRange: [0, -15],
          extrapolate: "clamp",
        }),
      },
    ],
  };

  const cardsParallax = {
    transform: [
      {
        translateX: scrollX.interpolate({
          inputRange: [0, width, 2 * width],
          outputRange: [20, 0, -20],
          extrapolate: "clamp",
        }),
      },
    ],
  };

  const goalParallax = {
    transform: [
      {
        translateX: scrollX.interpolate({
          inputRange: [width, 2 * width],
          outputRange: [15, 0],
          extrapolate: "clamp",
        }),
      },
    ],
  };

  // float styles driven by floatAnim
  const circlePulse = {
    transform: [
      {
        scale: floatAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.02],
        }),
      },
    ],
  };

  const badgeFloatUp = {
    transform: [
      {
        translateY: floatAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -6],
        }),
      },
    ],
  };

  const badgeFloatDown = {
    transform: [
      {
        translateY: floatAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 6],
        }),
      },
    ],
  };

  // intro styles
  const heroIntroStyle = {
    opacity: heroIntro,
    transform: [
      {
        translateY: heroIntro.interpolate({
          inputRange: [0, 1],
          outputRange: [30, 0],
        }),
      },
    ],
  };

  const textIntroStyle = {
    opacity: textIntro,
    transform: [
      {
        translateY: textIntro.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  };

  const previewIntroStyle = {
    opacity: previewIntro,
    transform: [
      {
        translateY: previewIntro.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
    ],
  };

  // 6 animated values: 3 for Borrow chips, 3 for Lend chips
  const chipAnim = useRef(
    [0, 1, 2, 3, 4, 5].map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (pageIndex === 1) {
      Animated.stagger(
        120,
        chipAnim.map((a) =>
          Animated.timing(a, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          })
        )
      ).start();
    } else {
      chipAnim.forEach((a) => a.setValue(0));
    }
  }, [pageIndex]);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    setPageIndex(index);
  };

  const goToSignup = () => {
    router.replace({
      pathname: "/(auth)/login",
      params: { tab: "signup" },
    });
  };

  const goToLogin = () => {
    router.replace({
      pathname: "/(auth)/login",
      params: { tab: "login" },
    });
  };


  return (
    <View style={styles.root}>
      {/* Soft background blobs */}
      <View style={[styles.blob, styles.blobTopLeft]} />
      <View style={[styles.blob, styles.blobBottomRight]} />

      {/* Skip button */}
      {pageIndex < 2 && (
        <TouchableOpacity style={styles.skipButton} onPress={goToLogin}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

      )}

      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={{ alignItems: "stretch" }}
      >
        {/* PAGE 1 – Circle logo + item preview */}
        <View style={styles.page}>
          <Animated.View
            style={[styles.heroGraphicContainer, heroParallax, heroIntroStyle]}
          >
            <Animated.View style={[styles.heroCircleOuter, circlePulse]}>
              <View style={styles.heroCircleInner}>
                <Image source={logo} style={styles.heroLogoGraphic} />
              </View>

              {/* Floating icon badges */}
              <Animated.View style={[styles.heroBadgeLeft, badgeFloatUp]}>
                <Ionicons name="home-outline" size={20} color="#3b1b0d" />
              </Animated.View>
              <Animated.View style={[styles.heroBadgeRight, badgeFloatDown]}>
                <Ionicons name="swap-horizontal-outline" size={20} color="#3b1b0d" />
              </Animated.View>

              {/* Small decorative dots */}
              <View style={[styles.heroDot, { top: 18, left: 32 }]} />
              <View style={[styles.heroDot, { bottom: 26, right: 40 }]} />
              <View style={[styles.heroDotSmall, { top: 70, right: 24 }]} />
            </Animated.View>
          </Animated.View>

          <Animated.View style={[styles.heroTextBlock, textIntroStyle]}>
            <Text style={styles.heroTitle}>Hey, Neighbor!</Text>
            <Text style={styles.heroSubtitle}>Need it? A neighbor’s got it.</Text>
          </Animated.View>

          <Animated.View style={[styles.previewStrip, previewIntroStyle]}>
            <Text style={styles.previewLabel}>A peek at what neighbors share</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.previewScrollContent}
            >
              {previewItems.map((item) => (
                <View key={item.id} style={styles.previewCard}>
                  <View style={styles.previewIconCircle}>
                    <Ionicons name={item.icon} size={20} color="#3b1b0d" />
                  </View>
                  <Text style={styles.previewTitle}>{item.label}</Text>
                  <Text style={styles.previewTag}>{item.tag}</Text>
                </View>
              ))}
            </ScrollView>
          </Animated.View>

          <Text style={styles.smallHint}>Swipe to get started →</Text>
        </View>

        {/* PAGE 2 – Borrow / Lend */}
        <View style={styles.page}>
          <Text style={styles.pageTitle}>Borrow & lend in a few taps</Text>
          <Text style={styles.pageBody}>
            Hey, Neighbor! keeps things simple so you can spend less time
            stressing about money and more time actually living college life.
          </Text>

          <Animated.View style={[styles.cardRow, cardsParallax]}>
            <View style={styles.featureCard}>
              <View style={styles.featureIconCircle}>
                <Ionicons name="download-outline" size={22} color="#f97316" />
              </View>
              <Text style={styles.featureTitle}>Borrow</Text>
              <Text style={styles.featureText}>
                Find textbooks, vacuums, tools, lamps, and other campus essentials
                without having to buy everything new.
              </Text>
              <View style={styles.featureChipRow}>
                {["📚 textbooks", "🧹 vacuums", "🔧 tools"].map((label, idx) => {
                  const animatedStyle = {
                    opacity: chipAnim[idx],
                    transform: [
                      {
                        translateY: chipAnim[idx].interpolate({
                          inputRange: [0, 1],
                          outputRange: [12, 0],
                        }),
                      },
                    ],
                  };

                  return (
                    <Animated.Text
                      key={label}
                      style={[styles.featureChip, animatedStyle]}
                    >
                      {label}
                    </Animated.Text>
                  );
                })}
              </View>
            </View>

            <View style={styles.featureCard}>
              <View
                style={[
                  styles.featureIconCircle,
                  { backgroundColor: "#ecfdf3" },
                ]}
              >
                <Ionicons name="pricetags-outline" size={22} color="#16a34a" />
              </View>
              <Text style={styles.featureTitle}>Lend</Text>
              <Text style={styles.featureText}>
                List the things you already own and help a neighbor out while your
                stuff actually gets used.
              </Text>
              <View style={styles.featureChipRow}>
                {["🏡 dorm extras", "🎮 hobbies", "🌱 seasonal"].map(
                  (label, idx) => {
                    const animIndex = 3 + idx;
                    const animatedStyle = {
                      opacity: chipAnim[animIndex],
                      transform: [
                        {
                          translateY: chipAnim[animIndex].interpolate({
                            inputRange: [0, 1],
                            outputRange: [12, 0],
                          }),
                        },
                      ],
                    };

                    return (
                      <Animated.Text
                        key={label}
                        style={[styles.featureChip, animatedStyle]}
                      >
                        {label}
                      </Animated.Text>
                    );
                  }
                )}
              </View>
            </View>
          </Animated.View>
        </View>

        {/* PAGE 3 – Goal + CTA */}
        <View style={styles.page}>
          <Text style={styles.pageTitle}>Why we built Hey, Neighbor</Text>
          <Text style={styles.pageBody}>
            Our goal is to make borrowing feel normal and effortless on campus—
            like knocking on your neighbor’s door, but more organized and with a lot more neighbors.
          </Text>

          <Animated.View style={[styles.goalCard, goalParallax]}>
            <View style={styles.goalRow}>
              <Ionicons name="people-outline" size={27} color="#f97316" />
              <Text style={styles.goalText}>
                Help Calvin students connect beyond class and build small, everyday
                community.
              </Text>
            </View>

            <View style={styles.goalRow}>
              <Ionicons name="cash-outline" size={27} color="#15803d" />
              <Text style={styles.goalText}>
                Save money by borrowing instead of buying new for every little thing.
              </Text>
            </View>

            <View style={styles.goalRow}>
              <Ionicons name="leaf-outline" size={27} color="#16a34a" />
              <Text style={styles.goalText}>
                Cut down on waste and let rarely-used items get a second life.
              </Text>
            </View>
          </Animated.View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goToSignup}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>Get started</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={goToLogin}>
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>

        </View>
      </Animated.ScrollView>

      {/* Page indicators */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[styles.dot, pageIndex === i && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fefaf6",
  },

  page: {
    width,
    paddingHorizontal: 22,
    paddingTop: 80,
    paddingBottom: 40,
  },

  /* Background blobs */
  blob: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    opacity: 0.18,
  },
  blobTopLeft: {
    backgroundColor: "#f97316",
    top: -40,
    left: -60,
  },
  blobBottomRight: {
    backgroundColor: "#d7c3b4",
    bottom: -60,
    right: -80,
  },

  /* Hero graphic w/ circles */
  heroGraphicContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  heroCircleOuter: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowColor: "#f97316",
    shadowOpacity: 0.25,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
  },
  heroCircleInner: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#fefaf6",
    alignItems: "center",
    justifyContent: "center",
  },
  heroLogoGraphic: {
    width: 130,
    height: 130,
    borderRadius: 30,
  },
  heroBadgeLeft: {
    position: "absolute",
    left: 20,
    top: 70,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff7f0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  heroBadgeRight: {
    position: "absolute",
    right: 18,
    bottom: 60,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e9f8ed",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  heroDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ffe3c6",
  },
  heroDotSmall: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#3b1b0d",
    opacity: 0.4,
  },

  heroTextBlock: {
    marginTop: 26,
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#3b1b0d",
    letterSpacing: 0.4,
    marginBottom: 4,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#7c5f52",
    textAlign: "center",
  },

  /* preview strip at bottom of page 1 */
  previewStrip: {
    marginTop: 26,
  },
  previewLabel: {
    fontSize: 12,
    color: "#a58a7b",
    marginBottom: 10,
  },
  previewScrollContent: {
    paddingRight: 4,
  },
  previewCard: {
    width: 130,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 10,
    shadowColor: "#3b1b0d",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  previewIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff4ec",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3b1b0d",
  },
  previewTag: {
    fontSize: 11,
    color: "#a58a7b",
    marginTop: 2,
  },

  smallHint: {
    marginTop: 16,
    fontSize: 12,
    color: "#a58a7b",
    textAlign: "center",
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#3b1b0d",
    marginBottom: 10,
  },
  pageBody: {
    fontSize: 14,
    color: "#7c5f52",
    lineHeight: 22,
  },

  /* Feature cards */
  cardRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  featureCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
    shadowColor: "#3b1b0d",
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 4 },
  },
  featureIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: "#fff4ec",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3b1b0d",
    marginBottom: 4,
  },
  featureText: {
    fontSize: 13,
    color: "#7c5f52",
    lineHeight: 20,
    marginBottom: 8,
  },
  featureChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  featureChip: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#f3e7df",
    color: "#3b1b0d",
  },

  /* Page 3 – Why Hey Neighbor */
  goalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
    marginBottom: 14,
    shadowColor: "#3b1b0d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  goalRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 8,
  },
  goalText: {
    flex: 1,
    fontSize: 13,
    color: "#7c5f52",
    lineHeight: 20,
  },

  pageBodySmall: {
    fontSize: 13,
    color: "#7c5f52",
    lineHeight: 20,
    marginTop: 6,
  },

  /* Buttons */
  primaryButton: {
    backgroundColor: "#f97316",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3b1b0d",
  },

  /* Page indicator dots */
  dotsContainer: {
    position: "absolute",
    bottom: 24,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#d6c4bc",
  },
  dotActive: {
    width: 22,
    backgroundColor: "#f97316",
  },

  /* Skip */
  skipButton: {
    position: "absolute",
    top: 52,
    right: 20,
    zIndex: 10,
  },
  skipText: {
    fontSize: 13,
    color: "#7c5f52",
    fontWeight: "600",
  },
});
