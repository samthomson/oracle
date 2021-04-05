CREATE TABLE IF NOT EXISTS `request_logs` (
 `id` int(11) NOT NULL AUTO_INCREMENT,
 `service_int` tinyint(3) UNSIGNED DEFAULT NULL,
 `url` varchar(255) DEFAULT NULL,
 `params` varchar(64) DEFAULT NULL,
 `datetime` datetime NOT NULL,
 PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3;

