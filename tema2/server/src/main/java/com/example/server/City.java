/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.example.server;

/**
 *
 * @author Mocanu Octavian
 */
public class City {

    private String name;
    private int population;

    public City() {
    }

    public City(String name) {
	this.name = name;
	this.population=1;
    }

    public City(String name, int population) {
	this.name = name;
	this.population = population;
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

    @Override
    public String toString() {
	return "City{" + "name=" + name + ", population=" + population + '}';
    }
    
}
