import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function CityWeather() {
    const { countryName, cityName } = useParams();
    const [cityWeather, setCityWeather] = useState(null);
    const [error, setError] = useState(null);
    const apiUrl = `http://localhost:8085/cities/${cityName}/weather`;

    useEffect(() => {
        const fetchCityWeather = async () => {
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }
                const data = await response.json();
                setCityWeather(data);
            } catch (error) {
                setError(error.message);
            }
        };

        fetchCityWeather();
    }, [apiUrl]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            {cityWeather ? (
                <div>
                    <h2>Weather Information</h2>
                    <p>Main: {cityWeather.main}</p>
                    <p>Description: {cityWeather.description}</p>
                    <p>Temperature: {kelvinToCelsius(cityWeather.temp)}°C</p>
                    <p>Minimum Temperature: {kelvinToCelsius(cityWeather.temp_min)}°C</p>
                    <p>Maximum Temperature: {kelvinToCelsius(cityWeather.temp_max)}°C</p>
                    <p>Humidity: {cityWeather.humidity}%</p>
                    <p>Pressure: {cityWeather.pressure} hPa</p>
                    <p>Feels Like: {kelvinToCelsius(cityWeather.feels_like)}°C</p>
                </div>
            ) : (
                <div>Loading...</div>
            )}
        </div>

    );
}

function kelvinToCelsius(kelvin) {
    return kelvin - 273.15;
}


export default CityWeather;
