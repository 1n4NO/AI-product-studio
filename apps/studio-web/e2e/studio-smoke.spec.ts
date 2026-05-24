import { expect, test } from "@playwright/test";

test("smoke: generate run and render key panels", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Product Studio" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Brief Form" })).toBeVisible();

  await page.getByRole("button", { name: "Generate Run" }).click();

  await expect(page.getByRole("heading", { name: "Run History" })).toBeVisible();
  await expect(page.getByText("review pending_review")).toBeVisible();
  await expect(page.getByRole("heading", { name: "SLO Dashboard" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Audit Panel" })).toBeVisible();
});

