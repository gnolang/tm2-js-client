import { ABCIAccount, ABCIResponseSimulateTx, BlockInfo } from '../types';
import {
  base64ToUint8Array,
  parseABCI,
  uint8ArrayToBase64,
} from './requests.utility';
import { Provider } from '../provider';
import { Tx } from '../../proto';
import { sha256 } from '@cosmjs/crypto';

/**
 * Extracts the specific balance denomination from the ABCI response
 * @param {string | null} abciData the base64-encoded ABCI data
 * @param {string} denomination the required denomination
 */
export const extractBalanceFromResponse = (
  abciData: string | null,
  denomination: string
): number => {
  // Make sure the response is initialized
  if (!abciData) {
    return 0;
  }

  // Extract the balances
  const balancesRaw = Buffer.from(abciData, 'base64')
    .toString()
    .replace(/"/gi, '');

  // Find the correct balance denomination
  const balances: string[] = balancesRaw.split(',');
  if (balances.length < 1) {
    return 0;
  }

  // Find the correct denomination
  const pattern = new RegExp(`^(\\d+)${denomination}$`);
  for (const balance of balances) {
    const match = balance.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }

  return 0;
};

/**
 * Extracts the account sequence from the ABCI response
 * @param {string | null} abciData the base64-encoded ABCI data
 */
export const extractSequenceFromResponse = (
  abciData: string | null
): number => {
  // Make sure the response is initialized
  if (!abciData) {
    return 0;
  }

  try {
    // Parse the account
    const account: ABCIAccount = parseABCI<ABCIAccount>(abciData);

    return parseInt(account.BaseAccount.sequence, 10);
  } catch (e) {
    // unused case
  }

  // Account not initialized,
  // return default value (0)
  return 0;
};

/**
 * Extracts the account number from the ABCI response
 * @param {string | null} abciData the base64-encoded ABCI data
 */
export const extractAccountNumberFromResponse = (
  abciData: string | null
): number => {
  // Make sure the response is initialized
  if (!abciData) {
    throw new Error('account is not initialized');
  }

  try {
    // Parse the account
    const account: ABCIAccount = parseABCI<ABCIAccount>(abciData);

    return parseInt(account.BaseAccount.account_number, 10);
  } catch (e) {
    throw new Error('account is not initialized');
  }
};

/**
 * Extracts the simulate transaction response from the ABCI response
 * @param {string | null} abciData the base64-encoded ABCI data
 */
export const extractSimulateFromResponse = (
  abciData: string | null
): ABCIResponseSimulateTx => {
  // Make sure the response is initialized
  if (!abciData) {
    throw new Error('abci data is not initialized');
  }

  try {
    // Parse the account
    return parseABCI<ABCIResponseSimulateTx>(abciData);
  } catch (e) {
    throw new Error('account is not initialized');
  }
};

/**
 * Waits for the transaction to be committed to a block in the chain
 * of the specified provider. This helper does a search for incoming blocks
 * and checks if a transaction
 * @param {Provider} provider the provider instance
 * @param {string} hash the base64-encoded hash of the transaction
 * @param {number} [fromHeight=latest] the starting height for the search. If omitted, it is the latest block in the chain
 * @param {number} [timeout=15000] the timeout in MS for the search
 */
export const waitForTransaction = async (
  provider: Provider,
  hash: string,
  fromHeight?: number,
  timeout?: number
): Promise<Tx> => {
  return new Promise(async (resolve, reject) => {
    // Fetch the starting point
    let currentHeight = fromHeight
      ? fromHeight
      : await provider.getBlockNumber();

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

          if (uint8ArrayToBase64(txHash) == hash) {
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

      reject('transaction fetch timeout');
    }, exitTimeout);
  });
};
