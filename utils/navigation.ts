import type { ImperativeRouter } from "expo-router";

type BackRouter = Pick<ImperativeRouter, "back" | "canGoBack" | "replace">;

// router.back() does nothing when the screen was opened with no history
// (a browser reload, a direct link, or a redirect after switching accounts),
// and on web it logs "GO_BACK was not handled". Go Home in that case instead.
export function goBack(router: BackRouter) {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/(tabs)");
  }
}
