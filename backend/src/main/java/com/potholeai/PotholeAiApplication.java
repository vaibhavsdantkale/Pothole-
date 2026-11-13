package com.potholeai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PotholeAiApplication {

    public static void main(String[] args) {
        SpringApplication.run(PotholeAiApplication.class, args);
        System.out.println("=================================================================");
        System.out.println("  PotholeAI Backend Server Started Successfully on Port 8080");
        System.out.println("  Web UI: http://localhost:8080/");
        System.out.println("  API Base: http://localhost:8080/api");
        System.out.println("=================================================================");
    }
}
