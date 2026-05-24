import type { AuditReport, Brief, PageBlueprint, ThemeTokens } from "@product-studio/shared-types";
import { isAuditReport, isBrief, isPageBlueprint, isThemeTokens } from "@product-studio/shared-types";

export type ContractName = "brief" | "pageBlueprint" | "themeTokens" | "auditReport";

export interface ContractSpec<T> {
  name: ContractName;
  validate: (value: unknown) => value is T;
}

export const BriefContract: ContractSpec<Brief> = {
  name: "brief",
  validate: isBrief
};

export const PageBlueprintContract: ContractSpec<PageBlueprint> = {
  name: "pageBlueprint",
  validate: isPageBlueprint
};

export const ThemeTokensContract: ContractSpec<ThemeTokens> = {
  name: "themeTokens",
  validate: isThemeTokens
};

export const AuditReportContract: ContractSpec<AuditReport> = {
  name: "auditReport",
  validate: isAuditReport
};
