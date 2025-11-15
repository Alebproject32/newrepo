-- Tasks 
-- Task One - Write SQL Statements

-- #1 Insert Statement
INSERT INTO account (
    account_firstname,
    account_lastname,
    account_email,
    account_password
)
VALUES (
    'Tony',
    'Stark',
    'tony@starkent.com',
    'Iam1ronM@n'
);

-- #2 Modify Statement account_type to "Admin"
UPDATE account
SET account_type = 'Admin'
WHERE account_firstname = 'Tony' AND account_lastname = 'Stark';

-- #3 Delete Statement from the database
DELETE FROM account
WHERE account_firstname = 'Tony' AND account_lastname = 'Stark';

-- #4 Modify the "GM Hummer" record
UPDATE inventory
SET inv_description = REPLACE(inv_description, 'the small interiors', 'an enormous interior')
WHERE inv_make = 'GM' AND inv_model = 'Hummer';

-- #5 Select Make, Model and Classification with "INNER JOIN"
SELECT 
    inv_make,
    inv_model,
    classification_name
FROM inventory
INNER JOIN classification
    ON inventory.classification_id = classification.classification_id
WHERE classification.classification_name = 'Sport';

-- #6 Update using "REPLACE"
UPDATE inventory
SET
    inv_image = REPLACE(inv_image, '/vehicles///vehicles/', '/images/vehicles/'),
    inv_thumbnail = REPLACE(inv_thumbnail, '/vehicles///vehicles/', '/images/vehicles/'); 