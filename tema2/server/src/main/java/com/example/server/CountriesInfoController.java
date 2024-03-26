/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.example.server;

import okhttp3.*;
import org.json.JSONObject;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

/**
 *
 * @author Mocanu Octavian
 */
@RestController
@CrossOrigin(origins = "http://localhost:3001")
public class CountriesInfoController {

    //DoYbuSZgb4uLSotwEkGefS7dU2rP26HZ91x6WyKd
    @GetMapping("/countries/{name}/info")
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
