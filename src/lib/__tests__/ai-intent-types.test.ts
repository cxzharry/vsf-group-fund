import { isReadyToConfirm, ParsedBillIntent } from "../ai-intent-types";

describe("isReadyToConfirm", () => {
  test("returns true when all required fields present", () => {
    const parsed: ParsedBillIntent = {
      hasIntent: true,
      intentType: "split",
      amount: 500_000,
      description: "phở",
      peopleCount: 4,
      peopleNames: [],
      splitType: "equal",
      transferTo: null,
      readyToConfirm: true,
      followUp: null,
    };
    expect(isReadyToConfirm(parsed)).toBe(true);
  });

  test("returns false when hasIntent is false", () => {
    const parsed: ParsedBillIntent = {
      hasIntent: false,
      intentType: "unknown",
      amount: 500_000,
      description: null,
      peopleCount: null,
      peopleNames: [],
      splitType: null,
      transferTo: null,
      readyToConfirm: false,
      followUp: null,
    };
    expect(isReadyToConfirm(parsed)).toBe(false);
  });

  test("returns false when amount is null", () => {
    const parsed: ParsedBillIntent = {
      hasIntent: true,
      intentType: "split",
      amount: null,
      description: "phở",
      peopleCount: 4,
      peopleNames: [],
      splitType: "equal",
      transferTo: null,
      readyToConfirm: false,
      followUp: null,
    };
    expect(isReadyToConfirm(parsed)).toBe(false);
  });

  test("returns false when intentType is unknown", () => {
    const parsed: ParsedBillIntent = {
      hasIntent: true,
      intentType: "unknown",
      amount: 500_000,
      description: "phở",
      peopleCount: null,
      peopleNames: [],
      splitType: null,
      transferTo: null,
      readyToConfirm: false,
      followUp: null,
    };
    expect(isReadyToConfirm(parsed)).toBe(false);
  });

  test("returns true for transfer intent with amount", () => {
    const parsed: ParsedBillIntent = {
      hasIntent: true,
      intentType: "transfer",
      amount: 200_000,
      description: null,
      peopleCount: null,
      peopleNames: [],
      splitType: null,
      transferTo: "Minh",
      readyToConfirm: true,
      followUp: null,
    };
    expect(isReadyToConfirm(parsed)).toBe(true);
  });

  test("returns false when missing multiple required fields", () => {
    const parsed: ParsedBillIntent = {
      hasIntent: false,
      intentType: "unknown",
      amount: null,
      description: null,
      peopleCount: null,
      peopleNames: [],
      splitType: null,
      transferTo: null,
      readyToConfirm: false,
      followUp: null,
    };
    expect(isReadyToConfirm(parsed)).toBe(false);
  });

  test("split intent with amount returns true", () => {
    const parsed: ParsedBillIntent = {
      hasIntent: true,
      intentType: "split",
      amount: 1_500_000,
      description: "bún bò",
      peopleCount: 6,
      peopleNames: [],
      splitType: "equal",
      transferTo: null,
      readyToConfirm: true,
      followUp: null,
    };
    expect(isReadyToConfirm(parsed)).toBe(true);
  });

  test("requires hasIntent AND amount AND intentType to be ready", () => {
    const baseValid: ParsedBillIntent = {
      hasIntent: true,
      intentType: "split",
      amount: 500_000,
      description: null,
      peopleCount: null,
      peopleNames: [],
      splitType: null,
      transferTo: null,
      readyToConfirm: true,
      followUp: null,
    };

    // Remove hasIntent
    const noIntent = { ...baseValid, hasIntent: false };
    expect(isReadyToConfirm(noIntent)).toBe(false);

    // Remove amount
    const noAmount = { ...baseValid, amount: null };
    expect(isReadyToConfirm(noAmount)).toBe(false);

    // Unknown intent type
    const unknownType = { ...baseValid, intentType: "unknown" as any };
    expect(isReadyToConfirm(unknownType)).toBe(false);

    // All present
    expect(isReadyToConfirm(baseValid)).toBe(true);
  });

  test("works with different intentType values", () => {
    const splitIntent: ParsedBillIntent = {
      hasIntent: true,
      intentType: "split",
      amount: 500_000,
      description: null,
      peopleCount: null,
      peopleNames: [],
      splitType: null,
      transferTo: null,
      readyToConfirm: true,
      followUp: null,
    };

    const transferIntent: ParsedBillIntent = {
      hasIntent: true,
      intentType: "transfer",
      amount: 200_000,
      description: null,
      peopleCount: null,
      peopleNames: [],
      splitType: null,
      transferTo: "Linh",
      readyToConfirm: true,
      followUp: null,
    };

    expect(isReadyToConfirm(splitIntent)).toBe(true);
    expect(isReadyToConfirm(transferIntent)).toBe(true);
  });

  test("handles zero and negative amounts correctly", () => {
    const zeroAmount: ParsedBillIntent = {
      hasIntent: true,
      intentType: "split",
      amount: 0,
      description: null,
      peopleCount: null,
      peopleNames: [],
      splitType: null,
      transferTo: null,
      readyToConfirm: true,
      followUp: null,
    };

    const negativeAmount: ParsedBillIntent = {
      hasIntent: true,
      intentType: "split",
      amount: -500_000,
      description: null,
      peopleCount: null,
      peopleNames: [],
      splitType: null,
      transferTo: null,
      readyToConfirm: true,
      followUp: null,
    };

    // Zero and negative are still truthy in the amount !== null check
    expect(isReadyToConfirm(zeroAmount)).toBe(true);
    expect(isReadyToConfirm(negativeAmount)).toBe(true);
  });

  test("other fields like peopleCount, description do not affect readiness", () => {
    const minimalValid: ParsedBillIntent = {
      hasIntent: true,
      intentType: "split",
      amount: 500_000,
      description: null,
      peopleCount: null,
      peopleNames: [],
      splitType: null,
      transferTo: null,
      readyToConfirm: true,
      followUp: null,
    };

    const fullyPopulated: ParsedBillIntent = {
      hasIntent: true,
      intentType: "split",
      amount: 500_000,
      description: "phở gà",
      peopleCount: 5,
      peopleNames: ["Mai", "Linh", "Huy"],
      splitType: "equal",
      transferTo: null,
      readyToConfirm: true,
      followUp: null,
    };

    expect(isReadyToConfirm(minimalValid)).toBe(true);
    expect(isReadyToConfirm(fullyPopulated)).toBe(true);
  });
});
