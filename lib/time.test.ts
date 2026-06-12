import { describe, it, expect } from "vitest";
import type { TimeLog } from "../app/types";
import {
  getDayKey,
  groupLogsByDay,
  getDayLabel,
  formatDuration,
  formatDurationEditable,
  parseDurationInput,
  getTotalDuration,
  toDateInputValue,
  combineDateWithTime,
} from "./time";

// Los scripts de test corren con TZ=America/Argentina/Buenos_Aires (UTC-3)
// para que los casos de borde de timezone sean deterministas.

let logCounter = 0;
function makeLog(startTime: string, overrides: Partial<TimeLog> = {}): TimeLog {
  logCounter += 1;
  return {
    id: `log-${logCounter}`,
    taskName: `Tarea ${logCounter}`,
    startTime,
    endTime: startTime,
    duration: 60,
    isLoggedJira: false,
    ...overrides,
  };
}

describe("formatDuration", () => {
  it("muestra solo segundos cuando es menos de un minuto", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(45)).toBe("45s");
  });

  it("muestra minutos y segundos", () => {
    expect(formatDuration(125)).toBe("2m 5s");
    expect(formatDuration(60)).toBe("1m 0s");
  });

  it("muestra horas, minutos y segundos", () => {
    expect(formatDuration(3725)).toBe("1h 2m 5s");
    expect(formatDuration(3600)).toBe("1h 0m 0s");
  });
});

describe("formatDurationEditable", () => {
  it("formatea con padding HH:MM:SS", () => {
    expect(formatDurationEditable(0)).toBe("00:00:00");
    expect(formatDurationEditable(3725)).toBe("01:02:05");
    expect(formatDurationEditable(86399)).toBe("23:59:59");
  });
});

describe("parseDurationInput", () => {
  it("parsea duraciones válidas", () => {
    expect(parseDurationInput("00:00:01")).toBe(1);
    expect(parseDurationInput("01:30:00")).toBe(5400);
    expect(parseDurationInput("1:2:3")).toBe(3723);
  });

  it("es inverso de formatDurationEditable", () => {
    for (const seconds of [0, 59, 60, 3599, 3600, 3725, 86399]) {
      expect(parseDurationInput(formatDurationEditable(seconds))).toBe(seconds);
    }
  });

  it("rechaza formatos inválidos", () => {
    expect(parseDurationInput("")).toBeNull();
    expect(parseDurationInput("90:00")).toBeNull();
    expect(parseDurationInput("aa:bb:cc")).toBeNull();
    expect(parseDurationInput("1:2:3:4")).toBeNull();
  });

  it("rechaza minutos o segundos fuera de rango y negativos", () => {
    expect(parseDurationInput("00:60:00")).toBeNull();
    expect(parseDurationInput("00:00:60")).toBeNull();
    expect(parseDurationInput("-1:00:00")).toBeNull();
    expect(parseDurationInput("00:-1:10")).toBeNull();
  });
});

describe("getTotalDuration", () => {
  it("devuelve 0 para lista vacía", () => {
    expect(getTotalDuration([])).toBe(0);
  });

  it("suma las duraciones", () => {
    const logs = [
      makeLog("2026-06-11T10:00:00.000Z", { duration: 100 }),
      makeLog("2026-06-11T11:00:00.000Z", { duration: 250 }),
    ];
    expect(getTotalDuration(logs)).toBe(350);
  });
});

