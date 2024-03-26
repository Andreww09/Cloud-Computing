import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function CountryInfo() {
  const { name } = useParams();
  const [countryInfo, setCountryInfo] = useState(null);
  const [error, setError] = useState(null);
  const apiUrl = `http://localhost:8085/countries/${name}/info`;

  useEffect(() => {
    const fetchCountryInfo = async () => {
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        setCountryInfo(data);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchCountryInfo();
  }, [apiUrl]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      {countryInfo ? (
        <div>
          <h2>Country Information</h2>
          <p>Name: {countryInfo.name}</p>
          <p>Population: {countryInfo.population}</p>
          <p>Capital: {countryInfo.capital}</p>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

export default CountryInfo;
