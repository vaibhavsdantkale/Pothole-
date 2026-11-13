package com.potholeai.util;

import java.time.Year;
import java.util.concurrent.ThreadLocalRandom;

public class ComplaintIdGenerator {

    /**
     * Generates a unique, user-friendly complaint tracking code.
     * Example: PH-2026-89412
     */
    public static String generate() {
        int currentYear = Year.now().getValue();
        int randomDigits = ThreadLocalRandom.current().nextInt(10000, 99999);
        return String.format("PH-%d-%05d", currentYear, randomDigits);
    }
}
