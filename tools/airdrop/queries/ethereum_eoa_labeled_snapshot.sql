-- Fast path: labeled top-3500 ETH holders (community snapshot).
-- Completes on Dune Community / MCP (~0.003 credits). Max ~3,500 rows before EOA filter.
-- For 25,000+ recipients, run ethereum_eoa_top35k.sql in the Dune web UI (longer timeout).

SELECT
  user_address AS address,
  balance AS eth_balance,
  label_type,
  label_subtype
FROM dune.yieldfarmers.dataset_top_3500_eth_holders
WHERE LOWER(CAST(user_address AS VARCHAR)) <> LOWER('0x6039e53688da87ebf30b0c84d22fcd6707b0c564')
ORDER BY balance DESC
