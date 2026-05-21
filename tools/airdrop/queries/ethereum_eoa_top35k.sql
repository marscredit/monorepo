-- DEPRECATED for Community tier: times out (2 min) due to JOINs + full-day scan.
-- Use tiered queries instead: ethereum_tier1_whales.sql … ethereum_tier4.sql
-- Then: npm run dune:merge
--
-- Addresses are varbinary — do not use LOWER(); compare as 0x literals.

WITH latest_day AS (
  SELECT MAX(day) AS day
  FROM tokens_ethereum.balances_daily
  WHERE day >= CURRENT_DATE - INTERVAL '3' DAY
),

holders AS (
  SELECT
    b.address,
    b.balance / 1e18 AS eth_balance
  FROM tokens_ethereum.balances_daily b
  INNER JOIN latest_day d ON b.day = d.day
  WHERE b.token_standard = 'native'
    AND b.balance >= 0.1e18
    AND b.address <> 0x6039e53688da87ebf30b0c84d22fcd6707b0c564
),

filtered AS (
  SELECT h.address, h.eth_balance
  FROM holders h
  LEFT JOIN cex_ethereum.addresses c ON h.address = c.address
  LEFT JOIN ethereum.contracts ec ON h.address = ec.address
  WHERE c.address IS NULL
    AND ec.address IS NULL
    AND h.address NOT IN (
      0x00000000219ab540356cBB839Cbe05303d7705Fa,
      0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
    )
)

SELECT
  address,
  eth_balance
FROM filtered
ORDER BY eth_balance DESC
LIMIT 35000
