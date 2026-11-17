import { goBack } from "../utils/navigation";

const makeRouter = (canGoBack: boolean) => ({
  back: jest.fn(),
  canGoBack: jest.fn(() => canGoBack),
  replace: jest.fn(),
});

it("goes back when there is history", () => {
  const router = makeRouter(true);

  goBack(router);

  expect(router.back).toHaveBeenCalledTimes(1);
  expect(router.replace).not.toHaveBeenCalled();
});

it("goes to the Home tab when there is no history", () => {
  const router = makeRouter(false);

  goBack(router);

  expect(router.replace).toHaveBeenCalledWith("/(tabs)");
  expect(router.back).not.toHaveBeenCalled();
});
