-- The demo query. Groups the eleven rows by the presentation printed on each row,
-- so the 40 mg/1 mL concentrate never merges with a premixed dextrose bag.
SELECT
    CASE WHEN presentation LIKE '%Dextrose%' THEN 'premixed bag' ELSE 'concentrate vial' END AS product_form,
    presentation,
    labeler,
    ndc,
    availability,
    update_date,
    resupply_note,
    shortage_reason
FROM stopgap.supply_rows
ORDER BY product_form, availability, labeler, ndc
