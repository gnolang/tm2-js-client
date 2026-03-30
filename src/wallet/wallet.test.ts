import { describe, expect, test, vi } from 'vitest';
import {
  ABCIAccount,
  BroadcastTxSyncResult,
  JSONRPCProvider,
  Status,
  TransactionEndpoint,
} from '../provider/index.js';
import { SignTransactionOptions, Wallet } from './wallet.js';
import { EnglishMnemonic, Secp256k1 } from '@cosmjs/crypto';
import {
  defaultAddressPrefix,
  generateEntropy,
  generateKeyPair,
} from './utility/index.js';
import { Bip39 } from '@cosmjs/crypto';
import { KeySigner } from './key/index.js';
import { Signer } from './signer.js';
import { Tx, TxSignature } from '../proto/index.js';
import { Secp256k1PubKeyType } from './types/index.js';
import { Any } from '../proto/google/protobuf/any.js';

describe('Wallet', () => {
  test('createRandom', async () => {
    const wallet: Wallet = await Wallet.createRandom();

    expect(wallet).not.toBeNull();

    const address: string = await wallet.getAddress();

    expect(address).toHaveLength(40);
  });

  test('connect', async () => {
    const mockProvider = {} as JSONRPCProvider;
    const wallet: Wallet = await Wallet.createRandom();

    // Connect the provider
    wallet.connect(mockProvider);

    expect(wallet.getProvider()).toBe(mockProvider);
  });

  test('fromMnemonic', async () => {
    const mnemonic: EnglishMnemonic = new EnglishMnemonic(
      'lens balcony basic cherry half purchase balance soccer solar scissors process eager orchard fatigue rural retire approve crouch repair prepare develop clarify milk suffer'
    );
    const wallet: Wallet = await Wallet.fromMnemonic(mnemonic.toString());

    expect(wallet).not.toBeNull();

    // Fetch the address
    const address: string = await wallet.getAddress();

    expect(address).toBe(
      `${defaultAddressPrefix}1vcjvkjdvckprkcpm7l44plrtg83asfu9geaz90`
    );
  });

  test('fromPrivateKey', async () => {
    const { publicKey, privateKey } = await generateKeyPair(
      Bip39.encode(generateEntropy()).toString(),
      0
    );
    const signer: Signer = new KeySigner(
      privateKey,
      Secp256k1.compressPubkey(publicKey)
    );

    const wallet: Wallet = await Wallet.fromPrivateKey(privateKey);
    const walletSigner: Signer = wallet.getSigner();

    expect(wallet).not.toBeNull();
    expect(await wallet.getAddress()).toBe(await signer.getAddress());
    expect(await walletSigner.getPublicKey()).toEqual(
      await signer.getPublicKey()
    );
  });

  test('getAccountSequence', async () => {
    const mockSequence = 5;
    const mockProvider = {
      getAccountSequence: vi.fn().mockResolvedValue(mockSequence),
    } as unknown as JSONRPCProvider;

    const wallet: Wallet = await Wallet.createRandom();
    wallet.connect(mockProvider);

    const address: string = await wallet.getAddress();
    const sequence: number = await wallet.getAccountSequence();

    expect(mockProvider.getAccountSequence).toHaveBeenCalledWith(
      address,
      undefined
    );
    expect(sequence).toBe(mockSequence);
  });

  test('getAccountNumber', async () => {
    const mockAccountNumber = 10;
    const mockProvider = {
      getAccountNumber: vi.fn().mockResolvedValue(mockAccountNumber),
    } as unknown as JSONRPCProvider;

    const wallet: Wallet = await Wallet.createRandom();
    wallet.connect(mockProvider);

    const address: string = await wallet.getAddress();
    const accountNumber: number = await wallet.getAccountNumber();

    expect(mockProvider.getAccountNumber).toHaveBeenCalledWith(
      address,
      undefined
    );
    expect(accountNumber).toBe(mockAccountNumber);
  });

  test('getBalance', async () => {
    const mockBalance = 100;
    const mockProvider = {
      getBalance: vi.fn().mockResolvedValue(mockBalance),
    } as unknown as JSONRPCProvider;

    const wallet: Wallet = await Wallet.createRandom();
    wallet.connect(mockProvider);

    const address: string = await wallet.getAddress();
    const balance: number = await wallet.getBalance();

    expect(mockProvider.getBalance).toHaveBeenCalledWith(address, 'ugnot');
    expect(balance).toBe(mockBalance);
  });

  test('getGasPrice', async () => {
    const mockGasPrice = 1000;
    const mockProvider = {
      getGasPrice: vi.fn().mockResolvedValue(mockGasPrice),
    } as unknown as JSONRPCProvider;

    const wallet: Wallet = await Wallet.createRandom();
    wallet.connect(mockProvider);

    const gasPrice: number = await wallet.getGasPrice();

    expect(mockProvider.getGasPrice).toHaveBeenCalled();
    expect(gasPrice).toBe(mockGasPrice);
  });

  test('estimateGas', async () => {
    const mockTxEstimation = 1000;
    const mockTx = {} as Tx;
    const mockProvider = {
      estimateGas: vi.fn().mockResolvedValue(mockTxEstimation),
    } as unknown as JSONRPCProvider;

    const wallet: Wallet = await Wallet.createRandom();
    wallet.connect(mockProvider);

    const estimation: number = await wallet.estimateGas(mockTx);

    expect(mockProvider.estimateGas).toHaveBeenCalledWith(mockTx);
    expect(estimation).toBe(mockTxEstimation);
  });

  test('signTransaction', async () => {
    const mockTx = {
      signatures: [],
      fee: {
        gas_fee: '10',
        gas_wanted: 10n,
      },
      messages: [],
    } as unknown as Tx;

    const mockStatus = {
      node_info: {
        version_set: [],
        version: '',
        net_address: '',
        software: '',
        channels: '',
        monkier: '',
        other: {
          tx_index: '',
          rpc_address: '',
        },
        network: 'testchain',
      },
    } as unknown as Status;

    const mockAccount: ABCIAccount = {
      BaseAccount: {
        address: '',
        coins: '',
        public_key: null,
        account_number: '',
        sequence: '',
      },
    };
    const mockProvider = {
      getStatus: vi.fn().mockResolvedValue(mockStatus),
      getAccount: vi.fn().mockResolvedValue(mockAccount),
    } as unknown as JSONRPCProvider;

    const wallet: Wallet = await Wallet.createRandom();
    wallet.connect(mockProvider);

    const emptyDecodeCallback = (_: Any[]): any[] => {
      return [];
    };
    const signedTx: Tx = await wallet.signTransaction(
      mockTx,
      emptyDecodeCallback
    );

    expect(mockProvider.getStatus).toHaveBeenCalled();
    expect(mockProvider.getAccount).toHaveBeenCalled();

    expect(signedTx.signatures).toHaveLength(1);

    const sig: TxSignature = signedTx.signatures[0];
    expect(sig.pub_key?.type_url).toBe(Secp256k1PubKeyType);
    expect(sig.pub_key?.value).not.toBeNull();
    expect(sig.signature).not.toBeNull();
  });

  test('signTransactionWithAllOpts', async () => {
    const mockTx = {
      signatures: [],
      fee: {
        gas_fee: '10',
        gas_wanted: 10n,
      },
      messages: [],
    } as unknown as Tx;

    const opts: SignTransactionOptions = {
      accountNumber: '42',
      sequence: '42',
    };

    const mockStatus = {
      node_info: {
        version_set: [],
        version: '',
        net_address: '',
        software: '',
        channels: '',
        monkier: '',
        other: {
          tx_index: '',
          rpc_address: '',
        },
        network: 'testchain',
      },
    } as unknown as Status;

    const mockAccount: ABCIAccount = {
      BaseAccount: {
        address: '',
        coins: '',
        public_key: null,
        account_number: '',
        sequence: '',
      },
    };
    const mockProvider = {
      getStatus: vi.fn().mockResolvedValue(mockStatus),
      getAccount: vi.fn().mockResolvedValue(mockAccount),
    } as unknown as JSONRPCProvider;

    const wallet: Wallet = await Wallet.createRandom();
    wallet.connect(mockProvider);

    const emptyDecodeCallback = (_: Any[]): any[] => {
      return [];
    };
    const signedTx: Tx = await wallet.signTransaction(
      mockTx,
      emptyDecodeCallback,
      opts
    );

    expect(mockProvider.getStatus).toHaveBeenCalled();
    expect(mockProvider.getAccount).not.toHaveBeenCalled();

    expect(signedTx.signatures).toHaveLength(1);

    const sig: TxSignature = signedTx.signatures[0];
    expect(sig.pub_key?.type_url).toBe(Secp256k1PubKeyType);
    expect(sig.pub_key?.value).not.toBeNull();
    expect(sig.signature).not.toBeNull();
  });

  test('sendTransaction', async () => {
    const mockTx = {
      signatures: [],
      fee: {
        gas_fee: '10',
        gas_wanted: 10n,
      },
      messages: [],
      memo: '',
    } as unknown as Tx;

    const mockTxHash = 'tx hash';

    const mockStatus = {
      node_info: {
        version_set: [],
        version: '',
        net_address: '',
        software: '',
        channels: '',
        monkier: '',
        other: {
          tx_index: '',
          rpc_address: '',
        },
        network: 'testchain',
      },
    } as unknown as Status;

    const mockTransaction: BroadcastTxSyncResult = {
      error: null,
      data: null,
      Log: '',
      hash: mockTxHash,
    };

    const mockProvider = {
      getStatus: vi.fn().mockResolvedValue(mockStatus),
      getAccountNumber: vi.fn().mockResolvedValue(10),
      getAccountSequence: vi.fn().mockResolvedValue(10),
      sendTransaction: vi.fn().mockResolvedValue(mockTransaction),
    } as unknown as JSONRPCProvider;

    const wallet: Wallet = await Wallet.createRandom();
    wallet.connect(mockProvider);

    const tx: BroadcastTxSyncResult = await wallet.sendTransaction(
      mockTx,
      TransactionEndpoint.BROADCAST_TX_SYNC
    );

    expect(tx.hash).toBe(mockTxHash);
  });
});
