package com.kuaishou.demo.profile.adapter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ProfileRpcAdapterApplication {

    public static void main(String[] args) {
        // Set KESS division to staging BEFORE Spring initialization
        // This ensures KESS ConfigSourceReader uses staging instead of default central
        System.setProperty("kess.division", "staging");
        System.setProperty("kess.config.division", "staging");
        
        SpringApplication.run(ProfileRpcAdapterApplication.class, args);
    }
}
