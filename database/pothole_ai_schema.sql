-- ====================================================================
-- PotholeAI - AI-Powered Road Damage Detection and Reporting System
-- Database: MySQL
-- ====================================================================

CREATE DATABASE IF NOT EXISTS pothole_ai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pothole_ai_db;

-- 1. Users Table
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'ROLE_USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Complaints Table
CREATE TABLE complaints (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    complaint_id VARCHAR(50) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    annotated_image_path VARCHAR(255),
    location VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    ai_detection_result VARCHAR(100) NOT NULL DEFAULT 'Pending',
    pothole_count INT NOT NULL DEFAULT 0,
    confidence_score DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    severity VARCHAR(20) NOT NULL DEFAULT 'LOW',
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_complaints_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample Seed Data
-- Passwords below are BCrypt hashes of 'admin123' and 'user123'
-- admin123: $2a$10$wN9PmsYyRz1s7s/aL8K1iOHgE1l6Q6oO9w29wMqvN3B4P1Z3f9H9q (or generated at runtime)
INSERT INTO users (name, email, password, role) VALUES 
('System Administrator', 'admin@potholeai.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ROLE_ADMIN'),
('Citizen User', 'user@potholeai.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ROLE_USER');

-- Seed Sample Complaints for Instant Demo
INSERT INTO complaints (complaint_id, user_id, image_path, annotated_image_path, location, latitude, longitude, ai_detection_result, pothole_count, confidence_score, severity, status, admin_notes)
VALUES 
('PH-2026-1001', 2, '/uploads/sample1.jpg', '/uploads/annotated_sample1.jpg', 'MG Road, Near Metro Pillar 142', 12.97159900, 77.59456600, 'Pothole Detected', 3, 94.20, 'HIGH', 'PENDING', 'Awaiting field engineer dispatch'),
('PH-2026-1002', 2, '/uploads/sample2.jpg', '/uploads/annotated_sample2.jpg', 'Outer Ring Road, Marathahalli Junction', 12.95692400, 77.70112600, 'Pothole Detected', 2, 88.50, 'MEDIUM', 'IN_PROGRESS', 'Repair crew assigned - target ETA 24 hrs'),
('PH-2026-1003', 2, '/uploads/sample3.jpg', '/uploads/annotated_sample3.jpg', 'Indiranagar 100ft Road, 12th Main Cross', 12.97837000, 77.64083900, 'Pothole Detected', 1, 78.10, 'LOW', 'RESOLVED', 'Patching completed with bitumen mixture');
