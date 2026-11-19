import { describe, it, expect } from "vitest";
import {
  parsePrefixList,
  invalidPrefixes,
  formatPrefixList,
  extractTaskPrefix,
  findProjectIdByTaskName,
} from "./jiraPrefix";

describe("parsePrefixList", () => {
  it("normaliza a mayúsculas y separa por comas o espacios", () => {
    expect(parsePrefixList("sk, sod  SODA;tga")).toEqual(["SK", "SOD", "SODA", "TGA"]);
  });

  it("descarta vacíos y duplicados", () => {
    expect(parsePrefixList(" , SK,, sk ")).toEqual(["SK"]);
    expect(parsePrefixList("")).toEqual([]);
  });
});

describe("invalidPrefixes", () => {
  it("acepta letras y números empezando con letra", () => {
    expect(invalidPrefixes(["SK", "POSS", "AB2"])).toEqual([]);
  });

  it("rechaza los que empiezan con número o tienen símbolos", () => {
    expect(invalidPrefixes(["2SK", "S-K", "SK"])).toEqual(["2SK", "S-K"]);
  });
});

describe("formatPrefixList", () => {
  it("une con coma y espacio", () => {
    expect(formatPrefixList(["SOD", "SODA"])).toBe("SOD, SODA");
  });
});

describe("extractTaskPrefix", () => {
  it("extrae el prefijo de una clave Jira", () => {
    expect(extractTaskPrefix("SK-123 Fix checkout")).toBe("SK");
    expect(extractTaskPrefix("  bls-16 Address Alias")).toBe("BLS");
    expect(extractTaskPrefix("POSS2-9")).toBe("POSS2");
  });

  it("devuelve null si no hay clave con número", () => {
    expect(extractTaskPrefix("Daily standup")).toBeNull();
    expect(extractTaskPrefix("SK sin número")).toBeNull();
    expect(extractTaskPrefix("SK-")).toBeNull();
    expect(extractTaskPrefix("")).toBeNull();
  });
});

describe("findProjectIdByTaskName", () => {
  const projects = [
    { id: "seakeeper", prefixes: ["SK"] },
    { id: "soda", prefixes: ["SOD", "SODA"] },
    { id: "dup-a", prefixes: ["DUP"] },
    { id: "dup-b", prefixes: ["DUP"] },
  ];

  it("encuentra el proyecto por cualquiera de sus prefijos", () => {
    expect(findProjectIdByTaskName("SK-1 algo", projects)).toBe("seakeeper");
    expect(findProjectIdByTaskName("SODA-2 algo", projects)).toBe("soda");
    expect(findProjectIdByTaskName("sod-827 algo", projects)).toBe("soda");
  });

  it("devuelve null si no coincide o es ambiguo", () => {
    expect(findProjectIdByTaskName("XYZ-1 algo", projects)).toBeNull();
    expect(findProjectIdByTaskName("Daily", projects)).toBeNull();
    expect(findProjectIdByTaskName("DUP-1 algo", projects)).toBeNull();
  });
});
