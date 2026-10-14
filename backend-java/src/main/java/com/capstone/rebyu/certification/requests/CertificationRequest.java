package com.capstone.rebyu.certification.requests;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public record CertificationRequest(String title, String description, String department, List<MultipartFile> files) {
}
