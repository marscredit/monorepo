-- Fallback tier: 0.1 – 1 ETH (run once if merge count < 15k)

SELECT
  b.address,
  b.balance / 1e18 AS eth_balance
FROM tokens_ethereum.balances_daily b
WHERE b.day = date_trunc('day', CURRENT_TIMESTAMP)
  AND b.token_standard = 'native'
  AND b.balance >= 0.1e18
  AND b.balance < 1e18
  AND b.address <> 0x6039e53688da87ebf30b0c84d22fcd6707b0c564
ORDER BY b.balance DESC
LIMIT 20000
