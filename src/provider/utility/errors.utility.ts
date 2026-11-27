import {
  stdErrors,
  TM2Error,
} from "../errors/index.js";

/**
 * Constructs the appropriate Tendermint2
 * error based on the error ID.
 * Error IDs come from the package.go registrations copied under
 * scripts/upstream/tm2/pkg/std/ (see `pnpm upstream:sync`).
 * @param {string} errorID the proto ID of the error
 * @param {string} [log] the log associated with the error, if any
 * @returns {TM2Error}
 */
export const constructRequestError = (
  errorID: string,
  log?: string,
): TM2Error => {
  return Object.hasOwn(stdErrors, errorID)
    ? new stdErrors[errorID](log)
    : new TM2Error(`unknown error: ${errorID}`, log);
};
