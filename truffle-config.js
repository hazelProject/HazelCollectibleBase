/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * trufflesuite.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

var HDWalletProvider = require("@truffle/hdwallet-provider");
var mnemonic = ""

const API_URLS = {
  1: 'https://api.etherscan.io/api',
  3: 'https://api-ropsten.etherscan.io/api',
  4: 'https://api-rinkeby.etherscan.io/api',
  5: 'https://api-goerli.etherscan.io/api',
  42: 'https://api-kovan.etherscan.io/api',
  56: 'https://api.bscscan.com/api',
  97: 'https://api-testnet.bscscan.com/api'
}
module.exports = {
	
	api_keys: {
		
	},
  
	plugins: [
		'truffle-contract-size',
		'truffle-plugin-verify',
		'solidity-coverage'
      ],
	networks: {
	  ganache: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
	  gasPrice: 120000000000
    }
  },

  mocha: {
    // timeout: 100000
  },
  compilers: {
    solc: {
		version: "0.8.11",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200
			}
		}
    }
  },
  db: {
    enabled: false
  }
};
