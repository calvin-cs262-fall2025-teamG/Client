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
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "space-around",
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
    },
    content: {
        overflowY: "scroll",
        flexGrow: 1,
        flexShrink: 1,
    },
    navbar: {
        display: "flex",
        flexDirection: "row",
        flexGrow: 0,
        alignItems: "stretch",
        justifyContent: "space-around",
        width: Dimensions.get("window").width,
    },
    navbar_btn: {
        flexGrow: 1,
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

const my_par = (<View>
  <Text style={style.font}>
    An item can be enchanted by using an enchanting table and placing the item and 1-3 lapis lazuli in the input slots. Upon placing the item, three (pseudo)randomized options appear on the right of the GUI. The glyphs, written in Standard Galactic Alphabet, do not affect the enchantment, but hovering over a presented enchantment shows one enchantment to be applied. On mobile devices, the player can tap an enchantment before putting in the lapis lazuli or hold the enchantment before release. The only choices available have a level requirement equal to or below the player's current level and a lapis lazuli requirement equal to or below the number of lapis lazuli placed in the table. Each option imbues the item with a randomized set of enchantments that are dependent on the number of experience levels required (e.g. a level 30 enchantment can give a pickaxe the "Efficiency II" enchantment); the actual level cost and the number of lapis lazuli required have no effect.
  </Text>
</View>);

export default function Index() {
  return (
    <View style={style.app}>
        <View style={style.content}>
            {React.cloneElement(my_par)}
            {React.cloneElement(my_par)}
            {React.cloneElement(my_par)}
            {React.cloneElement(my_par)}
            {React.cloneElement(my_par)}
            {React.cloneElement(my_par)}
            {React.cloneElement(my_par)}
            {React.cloneElement(my_par)}
            {React.cloneElement(my_par)}
            {React.cloneElement(my_par)}
        </View>
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
