# Changelog

## Unreleased

### New Deployments

- Deployed `ProtocolFeeSplitter` to Mainnet.
- Deployed core infrastructure (`Authorizer`, `Vault`, `AuthorizerAdaptor`, `ProtocolFeeWithdrawer`, `ProtocolFeePercentagesProvider`, `BalancerQueries` and `BatchRelayer`) to Gnosis and BNB.
- Deployed core Pool factories (`WeightedPoolFactory`, `ComposableStablePoolFactory`, `LiquidityBootstrappingPool`, `AaveLinearPool`) to BNB.
- Deployed `AuthorizerAdaptorEntrypoint` to all networks.
- Deployed `AaveLinearPoolFactory` to all networks.
- Deployed `PoolRecoveryHelper` to all networks.

### API Changes

- Made `getBalancerContractAbi`, `getBalancerContractBytecode`, `getBalancerContractAddress` and `getBalancerDeployment` synchronous rather than asynchronous functions.

## 3.0.0 (2022-10-25)

### New Deployments

- All deployments that occurred since September 2021, including Linear Pools, Liquidity Mining, Composable Stable Pools and Managed Pools.

### Breaking Changes

- Introduced the `deprecated` directory. Deployments may be moved to that directory in minor releases - this will not be considered a breaking change.

## 2.3.0 (2021-09-24)

### New Deployments

- Deployed `InvestmentPoolFactory` to Mainnet, Polygon and Arbitrum.
- Deployed `MerkleRedeem` to Mainnet for VITA distribution.
- Deployed `MerkleRedeem` to Arbitrum for BAL distribution.

## 2.2.0 (2021-09-15)

### New Features

- Added creation code in the `bytecode` directory of each task.
- Added `getBalancerContractBytecode` to get a contract's creation code, which makes deploying contracts easier to package users.

## 2.1.3 (2021-08-30)

### Fixes

- Fixed inconsistent JSON file loading semantics.

## 2.1.2 (2021-08-30)

### Fixes

- Fixed package paths in published contract loaders.

## 2.1.1 (2021-08-25)

### Fixes

- Added `BalancerHelpers` to the Arbitrum deployment.

## 2.1.0 (2021-08-24)

### New Deployments

- Deployed `Authorizer`, `Vault`, `WeightedPoolFactory`, `WeightedPool2TokensFactory`, `StablePoolFactory`, `LiquidityBootstrappingPoolFactory`, `MetaStablePoolFactory` on Arbitrum mainnet.

## 2.0.0 (2021-08-24)

### New Deployments

- `StablePoolFactory`
- `LiquidityBootstrappingPoolFactory`
- `MetaStablePoolFactory`
- `MerkleRedeem` (for the LDO token)
- `LidoRelayer`
- `WstETHRateProvider`

### Breaking Changes

This release changes the directory structure of the package and introduces the concept of 'tasks'. Refer to [the readme](./README.md) for more information on where artifacts are located, and the different task IDs.
