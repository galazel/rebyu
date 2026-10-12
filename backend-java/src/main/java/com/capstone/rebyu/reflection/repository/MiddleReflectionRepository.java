package com.capstone.rebyu.reflection.repository;

import com.capstone.rebyu.reflection.entity.MiddleReflection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MiddleReflectionRepository extends JpaRepository<MiddleReflection, Long> {
    Optional<MiddleReflection> findByMiddleCategoryId(Long middleCategoryId);
}
