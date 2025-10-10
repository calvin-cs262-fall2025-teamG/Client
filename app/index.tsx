import React from "react";
import { Text, View } from "react-native";
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
        <div className="navbar">
          <button>
            <img src="home.png" />
            <Text>Home</Text>
          </button>
          <button>
            <img src="search.png" />
            <Text>Search</Text>
          </button>
          <button>
            <img src="post.png" />
            <Text>Post</Text>
          </button>
          <button>
            <img src="messages.png" />
            <Text>Messages</Text>
          </button>
          <button>
            <img src="profile.png" />
            <Text>Profile</Text>
          </button>
        </div>
    </View>
  );
}
