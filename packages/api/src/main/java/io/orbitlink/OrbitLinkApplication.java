package io.orbitlink;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class OrbitLinkApplication {

    public static void main(String[] args) {
        SpringApplication.run(OrbitLinkApplication.class, args);
    }
}
