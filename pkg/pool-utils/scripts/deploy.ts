import { MAX_UINT256, ZERO_ADDRESS } from '@balancer-labs/v2-helpers/src/constants';
import {
  BasePoolRights,
  ManagedPoolRights,
  WeightedPoolType,
} from '@balancer-labs/v2-helpers/src/models/pools/weighted/types';
import WeightedPool from '@balancer-labs/v2-helpers/src/models/pools/weighted/WeightedPool';
import Vault from '@balancer-labs/v2-helpers/src/models/vault/Vault';
import TokenList from '@balancer-labs/v2-helpers/src/models/tokens/TokenList';
import { fp } from '@balancer-labs/v2-helpers/src/numbers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Contract } from 'ethers';
import { DAY, MONTH } from '@balancer-labs/v2-helpers/src/time';
import { deploy } from '@balancer-labs/v2-helpers/src/contract';
import GnosisSafeProxyFactory from '../safe-contracts/build/artifacts/contracts/proxies/GnosisSafeProxyFactory.sol/GnosisSafeProxyFactory.json';
import GnosisSafeL2 from '../safe-contracts/build/artifacts/contracts/GnosisSafeL2.sol/GnosisSafeL2.json';
import DefaultCallbackHandler from '../safe-contracts/build/artifacts/contracts/handler/DefaultCallbackHandler.sol/DefaultCallbackHandler.json';
import SimulateTxAccessor from '../safe-contracts/build/artifacts/contracts/accessors/SimulateTxAccessor.sol/SimulateTxAccessor.json';
import CompatibilityFallbackHandler from '../safe-contracts/build/artifacts/contracts/handler/CompatibilityFallbackHandler.sol/CompatibilityFallbackHandler.json';
import CreateCall from '../safe-contracts/build/artifacts/contracts/libraries/CreateCall.sol/CreateCall.json';
import MultiSend from '../safe-contracts/build/artifacts/contracts/libraries/MultiSend.sol/MultiSend.json';
import MultiSendCallOnly from '../safe-contracts/build/artifacts/contracts/libraries/MultiSendCallOnly.sol/MultiSendCallOnly.json';
import SignMessageLib from '../safe-contracts/build/artifacts/contracts/libraries/SignMessageLib.sol/SignMessageLib.json';
import { ethers } from 'hardhat';
import { Artifact } from 'hardhat/types';

let admin: SignerWithAddress;
let manager: SignerWithAddress;
let other: SignerWithAddress;
let assetManager: Contract;
let pool: WeightedPool;
let allTokens: TokenList;
let vault: Vault;
let poolController: Contract;
const WEIGHTS = [fp(30), fp(40), fp(30)];
const PAUSE_WINDOW_DURATION = MONTH * 3;
const BUFFER_PERIOD_DURATION = MONTH;
const MIN_WEIGHT_CHANGE_DURATION = DAY;
const POOL_SWAP_FEE_PERCENTAGE = fp(0.01);

