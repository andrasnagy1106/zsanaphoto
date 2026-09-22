UPDATE "services"
SET
	"description" = 'Óvodai, iskolai és céges csoportos fotózás, személyes egyeztetéssel.',
	"updated_at" = now()
WHERE
	"slug" = 'intezmenyi-fotozas'
	AND "description" = 'Óvodai, iskolai és céges csoportos fotózás, egyedi ajánlat alapján.';