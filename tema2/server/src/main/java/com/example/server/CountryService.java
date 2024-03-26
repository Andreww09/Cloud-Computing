/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.example.server;

import java.util.Arrays;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 *
 * @author Mocanu Octavian
 */
@Service
public class CountryService {

    private final RestTemplate restTemplate;

    public CountryService(RestTemplate restTemplate) {
	this.restTemplate = restTemplate;
    }

    public List<Country> getCountries() {
	ResponseEntity<Country[]> response = restTemplate.getForEntity("http://localhost:3000/countries", Country[].class);
	return Arrays.asList(response.getBody());
    }
}
