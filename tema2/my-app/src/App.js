import logo from './logo.svg';
import './App.css';
import React from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
} from "react-router-dom";
import CountryTable from './controller';
import CountryInfo from './info';
import CityWeather from './weather'

function App() {
  return (
      <Router>
          <Routes>
              <Route path="/countries" element={<CountryTable />} />
              <Route path="/countries/:name/info" element={<CountryInfo />} />
              <Route path="/countries/:countryName/cities/:cityName/weather" element={<CityWeather />} />
          </Routes>
      </Router>
  );
}

export default App;
