UPDATE inventory
SET
    inv_image = REPLACE(inv_image, '/vehicles///vehicles/', '/images/vehicles/'),
    inv_thumbnail = REPLACE(inv_thumbnail, '/vehicles///vehicles/', '/images/vehicles/'); 

-- Verificar que la ruta se haya actualizado (ej. para el Batmobile)
SELECT inv_image, inv_thumbnail
FROM inventory
WHERE inv_make = 'Batmobile';