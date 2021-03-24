
CREATE TABLE IF NOT EXISTS `crunched_market_data` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `market_id` SMALLINT UNSIGNED NOT NULL,
  `ma_thirty_min` decimal(32,12) DEFAULT NULL,
  `ma_ten_hour` decimal(32,12) DEFAULT NULL,
  `last_updated` datetime NOT NULL,

 PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=3;
