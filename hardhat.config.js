// Hardhat provides only the local EVM. Use contracts:compile for pinned solc-js.
export default {
  solidity: '0.8.28',
  networks: {
    hardhat: {
      type: 'edr-simulated', chainType: 'l1', hardfork: 'cancun', chainId: 31337,
      throwOnTransactionFailures: false,
    },
  },
};
