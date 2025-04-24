import {
  StyleSheet,
  Button,
  Image,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import Colors from "./../constants/Colors";
import { useRouter } from "expo-router";

export default function Index() {
  const router = useRouter();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Colors.WHITE,
      }}
    >
      <Image
        source={require("./../assets/images/landing.png")}
        style={{
          width: "100%",
          height: 300,
          marginTop: 50,
        }}
      />

      <View>
        <Text
          style={{
            fontSize: 48,
            lineHeight: 62,
            color: Colors.FONTCOLOR,
            textAlign: "center",
            marginVertical: 20,
            fontFamily: "NotoSans",
          }}
        >
          MINDHAVEN
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("./signup")}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  button: {
    padding: 15,
    backgroundColor: Colors.PRIMARY,
    marginTop: 50,
    borderRadius: 50,
    width: "80%",
    alignSelf: "center",
    alignItems: "center",
  },
  buttonText: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.WHITE,
  },
});
