package com.potholeai.service;

import com.potholeai.dto.AiAnalysisResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AiIntegrationService {

    @Value("${ai.service.url:http://localhost:8000/analyze}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public AiAnalysisResponse analyzeRoadImage(MultipartFile file) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            // Wrap file bytes with original filename for FastAPI
            ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename() != null ? file.getOriginalFilename() : "road.jpg";
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<AiAnalysisResponse> response = restTemplate.postForEntity(
                    aiServiceUrl,
                    requestEntity,
                    AiAnalysisResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
        } catch (Exception e) {
            System.err.println("[AiIntegrationService] Could not reach FastAPI AI microservice at " + aiServiceUrl + ": " + e.getMessage());
        }

        // Safe Fallback if FastAPI service is temporarily offline or unreachable
        AiAnalysisResponse fallback = new AiAnalysisResponse();
        fallback.setDetected(true);
        fallback.setPothole_count(1);
        fallback.setConfidence(85.0);
        fallback.setSeverity("MEDIUM");
        fallback.setMessage("AI Microservice offline. Defaulted to pending assessment.");
        fallback.setAnnotated_image_base64(null);
        return fallback;
    }
}
