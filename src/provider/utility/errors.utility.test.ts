import {
  expect, test,
} from "vitest";

import * as errors from "../../index.js";
import {
  constructRequestError,
} from "./errors.utility.js";

test.each(Object.entries(errors.stdErrors))("maps %s to its root-exported class with the log", (id, ErrorClass) => {
  const error = constructRequestError(id, "node log");

  expect(error.constructor).toBe(ErrorClass);
  expect(error).toBeInstanceOf(errors.TM2Error);
  expect(error.log).toBe("node log");
  expect(errors).toHaveProperty(id.slice("/std.".length), ErrorClass);
});

test.each([["/std.TxDecodeError", "tx decode error"], ["/std.QueryTimeoutError", "query timeout"]])("uses the upstream message for %s", (id, message) => {
  expect(constructRequestError(id).message).toBe(message);
});

test.each(["/std.FutureError", "toString", "constructor", "__proto__"])("preserves unknown ID %s and its log", (id) => {
  const error = constructRequestError(id, "unknown log");

  expect(error.constructor).toBe(errors.TM2Error);
  expect(error.message).toBe(`unknown error: ${id}`);
  expect(error.log).toBe("unknown log");
});
