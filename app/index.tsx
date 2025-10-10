// including this bc VS Code gave me errors;
import React from "react";
import { Text, View, Pressable, Image } from "react-native";
import "./index.css";

/*
      <Text
        style={{
          fontFamily: "Times New Roman",
          color: "#00204a",
          fontSize: 50,
        }}
      >
      </Text>
      <Text
        style={{
          fontFamily: "Times New Roman",
          color: "#fdb44b",
          fontSize: 30,
        }}
      >
        Share, Borrow, Connect
      </Text>
*/

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
      >
        <View className="navbar">
          <Pressable>
            <Image src="home.png" />
            <Text>Home</Text>
          </Pressable>
          <Pressable>
            <Image src="search.png" />
            <Text>Search</Text>
          </Pressable>
          <Pressable>
            <Image src="post.png" />
            <Text>Post</Text>
          </Pressable>
          <Pressable>
            <Image src="messages.png" />
            <Text>Messages</Text>
          </Pressable>
          <Pressable>
            <Image src="profile.png" />
            <Text>Profile</Text>
          </Pressable>
        </View>
    </View>
  );
}
