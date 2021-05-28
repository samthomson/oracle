ALTER TABLE
  `market`
ADD COLUMN `volume_usd` decimal(32,12) DEFAULT NULL AFTER `quote_volume`;
