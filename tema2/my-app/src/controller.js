import React, { useState, useEffect } from 'react';

function CountryTable() {
    const [countries, setCountries] = useState([]);
    const [newCountryName, setNewCountryName] = useState('');
    const [newCountryPopulation, setNewCountryPopulation] = useState('');
    const [newCityNames, setNewCityNames] = useState([]);

    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        try {
            const response = await fetch('http://localhost:8085/countries');
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            const data = await response.json();
            const countriesWithCities = await Promise.all(data.map(async (country) => {
                const citiesResponse = await fetch(`http://localhost:8085/countries/${country.id}/cities`);
                if (!citiesResponse.ok) {
                    throw new Error('Failed to fetch cities for country');
                }
                const citiesData = await citiesResponse.json();
                return { ...country, cities: citiesData };
            }));
            setCountries(countriesWithCities);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleCountryClick = async (name) => {
        try {
            const response = await fetch(`http://localhost:8085/countries/${name}/info`);
            if (!response.ok) {
                throw new Error('Failed to fetch country info');
            }
            const data = await response.json();
            // Redirect to new page with country info
            window.location.href = `/countries/${name}/info`;
        } catch (error) {
            console.error('Error fetching country info:', error);
        }
    };

    const handleDeleteCountry = async (id) => {
        try {
            const response = await fetch(`http://localhost:8085/countries/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error('Failed to delete country');
            }
            // Refresh countries after successful deletion
            fetchCountries();
        } catch (error) {
            console.error('Error deleting country:', error);
        }
    };

   
    const handleAddCountry = async () => {
        try {
            const response = await fetch('http://localhost:8085/countries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: newCountryName,
                    population: 1
                })
            });
            if (!response.ok) {
                throw new Error('Failed to add country');
            }
            // Refresh countries after successful addition
            fetchCountries();
            // Clear input fields
            setNewCountryName('');
        } catch (error) {
            console.error('Error adding country:', error);
        }
    };

    const handleAddCity = async (countryId, name) => {
        try {
            const response = await fetch(`http://localhost:8085/countries/${countryId}/cities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    population: 1
                })
            });
            if (!response.ok) {
                throw new Error('Failed to add city');
            }
            // Refresh countries after successful addition of city
            fetchCountries();
            // Clear input field
            setNewCityNames([...newCityNames, '']);
        } catch (error) {
            console.error('Error adding city:', error);
        }
    };

    const handleNewCityNameChange = (index, value) => {
        setNewCityNames(prevCityNames => {
            const newCityNamesCopy = [...prevCityNames]; 
            newCityNamesCopy[index] = value; 
            return newCityNamesCopy; 
        });
    };

    return (
        <div>
            <h1>Country Table</h1>
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>Country</th>
                            <th>Cities</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {countries.map((country, index) => (
                            <tr key={index}>
                                <td onClick={() => handleCountryClick(country.name)} style={{ cursor: 'pointer' }}>
                                    {country.name}
                                </td>
                                <td>
                                    {country.cities ? (
                                        <span>
                                            {country.cities.map((city, index) => (
                                                <span>
                                                    <a href={`/countries/${country.name}/cities/${city.name}/weather`} style={{ textDecoration: 'none', color: 'inherit' }}>{city.name}</a>

                                                    {index !== country.cities.length - 1 && ", "}
                                                </span>
                                            ))}
                                        </span>
                                    ) : (
                                        "Loading cities..."
                                    )}
                                </td>
                                <td>
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="City Name"
                                            value={newCityNames[index]}
                                            onChange={(e) => handleNewCityNameChange(index, e.target.value)}
                                        />
                                        <button onClick={() => handleAddCity(country.id, newCityNames[index])}>Add City</button>
                                    </div>
                                </td>
                                <td>
                                    <button onClick={() => handleDeleteCountry(country.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div>
                    <h2>Add Country</h2>
                    <input
                        type="text"
                        placeholder="Country Name"
                        value={newCountryName}
                        onChange={(e) => setNewCountryName(e.target.value)}
                    />

                    <button onClick={handleAddCountry}>Add Country</button>
                </div>

            </div>
        </div>
    );


}

export default CountryTable;
