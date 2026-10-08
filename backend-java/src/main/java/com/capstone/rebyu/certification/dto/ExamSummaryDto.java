package com.capstone.rebyu.certification.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamSummaryDto {
    private Long examId;
    private String title;
    private String examType;
    private String targetScope;
    private Integer totalQuestions;
    private String status;
}
