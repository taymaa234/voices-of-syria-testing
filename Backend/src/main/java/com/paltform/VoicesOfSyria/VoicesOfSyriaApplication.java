package com.paltform.VoicesOfSyria;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class VoicesOfSyriaApplication {

	public static void main(String[] args) {
		SpringApplication.run(VoicesOfSyriaApplication.class, args);
	}

}
