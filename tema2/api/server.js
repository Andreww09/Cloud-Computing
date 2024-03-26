const http = require('http');
const mysql = require('mysql2');


const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'countries',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET' && req.url === '/countries') {
        getCountries(req, res);
    }
    else if (req.method === 'GET' && req.url.startsWith('/countries/') && req.url.endsWith('/cities')) {
        getCountryCitiesById(req, res);
    }
    else if (req.method === 'GET' && req.url.startsWith('/countries/')) {
        getCountryById(req, res);
    }
    else if (req.method === 'POST' && req.url === '/countries') {
        addCountry(req, res);
    }
    else if (req.method === 'POST' && req.url.startsWith('/countries') && req.url.endsWith('/cities')) {
        addCountryCityById(req, res);
    }
    else if (req.method === 'PUT' && req.url.startsWith('/countries') && req.url.includes('/cities')) {
        updateCountryCities(req, res);
    }
    else if (req.method === 'PUT' && req.url.startsWith('/countries')) {
        updateCountry(req, res);
    }
    else if (req.method === 'DELETE' && req.url.startsWith('/countries') && req.url.includes('/cities')) {
        deleteCountryCity(req, res);
    }
    else if (req.method === 'DELETE' && req.url.startsWith('/countries')) {
        deleteCountry(req, res);
    }
    else {

        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

function getCountries(req, res) {

    pool.getConnection((err, connection) => {
        if (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Internal server error' }));
            return;
        }

        connection.query('SELECT id, name, population FROM countries', (err, results) => {
            connection.release(); // Release the connection back to the pool
            if (err) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Database error' }));
                return;
            }

            res.statusCode = 200;
            res.end(JSON.stringify(results));
        });
    });
}

function getCountryById(req, res) {

    const args = req.url.split('/');
    const countryId = args[2];

    if (checkArgs(req, res, args.length, 4, countryId)) {
        return;
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to database:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error connecting to database');
            return;
        }

        const selectCountryQuery = 'SELECT name, population FROM countries WHERE id = ?';
        connection.query(selectCountryQuery, [countryId], (err, results) => {
            connection.release();
            if (err) {
                console.error('Error fetching country:', err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error fetching country');
                return;
            }

            if (results.length === 0) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Country not found');
                return;
            }

            const country = results;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(country));
        });
    });
}

function getCountryCitiesById(req, res) {
    const args = req.url.split('/');
    const countryId = args[2];

    if (checkArgs(req, res, args.length, 4, countryId)) {
        return;
    }

    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Error connecting to database:', err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error connecting to database');
            return;
        }

        const selectCountryQuery = "SELECT cities.id, cities.name FROM countries_cities \
    JOIN cities ON countries_cities.city_id = cities.id \
    WHERE countries_cities.country_id = ?";
        connection.query(selectCountryQuery, [countryId], (err, results) => {
            connection.release();
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error fetching cities');
                return;
            }

            if (results.length === 0) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Cities not found');
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(results));
        });
    });
}

function addCountry(req, res) {
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        var json = checkJSON(req, res, body);
        if (json === -1) {
            return;
        }
        if (!json.name) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Missing required field: name');
            return;
        }
        if (!json.population) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Missing required field: population');
            return -1;
        }
        const { name, population } = json;

        // Insert the new country into the database
        pool.getConnection((err, connection) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error connecting to database');
                return;
            }
            const checkCountryQuery = 'SELECT COUNT(*) as n \
            FROM countries \
            WHERE name=?';
            connection.query(checkCountryQuery, [name], (err, exists) => {
                if (err) {
                    connection.release();
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error checking country');
                    return;
                }
                if (exists[0]['n'] !== 0) {
                    connection.release();
                    res.writeHead(409, { 'Content-Type': 'text/plain' });
                    res.end('Country already exists');
                    return;
                }
                const insertCountryQuery = 'INSERT INTO countries (name,population) VALUES (?,?)';
                connection.query(insertCountryQuery, [name, population], (err, result) => {
                    connection.release(); // Release the connection after the query
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Error inserting country');
                        return;
                    }
                    const newCountryId = result.insertId;
                    res.writeHead(201, { 'Content-Type': 'text/plain' });
                    res.end('New country inserted with id: ' + newCountryId);
                });
            });
        });
    });
}



