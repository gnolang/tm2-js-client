import {
  sha256,
} from "@cosmjs/crypto";

import {
  Tx,
} from "../../proto/index.js";
import {
  ResponseDeliverTx,
} from "../../proto/tm2/abci.js";
import {
  AccountDecodeError,
  AccountNotInitializedError,
} from "../errors/index.js";
import {
  Provider,
} from "../provider.js";
import {
  ABCIAccount,
  ABCIErrorKey,
  ABCIResponse,
  BlockInfo,
} from "../types/index.js";
import {
  toHexString,
} from "./adapters.js";
import {
  constructRequestError,
} from "./errors.utility.js";
import {
  base64ToUint8Array,
  parseProto,
  uint8ArrayToBase64,
} from "./requests.utility.js";

/**
 * Extracts the specific balance denomination from the ABCI response
 * @param {string | null} abciData the base64-encoded ABCI data
 * @param {string} denomination the required denomination
 */
export const extractBalanceFromResponse = (
  abciData: string | null,
  denomination: string,
): number => {
  // Make sure the response is initialized
  if (!abciData) {
    return 0;
  }

  // Extract the balances
  const balancesRaw = Buffer.from(abciData, "base64")
    .toString()
    .replace(/"/gi, "");

  // Find the correct balance denomination
  const balances: string[] = balancesRaw.split(",");
  if (balances.length < 1) {
    return 0;
  }

  // Find the correct denomination
  for (const balance of balances) {
    const denominationStart = balance.search(/\D/);
    if (denominationStart > 0 && balance.slice(denominationStart) === denomination) {
      return parseInt(balance.slice(0, denominationStart), 10);
    }
  }

  return 0;
};

// Amino encodes uint64 values as decimal strings in JSON.
// This does not validate the numeric range of uint64.
const isUint64String = (value: unknown): boolean =>
  typeof value === "string" && /^[0-9]+$/.test(value);

const hasValidBaseAccount = ({
  BaseAccount: base,
}: ABCIAccount): boolean =>
  base != null
  && isUint64String(base.account_number)
  && isUint64String(base.sequence);

const parseAccountJSON = (abciData: string): ABCIAccount | null => {
  try {
    return JSON.parse(Buffer.from(abciData, "base64").toString());
  }
  catch (e) {
    throw new AccountDecodeError(e);
  }
};

/**
 * Decodes a Base64-encoded ABCI account response.
 *
 * @returns The decoded account, or null if it does not exist.
 * @throws {@link AccountDecodeError} If the response is malformed.
 */
const decodeAccount = (abciData: string | null): ABCIAccount | null => {
  if (!abciData) {
    return null;
  }

  const account = parseAccountJSON(abciData);
  if (account !== null && !hasValidBaseAccount(account)) {
    throw new AccountDecodeError(new Error("invalid BaseAccount in account response"));
  }

  return account;
};

/**
 * Extracts the account sequence from the ABCI response
 * Returns 0 for an uninitialized account; throws AccountDecodeError for malformed data.
 * @param {string | null} abciData the base64-encoded ABCI data
 */
export const extractSequenceFromResponse = (
  abciData: string | null,
): number => {
  const account = decodeAccount(abciData);

  return account ? parseInt(account.BaseAccount.sequence, 10) : 0;
};

/**
 * Extracts the account number from the ABCI response
 * @param {string | null} abciData the base64-encoded ABCI data
 */
export const extractAccountNumberFromResponse = (
  abciData: string | null,
): number => {
  const account = extractAccountFromResponse(abciData);

  return parseInt(account.BaseAccount.account_number, 10);
};

/**
 * Extracts the account from the ABCI response
 * @param {string | null} abciData the base64-encoded ABCI data
 */
export const extractAccountFromResponse = (
  abciData: string | null,
): ABCIAccount => {
  const account = decodeAccount(abciData);
  if (!account) {
    throw new AccountNotInitializedError();
  }

  return account;
};

/**
 * Extracts the simulate transaction response from the ABCI response value
 * @param {string | null} abciData the base64-encoded ResponseDeliverTx proto message
 */
export const extractSimulateFromResponse = (
  abciResponse: ABCIResponse | null,
): ResponseDeliverTx => {
  // Make sure the response is initialized
  if (!abciResponse) {
    throw new Error("abci data is not initialized");
  }

  const error = abciResponse.response?.ResponseBase?.Error;
  if (error && error[ABCIErrorKey]) {
    throw constructRequestError(
      error[ABCIErrorKey],
      abciResponse.response?.ResponseBase?.Log,
    );
  }

  const value = abciResponse.response.Value;
  if (!value) {
    throw new Error("abci data is not initialized");
  }

  try {
    return parseProto(value, ResponseDeliverTx.decode);
  }
  catch (e) {
    throw new Error("unable to parse simulate response", {
      cause: e,
    });
  }
};

/**
 * Waits for the transaction to be committed to a block in the chain
 * of the specified provider. This helper does a search for incoming blocks
 * and checks if a transaction
 * @param {Provider} provider the provider instance
 * @param {string} hash the transaction hash in hexadecimal (case-insensitive) or legacy base64
 * @param {number} [fromHeight=latest] the starting height for the search. If omitted, it is the latest block in the chain
 * @param {number} [timeout=15000] the timeout in MS for the search
 */
export const waitForTransaction = async (
  provider: Provider,
  hash: string,
  fromHeight?: number,
  timeout?: number,
): Promise<Tx> => {
  // Fetch the starting point
  let currentHeight = fromHeight
    ? fromHeight
    : await provider.getBlockNumber();

  return new Promise((resolve, reject) => {
    const exitTimeout = timeout ? timeout : 15000;

    const fetchInterval = setInterval(async () => {
      // Fetch the latest block height
      const latestHeight = await provider.getBlockNumber();

      if (latestHeight < currentHeight) {
        // No need to parse older blocks
        return;
      }

      for (let blockNum = currentHeight; blockNum <= latestHeight; blockNum++) {
        // Fetch the block from the chain
        const block: BlockInfo = await provider.getBlock(blockNum);

        // Check if there are any transactions at all in the block
        if (!block.block.data.txs || block.block.data.txs.length == 0) {
          continue;
        }

        // Find the transaction among the block transactions
        for (const tx of block.block.data.txs) {
          // Decode the base-64 transaction
          const txRaw = base64ToUint8Array(tx);

          // Calculate the transaction hash
          const txHash = sha256(txRaw);

          if (toHexString(txHash) === hash.toUpperCase() || uint8ArrayToBase64(txHash) === hash) {
            // Clear the interval
            clearInterval(fetchInterval);

            // Decode the transaction from amino
            resolve(Tx.decode(txRaw));
          }
        }
      }

      currentHeight = latestHeight + 1;
    }, 1000);

    setTimeout(() => {
      // Clear the fetch interval
      clearInterval(fetchInterval);

      reject("transaction fetch timeout");
    }, exitTimeout);
  });
};