async function deployControllerAndPool(
  managerAddress: string,
  canTransfer = true,
  canChangeSwapFee = true,
  canUpdateMetadata = true,
  canChangeWeights = true,
  canDisableSwaps = true,
  canSetMustAllowlistLPs = true,
  canSetCircuitBreakers = true,
  canChangeTokens = true,
  canChangeMgmtFees = true,
  swapEnabledOnStart = true,
  protocolSwapFeePercentage = MAX_UINT256
) {
  vault = await Vault.create({
    admin,
    pauseWindowDuration: PAUSE_WINDOW_DURATION,
    bufferPeriodDuration: BUFFER_PERIOD_DURATION,
  });

  allTokens = await TokenList.create(['MKR', 'DAI', 'SNX'], { sorted: true });
  await allTokens.mint({ to: manager, amount: fp(100) });
  await allTokens.mint({ to: other, amount: fp(100) });

  assetManager = await deploy('MockAssetManager', { args: [allTokens.DAI.address] });

  const basePoolRights: BasePoolRights = {
    canTransferOwnership: canTransfer,
    canChangeSwapFee: canChangeSwapFee,
    canUpdateMetadata: canUpdateMetadata,
  };

  const managedPoolRights: ManagedPoolRights = {
    canChangeWeights: canChangeWeights,
    canDisableSwaps: canDisableSwaps,
    canSetMustAllowlistLPs: canSetMustAllowlistLPs,
    canSetCircuitBreakers: canSetCircuitBreakers,
    canChangeTokens: canChangeTokens,
    canChangeMgmtFees: canChangeMgmtFees,
  };

  poolController = await deploy('ManagedPoolController', {
    args: [basePoolRights, managedPoolRights, MIN_WEIGHT_CHANGE_DURATION, managerAddress],
  });
  const assetManagers = Array(allTokens.length).fill(ZERO_ADDRESS);
  assetManagers[allTokens.indexOf(allTokens.DAI)] = assetManager.address;

  const params = {
    vault,
    tokens: allTokens,
    weights: WEIGHTS,
    owner: poolController.address,
    assetManagers,
    swapFeePercentage: POOL_SWAP_FEE_PERCENTAGE,
    poolType: WeightedPoolType.MANAGED_POOL,
    swapEnabledOnStart: swapEnabledOnStart,
    protocolSwapFeePercentage: protocolSwapFeePercentage,
  };
  pool = await WeightedPool.create(params);

  console.log(`ManagedPoolController deployed at: ${poolController.address}`);
  console.log(`WeightedPool deployed at: ${pool.address}`);
}

async function deployByArtifact(artifact: Artifact) {
  const factory = await ethers.getContractFactoryFromArtifact(artifact);
  const instance = await factory.deploy();
  await instance.deployed();

  console.log(`Deployed ${artifact.contractName} at: ${instance.address}`);

  return instance;
}

async function deploySafeContractDeps(): Promise<any> {
  const gnosisSafeFactory = await deployByArtifact(GnosisSafeProxyFactory);
  const gnosisSafeL2 = await deployByArtifact(GnosisSafeL2);
  const defaultCallbackHandler = await deployByArtifact(DefaultCallbackHandler);
  const simulateTxAccessor = await deployByArtifact(SimulateTxAccessor);
  const compatibilityFallbackHandler = await deployByArtifact(CompatibilityFallbackHandler);
  const createCall = await deployByArtifact(CreateCall);
  const multiSend = await deployByArtifact(MultiSend);
  const multiSendCallOnly = await deployByArtifact(MultiSendCallOnly);
  const signMessageLib = await deployByArtifact(SignMessageLib);

  return {
    gnosisSafeFactory,
    gnosisSafeL2,
    defaultCallbackHandler,
  };
}

async function deploySafeContract(singleton: Contract, safeFactory: Contract, defaultFallbackHandler: Contract) {
  const nullAddress = '0x0000000000000000000000000000000000000000';
  const owners = [
    '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0',
    '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
    '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b',
    '0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d',
  ];
  const data = singleton.interface.encodeFunctionData('setup', [
    owners,
    3, // 3/4
    nullAddress,
    '0x',
    defaultFallbackHandler.address,
    nullAddress,
    0,
    nullAddress,
  ]);
  await safeFactory.createProxyWithNonce(singleton.address, data, 0);
  const eventFilter = safeFactory.filters.ProxyCreation();
  const events = await safeFactory.queryFilter(eventFilter);
  const configuredSafeContract = events[0].args[0];

  console.log(`Configured SafeContract deployed at: ${configuredSafeContract}`);

  return configuredSafeContract;
}

async function main() {
  const useSafeContracts = process.env.USE_SAFE_CONTRACTS;
  let managerAddress = '0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0';
  const { gnosisSafeFactory, gnosisSafeL2, defaultCallbackHandler } = await deploySafeContractDeps();
  const configuredSafeAddress = await deploySafeContract(gnosisSafeL2, gnosisSafeFactory, defaultCallbackHandler);

  if (useSafeContracts === 'true') {
    managerAddress = configuredSafeAddress;
  }

  console.log(`Deploying pool and controller with manager ${managerAddress}`);

  await deployControllerAndPool(managerAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
