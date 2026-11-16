process.env.EXPO_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";

// Icons try to load font files which don't exist in tests
// Swap Ionicons for an empty stand-in so screens can render
function mockIcon() {
  const React = require("react");
  const { Text } = require("react-native");
  const Icon = (props) => React.createElement(Text, props);
  Icon.glyphMap = {};
  return Icon;
}

jest.mock("@expo/vector-icons", () => ({ Ionicons: mockIcon() }));
jest.mock("@expo/vector-icons/Ionicons", () => ({ __esModule: true, default: mockIcon() }));