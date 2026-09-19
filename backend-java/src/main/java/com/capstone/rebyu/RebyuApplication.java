package com.capstone.rebyu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RebyuApplication {

	public static void main(String[] args) {
		// Every timestamp in the schema is a LocalDateTime written from
		// LocalDateTime.now(), so the app's clock must be the same wherever it
		// runs: a dev machine in Manila and a UTC container would otherwise
		// disagree by eight hours on "how long ago", which is exactly what a
		// cooldown compares.
		java.util.TimeZone.setDefault(java.util.TimeZone.getTimeZone("Asia/Manila"));
		SpringApplication.run(RebyuApplication.class, args);
	}

}