function addCountryCityById(req, res) {
    const args = req.url.split('/');
    const countryId = args[2];

    if (checkArgs(req, res, args.length, 4, countryId)) {
        return;
    }
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        console.log(body);
        var json = checkJSON(req, res, body);
        console.log(data);
        if (json === -1) {
            return;
        }
        if (!json.name) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Missing required field: name');
            return;
        }
        if (!json.population) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Missing required field: population');
            return -1;
        }
        const { name, population } = JSON.parse(body);

        if (population < 0) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Invalid population');
            return;
        }

        pool.getConnection((err, connection) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error connecting to database');
                return;
            }

            // check if the country exists
            const checkCountryQuery = 'SELECT COUNT(*) as n \
      FROM countries \
      WHERE id = ?';
            connection.query(checkCountryQuery, [countryId], (err, exists) => {
                if (err) {
                    connection.release();
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error checking country');
                    return;
                }
                if (exists[0]['n'] === 0) {
                    connection.release();
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Country not found');
                    return;
                }
                const checkCityQuery = 'SELECT COUNT(*) as n \
        FROM countries s \
        JOIN countries_cities ss ON s.id = ss.country_id \
        JOIN cities sub ON ss.city_id = sub.id \
        WHERE s.id = ? \
        AND sub.name = ?';
                connection.query(checkCityQuery, [countryId, name], (err, exists) => {
                    if (err) {
                        connection.release();
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Error checking city');
                        return;
                    }
                    if (exists[0]['n'] !== 0) {
                        connection.release();
                        res.writeHead(409, { 'Content-Type': 'text/plain' });
                        res.end('City already exists');
                        return;
                    }

                    const insertCityQuery = 'INSERT INTO cities (name, population ) VALUES(?,?);'
                    connection.query(insertCityQuery, [name, population], (err, result) => {
                        connection.release();
                        if (err) {
                            console.log(err);
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Error inserting city');
                            return;
                        }
                        const newCityId = result.insertId;
                        const insertCountryCityQuery = 'INSERT INTO countries_cities (country_id, city_id ) VALUES(?,?);'
                        connection.query(insertCountryCityQuery, [countryId, newCityId], (err, result) => {
                            connection.release();
                            if (err) {
                                res.writeHead(500, { 'Content-Type': 'text/plain' });
                                res.end('Error inserting country-city relation');
                                return;
                            }
                            res.writeHead(201, { 'Content-Type': 'text/plain' });
                            res.end('New City inserted with id: ' + newCityId);
                        });
                    });
                });
            });
        });
    });
}

function updateCountry(req, res) {
    const args = req.url.split('/');
    const countryId = args[2];

    if (checkArgs(req, res, args.length, 3, countryId)) {
        return;
    }
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        var json = checkJSON(req, res, body);
        if (json === -1) {
            return;
        }
        if (!json.name) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Missing required field: name');
            return;
        }
        if (!json.population) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Missing required field: population');
            return -1;
        }
        const { name, population } = JSON.parse(body);

        pool.getConnection((err, connection) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error connecting to database');
                return;
            }

            // check if the country exists
            const checkCountryQuery = 'SELECT COUNT(*) as n \
      FROM countries \
      WHERE id = ?';
            connection.query(checkCountryQuery, [countryId], (err, exists) => {
                if (err) {
                    connection.release();
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error checking country');
                    return;
                }
                if (exists[0]['n'] === 0) {
                    connection.release();
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Country not found');
                    return;
                }

                const insertCountryQuery = 'UPDATE countries \
        SET name = ?, population=? \
        WHERE id = ?';
                connection.query(insertCountryQuery, [name, population, countryId], (err, result) => {
                    connection.release();
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Error updating country');
                        return;
                    }
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('Country updated');
                });
            });
        });
    });
}


function updateCountryCities(req, res) {

    const args = req.url.split('/');
    const countryId = args[2];
    const cityId = args[4];

    if (checkArgs(req, res, args.length, 5, countryId)) {
        return;
    }
    if (isNaN(cityId)) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid city ID');

        return -1;
    }
    let body = '';

    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        var json = checkJSON(req, res, body);
        if (json === -1) {
            return;
        }
        if (!json.name) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Missing required field: name');
            return;
        }
        if (!json.population) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Missing required field: population');
            return -1;
        }
        const { name, population } = JSON.parse(body);

        pool.getConnection((err, connection) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error connecting to database');
                return;
            }
            const checkCountryQuery = 'SELECT COUNT(*) as n \
      FROM countries \
      WHERE id = ?';
            connection.query(checkCountryQuery, [countryId], (err, exists) => {
                if (err) {
                    connection.release();
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error checking country');
                    return;
                }
                if (exists[0]['n'] === 0) {
                    connection.release();
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Country not found');
                    return;
                }

                const checkCityQuery = 'SELECT COUNT(*) as n \
                FROM countries s \
                JOIN countries_cities ss ON s.id = ss.country_id \
                JOIN cities sub ON ss.city_id = sub.id \
                WHERE s.id = ? \
                AND sub.id = ?';
                connection.query(checkCityQuery, [countryId, cityId], (err, exists) => {
                    if (err) {
                        connection.release();
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Error checking city');
                        return;
                    }

                    if (exists[0]['n'] === 0) {
                        connection.release();
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('City not found');
                        return;
                    }
                    const checkCityQuery = 'SELECT COUNT(*) as n \
                    FROM countries s \
                    JOIN countries_cities ss ON s.id = ss.country_id \
                    JOIN cities sub ON ss.city_id = sub.id \
                    WHERE s.id = ? \
                    AND sub.name = ?';
                    connection.query(checkCityQuery, [countryId, name], (err, exists) => {
                        if (err) {
                            connection.release();
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Error checking city');
                            return;
                        }
                        if (exists[0]['n'] !== 0) {
                            connection.release();
                            res.writeHead(409, { 'Content-Type': 'text/plain' });
                            res.end('City name already exists');
                            return;
                        }
                        const updateCityQuery = 'UPDATE cities \
            SET name=?, population = ? \
            WHERE id = ?';
                        connection.query(updateCityQuery, [name, population, cityId], (err, result) => {
                            connection.release();
                            if (err) {
                                res.writeHead(500, { 'Content-Type': 'text/plain' });
                                res.end('Error updating city');
                                console.log(err);
                                return;
                            }
                            res.writeHead(200, { 'Content-Type': 'text/plain' });
                            res.end('City updated');
                        });
                    });
                });
            });
        });
    });
}



