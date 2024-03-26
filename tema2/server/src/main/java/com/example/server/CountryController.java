/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.example.server;

import java.util.List;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

/**
 *
 * @author Mocanu Octavian
 */
@RestController
@CrossOrigin(origins = "http://localhost:3001")
public class CountryController {

    private final CountryService countryService;

    public CountryController(CountryService countryService) {
	this.countryService = countryService;
    }

    @GetMapping("/countries")
    public List<Country> getCountries() {
	return countryService.getCountries();
    }

    @PostMapping("/countries")
    public ResponseEntity<Void> addCountry(@RequestBody CountryRequest countryRequest) {

	RestTemplate restTemplate = new RestTemplate();

	// Set headers
	HttpHeaders headers = new HttpHeaders();
	headers.setContentType(MediaType.APPLICATION_JSON);


	HttpEntity<CountryRequest> requestEntity = new HttpEntity<>(countryRequest, headers);

	ResponseEntity<Void> response = restTemplate.postForEntity(
		"http://localhost:3000/countries",
		requestEntity,
		Void.class
	);

	return ResponseEntity.status(response.getStatusCode()).build();
    }

    @DeleteMapping("/countries/{id}")
    public ResponseEntity<Void> deleteCountry(@PathVariable String id) {
	
	try {
	    RestTemplate restTemplate = new RestTemplate();
	    restTemplate.delete("http://localhost:3000/countries/" + id);
	    return ResponseEntity.status(HttpStatus.NO_CONTENT).build(); // If successful, return 204 No Content
	} catch (Exception e) {
	    e.printStackTrace();
	    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build(); // If forwarding fails, return 500 Internal Server Error
	}
    }
}
