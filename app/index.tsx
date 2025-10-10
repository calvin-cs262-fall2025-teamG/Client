// including this bc VS Code gave me errors;
import React from "react";
import { Text, View, Pressable, Image, StyleProp, ViewStyle, TextStyle, StyleSheet, Dimensions } from "react-native";

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

// it's a bummer I can't use CSS at all;

/* way #1:
const s_font: TextStyle = {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: 16,
    color: "#000d20",
}
const s_navbar: StyleProp<ViewStyle> = {
    display: "flex",
    flex: 1,
}
const s_navbar_btn: StyleProp<ViewStyle> = {
    width: 1,
}
const s_navbar_img: StyleProp<ViewStyle> = {
    aspectRatio: "1 / 1",
}
const s_navbar_txt: TextStyle = {
    textAlign: "center",
    margin: "auto",
}
*/

const style = StyleSheet.create({
    font: {
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: 20,
        color: "#000d20",
    },
    app: {
        height: Dimensions.get("window").height,
    },
    navbar: {
        display: "flex",
        flexDirection: "row",
        flexGrow: 1,
        alignItems: "stretch",
        justifyContent: "space-around",
        width: Dimensions.get("window").width,
        position: "absolute",
        bottom: 0,
    },
    navbar_btn: {
        // width: 10,
        padding: 10,
        paddingBottom: 0,
        backgroundColor: "white",
        borderRadius: 10,
    },
    navbar_img: {
        width: 80,
        height: 80,
        resizeMode: "contain",
        // aspectRatio: "1 / 1",
    },
    navbar_txt: {
        textAlign: "center",
        margin: "auto",
    }
})


export default function Index() {
  return (
    <View style={style.app}>
        <View style={style.navbar}>
          <Pressable style={style.navbar_btn}>
            <Image style={style.navbar_img} source={require("../assets/images/icons/home.png")} />
            <Text style={[style.font, style.navbar_txt]}>Home</Text>
          </Pressable>
          <Pressable style={style.navbar_btn}>
            <Image style={style.navbar_img} source={require("../assets/images/icons/search.png")} />
            <Text style={[style.font, style.navbar_txt]}>Search</Text>
          </Pressable>
          <Pressable style={style.navbar_btn}>
            <Image style={style.navbar_img} source={require("../assets/images/icons/post.png")} />
            <Text style={[style.font, style.navbar_txt]}>Post</Text>
          </Pressable>
          <Pressable style={style.navbar_btn}>
            <Image style={style.navbar_img} source={require("../assets/images/icons/messages.png")} />
            <Text style={[style.font, style.navbar_txt]}>Messages</Text>
          </Pressable>
          <Pressable style={style.navbar_btn}>
            <Image style={style.navbar_img} source={require("../assets/images/icons/profile.png")} />
            <Text style={[style.font, style.navbar_txt]}>Profile</Text>
          </Pressable>
        </View>
    </View>
  );
}