function deleteCountryCity(req, res) {
    const args = req.url.split('/');
    const countryId = args[2];
    const cityId = args[4];

    if (args.length > 5) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
    }

    pool.getConnection((err, connection) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error connecting to database');
            return;
        }

        // check if the country exist
        const checkCountryQuery = 'SELECT COUNT(*) as n \
      FROM countries \
      WHERE id = ?';
        connection.query(checkCountryQuery, [countryId], (err, exists) => {
            if (err) {
                connection.release();
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error checking country');
                return;
            }
            if (exists[0]['n'] === 0) {
                connection.release();
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Country not found');
                return;
            }

            // check if the city exists
            const checkCityQuery = 'SELECT COUNT(*) as n \
          FROM cities \
          WHERE id = ?';
            connection.query(checkCityQuery, [cityId], (err, exists) => {
                if (err) {
                    connection.release();
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error checking city');
                    return;
                }
                if (exists[0]['n'] === 0) {
                    connection.release();
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('City not found');
                    return;
                }
                //delete the relations between cities and the country
                const deleteCitiesQuery = 'DELETE FROM countries_cities \
   WHERE country_id=? and city_id = ?';
                connection.query(deleteCitiesQuery, [countryId, cityId], (err, result) => {
                    connection.release();
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Error country country-city relation');
                        console.log(err);
                        return;
                    }
                    // delete the city with the given id
                    const deleteCityQuery = 'DELETE FROM cities \
            WHERE id = ?';
                    connection.query(deleteCityQuery, [cityId], (err, result) => {
                        connection.release();
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Error deleting city');
                            console.log(err);
                            return;
                        }
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('City deleted');
                    });
                });
            });
        });
    });
}

function deleteCountry(req, res) {
    const args = req.url.split('/');
    const countryId = args[2];

    if (checkArgs(req, res, args.length, 4, countryId)) {
        return;
    }

    pool.getConnection((err, connection) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error connecting to database');
            return;
        }

        // check if the country exists
        const checkCountryQuery = 'SELECT COUNT(*) as n \
      FROM countries \
      WHERE id = ?';
        connection.query(checkCountryQuery, [countryId], (err, exists) => {
            if (err) {
                connection.release();
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error checking country');
                return;
            }
            if (exists[0]['n'] === 0) {
                connection.release();
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Country not found');
                return;
            }
            //delete the relations between cities and the country
            const deleteCitiesQuery = 'DELETE FROM countries_cities \
 WHERE country_id=?';
            connection.query(deleteCitiesQuery, [countryId], (err, result) => {
                connection.release();
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error country country-city relation');
                    console.log(err);
                    return;
                }
                // delete the country's cities
                const deleteCitiesQuery = 'DELETE c FROM cities c\
            JOIN countries_cities cc ON c.id = cc.city_id\
            WHERE cc.country_id = ?;';
                connection.query(deleteCitiesQuery, [countryId], (err, result) => {
                    connection.release();
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Error country cities');
                        console.log(err);
                        return;
                    }



                    // delete the country
                    const deleteCountryQuery = 'DELETE FROM countries \
            WHERE id = ?';
                    connection.query(deleteCountryQuery, [countryId], (err, result) => {
                        connection.release();
                        if (err) {
                            res.writeHead(500, { 'Content-Type': 'text/plain' });
                            res.end('Error deleting country');
                            console.log(err);
                            return;
                        }
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('Country deleted');
                    });
                });
            });
        });
    });
}

function checkArgs(req, res, len, maxLen, countryId) {
    if (len > maxLen) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return -1;
    }

    if (isNaN(countryId)) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid country ID');
        return -1;
    }
}

function checkJSON(req, res, body) {
    try {
        data = JSON.parse(body);
        return data;
    } catch (error) {
        // Handle JSON parsing error
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid JSON format');
        return -1;
    }

}


const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
