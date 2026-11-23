import { expect, test } from "@playwright/test";
import { isNotFound } from "../../lib/ai/not-found";

test("the Not found label ignores a stray [NONE] on an answer that cites its sources", () => {
  // Refusals keep the label, with or without a cited suggestion.
  expect(isNotFound("That is not in our research notes, I'm afraid. [NONE]", false)).toBe(true);
  expect(isNotFound("Our research doesn’t cover that. You could ask about the Macintosh [C020]. [NONE]", true)).toBe(
    true,
  );
  expect(isNotFound("I can't predict a grade. Our project is about AI [C001]. [NONE]", true)).toBe(true);
  // An answer stays an answer.
  expect(isNotFound("Deep Blue beat Garry Kasparov in 1997 [C071]. [NONE]", true)).toBe(false);
  expect(isNotFound("The Apollo Research tests are not directly comparable [C056]. [NONE]", true)).toBe(false);
  expect(isNotFound("Deep Blue beat Garry Kasparov in 1997 [C071].", true)).toBe(false);
});
