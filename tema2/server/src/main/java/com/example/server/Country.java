/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.example.server;

/**
 *
 * @author Mocanu Octavian
 */
public class Country {

    private int id;
    private String name;
    private int population;

    // Constructors, getters, and setters
    public Country() {
    }

    public Country(int id, String name, int population) {
	this.id = id;
	this.name = name;
	this.population = population;
    }

    public int getId() {
	return id;
    }

    public void setId(int id) {
	this.id = id;
    }

    public String getName() {
	return name;
    }

    public void setName(String name) {
	this.name = name;
    }

    public int getPopulation() {
	return population;
    }

    public void setPopulation(int population) {
	this.population = population;
    }
    
}
