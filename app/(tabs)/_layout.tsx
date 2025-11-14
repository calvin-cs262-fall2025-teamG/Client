import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

export default function TabLayout() {
  const icon = (
    focused: boolean,
    active: IoniconName,
    inactive: IoniconName,
    color: string
  ) => (
    <Ionicons
      name={focused ? active : inactive}
      size={24}
      color={color}
    />
  );

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "white" },
        headerTintColor: "#3b1b0d",
        headerBackButtonDisplayMode: "minimal",
        headerTitleStyle: { fontWeight: "bold", fontSize: 22 },
        tabBarActiveTintColor: "#3b1b0d",
        tabBarInactiveTintColor: "#3b1b0d",
        tabBarStyle: { backgroundColor: "white" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Home",
          tabBarIcon: ({ color, focused }) =>
            icon(focused, "home", "home-outline", color),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          headerShown: false,
          title: "Search",
          tabBarIcon: ({ color, focused }) =>
            icon(focused, "search", "search-outline", color),
        }}
      />

      <Tabs.Screen
        name="list"
        options={{
          headerShown: false,
          title: "List",
          tabBarIcon: ({ color, focused }) =>
            icon(focused, "add-circle", "add-circle-outline", color),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, focused }) =>
            icon(focused, "chatbubble", "chatbubble-outline", color),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          title: "Profile",
          tabBarIcon: ({ color, focused }) =>
            icon(focused, "person-circle", "person-circle-outline", color),
        }}
      />
    </Tabs>
  );
}
