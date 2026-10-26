-- Adapted from the verified PokeAPI create in zetaris/getting-started
-- (open_data/rest_apis/sql/non_rate_limited/02_pokeapi_create.sql).
-- One live REST source. Nothing is copied; an uncached query refetches the endpoint.
CREATE LIGHTNING DATABASE openfda DESCRIBE BY "FDA drug shortages, live REST";

CREATE LIGHTNING REST TABLE dopamine_shortages_raw FROM openfda REQUEST(
    endpoint "https://api.fda.gov/drug/shortages.json?search=generic_name:dopamine&limit=100",
    method "get",
    response_type "json",
    http_encoding "URLENCODED"
) HEADER (
    user-agent "Stopgap hackathon demo"
) BODY ();

CACHE TABLE openfda.dopamine_shortages_raw;

CREATE SCHEMASTORE CONTAINER stopgap;

-- One row per package NDC, using only columns already on the row.
CREATE SCHEMASTORE VIEW supply_rows WITH CONTAINER stopgap AS
SELECT
    meta.last_updated AS file_last_updated,
    r.package_ndc AS ndc,
    r.company_name AS labeler,
    r.presentation AS presentation,
    r.availability AS availability,
    r.status AS status,
    r.update_date AS update_date,
    r.related_info AS resupply_note,
    r.shortage_reason AS shortage_reason,
    r.openfda.rxcui AS rxcui_candidates
FROM openfda.dopamine_shortages_raw
LATERAL VIEW explode(results) AS r;
