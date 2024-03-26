/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 */
package com.example.server;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

/**
 *
 * @author Mocanu Octavian
 */
@SpringBootApplication
public class Server {

    public static void main(String[] args) {
	SpringApplication.run(Server.class, args);
    }

    @Bean
    public RestTemplate restTemplate() {
	return new RestTemplate();
    }
}
