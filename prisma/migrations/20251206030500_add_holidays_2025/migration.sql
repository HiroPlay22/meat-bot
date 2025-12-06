-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "region" VARCHAR(4) NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- 2025 Holidays (bundesweit + Bundeslaender)
INSERT INTO "Holiday" ("id", "date", "name", "region") VALUES
  -- Bundesweit
  (md5(random()::text), '2025-01-01', 'Neujahr', 'DE'),
  (md5(random()::text), '2025-04-18', 'Karfreitag', 'DE'),
  (md5(random()::text), '2025-04-21', 'Ostermontag', 'DE'),
  (md5(random()::text), '2025-05-01', 'Tag der Arbeit', 'DE'),
  (md5(random()::text), '2025-05-29', 'Christi Himmelfahrt', 'DE'),
  (md5(random()::text), '2025-06-09', 'Pfingstmontag', 'DE'),
  (md5(random()::text), '2025-10-03', 'Tag der Deutschen Einheit', 'DE'),
  (md5(random()::text), '2025-12-25', '1. Weihnachtstag', 'DE'),
  (md5(random()::text), '2025-12-26', '2. Weihnachtstag', 'DE'),

  -- Landes-Feiertage
  (md5(random()::text), '2025-01-06', 'Heilige Drei Koenige', 'BW'),
  (md5(random()::text), '2025-01-06', 'Heilige Drei Koenige', 'BY'),
  (md5(random()::text), '2025-01-06', 'Heilige Drei Koenige', 'ST'),

  (md5(random()::text), '2025-03-08', 'Internationaler Frauentag', 'BE'),

  (md5(random()::text), '2025-06-19', 'Fronleichnam', 'BW'),
  (md5(random()::text), '2025-06-19', 'Fronleichnam', 'BY'),
  (md5(random()::text), '2025-06-19', 'Fronleichnam', 'HE'),
  (md5(random()::text), '2025-06-19', 'Fronleichnam', 'NW'),
  (md5(random()::text), '2025-06-19', 'Fronleichnam', 'RP'),
  (md5(random()::text), '2025-06-19', 'Fronleichnam', 'SL'),

  (md5(random()::text), '2025-08-15', 'Mariae Himmelfahrt', 'BY'),
  (md5(random()::text), '2025-08-15', 'Mariae Himmelfahrt', 'SL'),

  (md5(random()::text), '2025-09-20', 'Weltkindertag', 'TH'),

  (md5(random()::text), '2025-10-31', 'Reformationstag', 'BB'),
  (md5(random()::text), '2025-10-31', 'Reformationstag', 'HB'),
  (md5(random()::text), '2025-10-31', 'Reformationstag', 'HH'),
  (md5(random()::text), '2025-10-31', 'Reformationstag', 'MV'),
  (md5(random()::text), '2025-10-31', 'Reformationstag', 'NI'),
  (md5(random()::text), '2025-10-31', 'Reformationstag', 'SN'),
  (md5(random()::text), '2025-10-31', 'Reformationstag', 'ST'),
  (md5(random()::text), '2025-10-31', 'Reformationstag', 'SH'),
  (md5(random()::text), '2025-10-31', 'Reformationstag', 'TH'),

  (md5(random()::text), '2025-11-01', 'Allerheiligen', 'BW'),
  (md5(random()::text), '2025-11-01', 'Allerheiligen', 'BY'),
  (md5(random()::text), '2025-11-01', 'Allerheiligen', 'NW'),
  (md5(random()::text), '2025-11-01', 'Allerheiligen', 'RP'),
  (md5(random()::text), '2025-11-01', 'Allerheiligen', 'SL'),

  (md5(random()::text), '2025-11-19', 'Buss- und Bettag', 'SN');