ALTER TABLE
  `market`
ADD COLUMN quote varchar(8) NOT NULL AFTER name,
ADD COLUMN source_id smallint NOT NULL AFTER id;
