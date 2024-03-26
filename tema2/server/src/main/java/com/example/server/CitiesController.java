/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.example.server;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.List;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.json.JSONObject;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

/**
 *
 * @author Mocanu Octavian
 */
@RestController
@CrossOrigin(origins = "http://localhost:3001")
public class CitiesController {

    @GetMapping("/countries/{id}/cities")
    public List<City> getCountries(@PathVariable String id) {
	RestTemplate restTemplate = new RestTemplate();
	try {
	    ResponseEntity<City[]> response = restTemplate.getForEntity("http://localhost:3000/countries/" + id + "/cities", City[].class);
	    return Arrays.asList(response.getBody());
	} catch (HttpClientErrorException.NotFound e) {
	    // Handle case when cities for the country are not found
	    System.out.println("Cities not found for country with ID: " + id);
	    return List.of(); // Return empty list
	}
    }

    @GetMapping("/cities/{cityName}/weather")
    public ResponseEntity<String> getWeatherInfo( @PathVariable String cityName) {
	RestTemplate restTemplate = new RestTemplate();

	// Set headers
	HttpHeaders headers = new HttpHeaders();
	headers.set("X-RapidAPI-Key", "a5243d3531msh1c165287053c68bp189f3cjsn7c1d3b351c40");
	headers.set("X-RapidAPI-Host", "weather-api138.p.rapidapi.com");

	// Build request entity
	RequestEntity<Void> requestEntity;
	try {
	    requestEntity = new RequestEntity<>(headers, HttpMethod.GET, new URI("https://weather-api138.p.rapidapi.com/weather?city_name=" + cityName));
	} catch (URISyntaxException e) {
	    return ResponseEntity.badRequest().body("Invalid URI");
	}

	try {
	    // Send request
	    ResponseEntity<String> response = restTemplate.exchange(requestEntity, String.class);
	    // Extract required data and create new JSON object
	    JSONObject responseBody = new JSONObject(response.getBody());
	    JSONObject weatherData = new JSONObject();
	    weatherData.put("main", responseBody.getJSONArray("weather").getJSONObject(0).getString("main"));
	    weatherData.put("description", responseBody.getJSONArray("weather").getJSONObject(0).getString("description"));
	    weatherData.put("temp", responseBody.getJSONObject("main").getDouble("temp"));
	    weatherData.put("feels_like", responseBody.getJSONObject("main").getDouble("feels_like"));
	    weatherData.put("temp_min", responseBody.getJSONObject("main").getDouble("temp_min"));
	    weatherData.put("temp_max", responseBody.getJSONObject("main").getDouble("temp_max"));
	    weatherData.put("pressure", responseBody.getJSONObject("main").getDouble("pressure"));
	    weatherData.put("humidity", responseBody.getJSONObject("main").getDouble("humidity"));

	    return ResponseEntity.ok(weatherData.toString());
	} catch (Exception e) {
	    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to retrieve country information");
	}
    }

    @PostMapping("/countries/{id}/cities")
    public ResponseEntity<Void> addCountry(@PathVariable String id, @RequestBody City city) {

	RestTemplate restTemplate = new RestTemplate();

	// Set headers
	HttpHeaders headers = new HttpHeaders();
	headers.setContentType(MediaType.APPLICATION_JSON);

	HttpEntity<City> requestEntity = new HttpEntity<>(city, headers);

	ResponseEntity<Void> response = restTemplate.postForEntity(
		"http://localhost:3000/countries/" + id + "/cities",
		requestEntity,
		Void.class
	);

	// Forward response from the remote server
	return ResponseEntity.status(response.getStatusCode()).build();
    }

    @GetMapping("/countries/{id}/cities/{name}/weather1")
    public ResponseEntity<String> getCountriesInfo(@PathVariable String name) {
	OkHttpClient client = new OkHttpClient().newBuilder()
		.build();
	Request request = new Request.Builder()
		.url("https://countryapi.io/api/name/" + name.toLowerCase())
		.method("GET", null)
		.addHeader("Authorization", "Bearer DoYbuSZgb4uLSotwEkGefS7dU2rP26HZ91x6WyKd")
		.build();
	try {
	    Response response = client.newCall(request).execute();
	    String responseBody = response.body().string();
	    JSONObject jsonObject = new JSONObject(responseBody);

	    // Get the name of the first key in the JSON object
	    String firstKey = jsonObject.keys().next();

	    // Get the nested dictionary corresponding to the first key
	    JSONObject nestedObject = jsonObject.getJSONObject(firstKey);

	    // Extract name, population, and capital from the nested dictionary
	    String countryName = nestedObject.optString("name");
	    String population = nestedObject.optString("population");
	    String capital = nestedObject.optString("capital");

	    // Construct a new JSON object 
	    JSONObject selectedFields = new JSONObject();
	    selectedFields.put("name", countryName);
	    selectedFields.put("population", population);
	    selectedFields.put("capital", capital);

	    return ResponseEntity.ok(selectedFields.toString());
	} catch (Exception e) {
	    e.printStackTrace();
	    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to retrieve country information");
	}
    }

}
