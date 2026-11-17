import { Alert, Platform } from "react-native";

// Alert.alert does nothing on react-native-web, so on web these use the
// browser's own dialogs instead. Both return a Promise that settles when the
// dialog is closed, so callers can await them and then navigate.

const webText = (title: string, message?: string) =>
  message ? `${title}\n\n${message}` : title;

type ConfirmOptions = {
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

// Asks a yes/no question. Resolves true only when the user confirms.
export function confirm(
  title: string,
  message?: string,
  { confirmText = "OK", cancelText = "Cancel", destructive = false }: ConfirmOptions = {}
): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(webText(title, message)));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelText, style: "cancel", onPress: () => resolve(false) },
      {
        text: confirmText,
        style: destructive ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ]);
  });
}

// Shows a message with a single OK button. Resolves once it is dismissed.
export function notify(title: string, message?: string): Promise<void> {
  if (Platform.OS === "web") {
    window.alert(webText(title, message));
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [{ text: "OK", onPress: () => resolve() }]);
  });
}
