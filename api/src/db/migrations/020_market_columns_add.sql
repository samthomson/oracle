ALTER TABLE
  `market`
ADD COLUMN min_trade_size decimal(32,12) NOT NULL,
ADD COLUMN status varchar(16) NOT NULL,
ADD COLUMN high decimal(32,12) NOT NULL,
ADD COLUMN low decimal(32,12) NOT NULL,
ADD COLUMN quote_volume decimal(32,12) NOT NULL,
ADD COLUMN last_trade_rate decimal(32,12) NOT NULL;
