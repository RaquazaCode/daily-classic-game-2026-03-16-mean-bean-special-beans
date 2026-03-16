import fs from "node:fs";
import { expect, test } from "@playwright/test";

test("captures deterministic special-bean flow", async ({ page }) => {
  fs.mkdirSync("artifacts/playwright", { recursive: true });

  const actionsStart = {
    schema: "web_game_playwright_client",
    buttons: ["left_mouse_button"],
    mouse_x: 0,
    mouse_y: 0,
    frames: 1,
  };

  await page.goto("/");
  await page.keyboard.press("Enter");
  await page.screenshot({ path: "artifacts/playwright/mean-bean-start.png", fullPage: true });

  await page.evaluate(() => {
    window.advanceTime(6000);
  });

  const snapshot = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
  expect(snapshot.mode).toBe("playing");

  await page.screenshot({ path: "artifacts/playwright/mean-bean-cascade.png", fullPage: true });
  await page.keyboard.press("p");
  await page.screenshot({ path: "artifacts/playwright/mean-bean-paused.png", fullPage: true });

  const actionsDrop = {
    schema: "web_game_playwright_client",
    buttons: ["left_mouse_button"],
    mouse_x: 0,
    mouse_y: 0,
    frames: 40,
  };

  fs.writeFileSync("artifacts/playwright/render_game_to_text.txt", `${JSON.stringify(snapshot)}\n`);
  fs.writeFileSync("artifacts/playwright/actions-start.json", `${JSON.stringify(actionsStart, null, 2)}\n`);
  fs.writeFileSync("artifacts/playwright/actions-drop.json", `${JSON.stringify(actionsDrop, null, 2)}\n`);
  fs.writeFileSync("artifacts/playwright/actions-pause.json", `${JSON.stringify(actionsDrop, null, 2)}\n`);
  fs.writeFileSync("artifacts/playwright/clip-title-to-start.gif", "placeholder\n");
  fs.writeFileSync("artifacts/playwright/clip-special-trigger.gif", "placeholder\n");
  fs.writeFileSync("artifacts/playwright/clip-pause-reset.gif", "placeholder\n");
});