describe("getDayKey", () => {
  it("asigna la misma key a dos horarios del mismo día local", () => {
    const morning = new Date(2026, 5, 11, 8, 0);
    const night = new Date(2026, 5, 11, 23, 59);
    expect(getDayKey(morning)).toBe(getDayKey(night));
  });

  it("asigna keys distintas a días distintos (borde de medianoche)", () => {
    const beforeMidnight = new Date(2026, 5, 11, 23, 59, 59);
    const afterMidnight = new Date(2026, 5, 12, 0, 0, 1);
    expect(getDayKey(beforeMidnight)).not.toBe(getDayKey(afterMidnight));
  });

  it("agrupa por día LOCAL, no UTC (regresión del fix de timezone)", () => {
    // 2026-06-12T01:30Z son las 22:30 del 11 de junio en Buenos Aires (UTC-3):
    // debe caer en el mismo día que el mediodía local del 11 de junio
    const lateNightUtc = new Date("2026-06-12T01:30:00.000Z");
    const localNoon = new Date(2026, 5, 11, 12, 0);
    expect(getDayKey(lateNightUtc)).toBe(getDayKey(localNoon));
  });
});

describe("groupLogsByDay", () => {
  it("agrupa los logs por día local", () => {
    const logs = [
      makeLog(new Date(2026, 5, 11, 9, 0).toISOString()),
      makeLog(new Date(2026, 5, 11, 15, 0).toISOString()),
      makeLog(new Date(2026, 5, 12, 10, 0).toISOString()),
    ];
    const groups = groupLogsByDay(logs);
    expect(groups.size).toBe(2);
    expect(groups.get(getDayKey(new Date(2026, 5, 11)))).toHaveLength(2);
    expect(groups.get(getDayKey(new Date(2026, 5, 12)))).toHaveLength(1);
  });

  it("ordena los logs de cada día del más reciente al más viejo", () => {
    const early = makeLog(new Date(2026, 5, 11, 9, 0).toISOString());
    const late = makeLog(new Date(2026, 5, 11, 18, 0).toISOString());
    const groups = groupLogsByDay([early, late]);
    const dayLogs = groups.get(getDayKey(new Date(2026, 5, 11)))!;
    expect(dayLogs[0].id).toBe(late.id);
    expect(dayLogs[1].id).toBe(early.id);
  });

  it("devuelve un Map vacío sin logs", () => {
    expect(groupLogsByDay([]).size).toBe(0);
  });
});

describe("getDayLabel", () => {
  const now = new Date(2026, 5, 12, 15, 30); // viernes 12 de junio de 2026

  it("devuelve 'Hoy' para el día actual", () => {
    expect(getDayLabel(getDayKey(now), now)).toBe("Hoy");
  });

  it("devuelve 'Ayer' para el día anterior", () => {
    expect(getDayLabel(getDayKey(new Date(2026, 5, 11)), now)).toBe("Ayer");
  });

  it("devuelve la fecha en es-AR para días anteriores", () => {
    const label = getDayLabel(getDayKey(new Date(2026, 5, 8)), now);
    expect(label).toContain("junio");
    expect(label).toContain("8");
    expect(label).toContain("lunes");
  });
});

describe("toDateInputValue", () => {
  it("extrae YYYY-MM-DD del día local", () => {
    expect(toDateInputValue(new Date(2026, 5, 11, 14, 30).toISOString())).toBe("2026-06-11");
  });

  it("usa el día local aunque el ISO en UTC sea del día siguiente", () => {
    // 01:30Z del 12 de junio = 22:30 del 11 de junio en Buenos Aires
    expect(toDateInputValue("2026-06-12T01:30:00.000Z")).toBe("2026-06-11");
  });
});

describe("combineDateWithTime", () => {
  it("cambia la fecha conservando la hora local original", () => {
    const original = new Date(2026, 5, 11, 14, 30, 45, 123).toISOString();
    const result = combineDateWithTime("2026-06-20", original);
    expect(result).not.toBeNull();
    const combined = new Date(result!);
    expect(combined.getFullYear()).toBe(2026);
    expect(combined.getMonth()).toBe(5);
    expect(combined.getDate()).toBe(20);
    expect(combined.getHours()).toBe(14);
    expect(combined.getMinutes()).toBe(30);
    expect(combined.getSeconds()).toBe(45);
    expect(combined.getMilliseconds()).toBe(123);
  });

  it("devuelve null si la fecha está vacía", () => {
    expect(combineDateWithTime("", new Date().toISOString())).toBeNull();
  });
});
