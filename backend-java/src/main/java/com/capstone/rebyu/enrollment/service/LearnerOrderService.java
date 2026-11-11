package com.capstone.rebyu.enrollment.service;

import com.capstone.rebyu.enrollment.dto.LearnerOrderDto;
import com.capstone.rebyu.enrollment.entity.LearnerOrder;
import com.capstone.rebyu.enrollment.mapper.LearnerOrderMapper;
import com.capstone.rebyu.enrollment.repository.LearnerOrderRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class LearnerOrderService {
    private final LearnerOrderRepository learnerOrderRepository;
    private final com.capstone.rebyu.common.CascadeDeleteService cascade;
    private final LearnerOrderMapper learnerOrderMapper;

    public List<LearnerOrderDto> getAll() {
        log.debug("Fetching all learner orders");
        return learnerOrderRepository.findAll().stream().map(learnerOrderMapper::toDto).toList();
    }

    public List<LearnerOrderDto> getByLearnerId(Long learnerId) {
        log.debug("Fetching orders for learnerId: {}", learnerId);
        return learnerOrderRepository.findByLearner_LearnerId(learnerId)
                .stream().map(learnerOrderMapper::toDto).toList();
    }

    public LearnerOrderDto getById(Long id) {
        log.debug("Fetching learner order id: {}", id);
        return learnerOrderMapper.toDto(findEntity(id));
    }

    public LearnerOrderDto create(LearnerOrderDto dto) {
        log.info("Creating new learner order");
        LearnerOrder entity = learnerOrderMapper.toEntity(dto);
        entity.setOrderId(null);
        if (entity.getOrderedAt() == null) {
            entity.setOrderedAt(LocalDateTime.now());
        }
        LearnerOrderDto result = learnerOrderMapper.toDto(learnerOrderRepository.save(entity));
        log.info("LearnerOrder created with id: {}", result.getOrderId());
        return result;
    }

    public LearnerOrderDto update(Long id, LearnerOrderDto dto) {
        log.info("Updating learner order id: {}", id);
        findEntity(id);
        LearnerOrder entity = learnerOrderMapper.toEntity(dto);
        entity.setOrderId(id);
        LearnerOrderDto result = learnerOrderMapper.toDto(learnerOrderRepository.save(entity));
        log.info("LearnerOrder id: {} updated", id);
        return result;
    }

    public void delete(Long id) {
        log.info("Deleting learner order id: {}", id);
        findEntity(id);
        cascade.delete("learner_orders", "order_id", id);
        log.info("LearnerOrder id: {} deleted", id);
    }

    private LearnerOrder findEntity(Long id) {
        return learnerOrderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("LearnerOrder not found: " + id));
    }
}
