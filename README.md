# Retreats and Venues Back-end Test Assignment

This brief assignment is meant to test basic knowledge of APIs and databases, but mostly to create a starting point for some hands-on coding during the technical interview (max 1 hour). 

None of your code will be used on our website at any point.

Got a problem? Message me, email me, or WhatsApp me at the contact info provided. 

## Getting Started

### Cloning and setting up `git`

Clone this repo and and re-initialize git to get started.

```bash
git clone git@github.com:retreatsandvenues/technical-assignment-back-end.git
cd technical-assignment-back-end
rm -rf .git
git init
```
### Running the Code

```bash
cd technical-assignment-back-end # if not already there
docker-compose up -d && docker-compose logs -f
```

This should run the API and provide hot-reloading in your editor. Additionally, the SQL contained in `mysql/data.sql` should have been automatically imported to a local database. 

Test the request in Postman or via curl: 

```bash
curl --location --request GET 'http://localhost:4500'
```

Ensure that you get some response back from the server. 

Test that you can connect to the mysql instance with the credentials found in the `db` service of the `docker-compose.yml` file. You should see three tables: 
1. venues
2. users
3. ratings

### Submitting

You may submit via a link to a public GitHub repo of your own, or submit the code as a .zip file if you prefer not to expose it on your profile. 

Send submissions to the same email used in existing correspondence.

## The Assignment

You'll code exclusively in two files:
1. `app.controller.ts`
2. `app.service.ts`

### Return Venues

Rather than returning a string, as has been given as a starting point, return an array of venues. 

I recommend doing this in raw SQL unless you're well versed with knex. We'll be amending this query during the hands-on portion of our interview. 

### Add a Limit
Add a limit parameter that can be passed as part of the URL. 

E.g.
```
curl --location --request GET 'http://localhost:4500/?limit=10'
```

Venues should limit accordingly.

### Add a Test 

...to verify that venues are being returned according to the limit.

--- 



--- 
--- 
--- 
--- 
--- 
--- 

# Admin-only Beyond this Point

## Preparing this Project's Data

Full SQL can be found in the mysql directory. 

Used mockaroo to generate venues: 
https://www.mockaroo.com/schemas/640541

And again to generate users: 
https://www.mockaroo.com/schemas/640542

Ask Corey to regenerate these if needed. 

Import the generated SQL files into mysql. 

--- 

Then ran the following SQL to general related tables:

```sql
-- Make the venues.id and users.id fields auto-increment primary keys
ALTER TABLE venues MODIFY id INT AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE users MODIFY id INT AUTO_INCREMENT PRIMARY KEY;

-- Set user_id column
ALTER TABLE venues ADD COLUMN user_id INT AFTER id;
UPDATE venues SET user_id = ((id-1) % 500) + 1;

-- Add the ratings table and generate random ratings
CREATE TABLE ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venue_id INT,
    user_id INT,
    rating INT,
    FOREIGN KEY (venue_id) REFERENCES venues(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY user_venue_unique (user_id, venue_id)
);

DROP PROCEDURE IF EXISTS GenerateRandomRatings;

DELIMITER $$
CREATE PROCEDURE GenerateRandomRatings()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_id INT;
    DECLARE cur1 CURSOR FOR SELECT id FROM venues;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    OPEN cur1;
    read_loop: LOOP
        FETCH cur1 INTO v_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        SET @RANDOM_NUM = (SELECT FLOOR(RAND() * 40));
        
        -- Insert random ratings for the current venue
        SET @sql = CONCAT('INSERT INTO ratings (venue_id, user_id, rating) ',
                          'SELECT ', v_id, ', id, FLOOR(1 + (RAND() * 5)) ',
                          'FROM users ',
                          'ORDER BY RAND() ',
                          'LIMIT ', @RANDOM_NUM);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END LOOP;
    CLOSE cur1;
END$$
DELIMITER ;

CALL GenerateRandomRatings();
```

```sql
-- Proof
SELECT venue_id, COUNT(*)
FROM ratings
GROUP BY venue_id 
ORDER BY venue_id ASC;
```




