import {
  BroadcastTxSyncResult,
  JSONRPCProvider,
  Status,
  TransactionEndpoint,
} from '../provider';
import { mock } from 'jest-mock-extended';
import { Wallet } from './wallet';
import { EnglishMnemonic, Secp256k1 } from '@cosmjs/crypto';
import {
  defaultAddressPrefix,
  generateEntropy,
  generateKeyPair,
} from './utility';
import { entropyToMnemonic } from '@cosmjs/crypto/build/bip39';
import { KeySigner } from './key';
import { Signer } from './signer';
import { Tx, TxSignature } from '../proto';
import Long from 'long';
import { Secp256k1PubKeyType } from './types';
import { Any } from '../proto/google/protobuf/any';

describe('Wallet', () => {
  test('createRandom', async () => {
    const wallet: Wallet = await Wallet.createRandom();

    expect(wallet).not.toBeNull();

    const address: string = await wallet.getAddress();

    expect(address).toHaveLength(40);
  });

  test('connect', async () => {
    const mockProvider = mock<JSONRPCProvider>();
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
      entropyToMnemonic(generateEntropy()),
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
    const mockProvider = mock<JSONRPCProvider>();
    mockProvider.getAccountSequence.mockResolvedValue(mockSequence);

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
    const mockProvider = mock<JSONRPCProvider>();
    mockProvider.getAccountNumber.mockResolvedValue(mockAccountNumber);

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
    const mockProvider = mock<JSONRPCProvider>();
    mockProvider.getBalance.mockResolvedValue(mockBalance);

    const wallet: Wallet = await Wallet.createRandom();
    wallet.connect(mockProvider);

    const address: string = await wallet.getAddress();
    const balance: number = await wallet.getBalance();

    expect(mockProvider.getBalance).toHaveBeenCalledWith(address, 'ugnot');
    expect(balance).toBe(mockBalance);
  });

  test('getGasPrice', async () => {
    const mockGasPrice = 1000;
    const mockProvider = mock<JSONRPCProvider>();
    mockProvider.getGasPrice.mockResolvedValue(mockGasPrice);

    const wallet: Wallet = await Wallet.createRandom();
    wallet.connect(mockProvider);

    const gasPrice: number = await wallet.getGasPrice();

    expect(mockProvider.getGasPrice).toHaveBeenCalled();
    expect(gasPrice).toBe(mockGasPrice);
  });

  test('estimateGas', async () => {
    const mockTxEstimation = 1000;
    const mockTx = mock<Tx>();
    const mockProvider = mock<JSONRPCProvider>();
    mockProvider.estimateGas.mockResolvedValue(mockTxEstimation);

    const wallet: Wallet = await Wallet.createRandom();
    wallet.connect(mockProvider);

    const estimation: number = await wallet.estimateGas(mockTx);

    expect(mockProvider.estimateGas).toHaveBeenCalledWith(mockTx);
    expect(estimation).toBe(mockTxEstimation);
  });

  test('signTransaction', async () => {
    const mockTx = mock<Tx>();
    mockTx.signatures = [];
    mockTx.fee = {
      gasFee: '10',
      gasWanted: new Long(10),
    };
    mockTx.messages = [];

    const mockStatus = mock<Status>();
    mockStatus.node_info = {
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
    };

    const mockProvider = mock<JSONRPCProvider>();
    mockProvider.getStatus.mockResolvedValue(mockStatus);
    mockProvider.getAccountNumber.mockResolvedValue(10);
    mockProvider.getAccountSequence.mockResolvedValue(10);

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
    expect(mockProvider.getAccountNumber).toHaveBeenCalled();
    expect(mockProvider.getAccountSequence).toHaveBeenCalled();

    expect(signedTx.signatures).toHaveLength(1);

    const sig: TxSignature = signedTx.signatures[0];
    expect(sig.pubKey?.typeUrl).toBe(Secp256k1PubKeyType);
    expect(sig.pubKey?.value).not.toBeNull();
    expect(sig.signature).not.toBeNull();
  });

  test('sendTransaction', async () => {
    const mockTx = mock<Tx>();
    mockTx.signatures = [];
    mockTx.fee = {
      gasFee: '10',
      gasWanted: new Long(10),
    };
    mockTx.messages = [];
    mockTx.memo = '';

    const mockTxHash = 'tx hash';

    const mockStatus = mock<Status>();
    mockStatus.node_info = {
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
    };

    const mockTransaction: BroadcastTxSyncResult = {
      error: null,
      data: null,
      Log: '',
      hash: mockTxHash,
    };

    const mockProvider = mock<JSONRPCProvider>();
    mockProvider.getStatus.mockResolvedValue(mockStatus);
    mockProvider.getAccountNumber.mockResolvedValue(10);
    mockProvider.getAccountSequence.mockResolvedValue(10);
    mockProvider.sendTransaction.mockResolvedValue(mockTransaction);

    const wallet: Wallet = await Wallet.createRandom();
    wallet.connect(mockProvider);

    const tx: BroadcastTxSyncResult = await wallet.sendTransaction(
      mockTx,
      TransactionEndpoint.BROADCAST_TX_SYNC
    );

    expect(tx.hash).toBe(mockTxHash);
  });
});
