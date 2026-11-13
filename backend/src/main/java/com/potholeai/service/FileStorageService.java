package com.potholeai.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Base64;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    private Path uploadPath;

    @PostConstruct
    public void init() {
        this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not create the upload directory: " + uploadDir, e);
        }
    }

    public String saveOriginalFile(MultipartFile file) throws IOException {
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.jpg");
        String extension = "";
        int dotIdx = originalFilename.lastIndexOf(".");
        if (dotIdx >= 0) {
            extension = originalFilename.substring(dotIdx);
        } else {
            extension = ".jpg";
        }

        String storedFilename = "road_" + UUID.randomUUID().toString().substring(0, 12) + extension;
        Path targetLocation = this.uploadPath.resolve(storedFilename);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/" + storedFilename;
    }

    public String saveBase64Image(String base64Data, String prefix) {
        if (base64Data == null || base64Data.trim().isEmpty()) {
            return null;
        }

        try {
            // Strip data:image/...;base64, prefix if present
            String cleanData = base64Data;
            if (cleanData.contains(",")) {
                cleanData = cleanData.split(",")[1];
            }

            byte[] decodedBytes = Base64.getDecoder().decode(cleanData.trim());
            String filename = prefix + "_" + UUID.randomUUID().toString().substring(0, 12) + ".jpg";
            Path targetLocation = this.uploadPath.resolve(filename);

            try (FileOutputStream fos = new FileOutputStream(targetLocation.toFile())) {
                fos.write(decodedBytes);
            }

            return "/uploads/" + filename;
        } catch (Exception e) {
            System.err.println("[FileStorageService] Failed to save annotated base64 image: " + e.getMessage());
            return null;
        }
    }

    public Path getUploadPath() {
        return uploadPath;
    }
}
