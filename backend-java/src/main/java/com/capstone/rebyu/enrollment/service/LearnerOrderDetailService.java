package com.capstone.rebyu.enrollment.service;

import com.capstone.rebyu.enrollment.dto.LearnerOrderDetailDto;
import com.capstone.rebyu.enrollment.entity.LearnerOrderDetail;
import com.capstone.rebyu.enrollment.mapper.LearnerOrderDetailMapper;
import com.capstone.rebyu.enrollment.repository.LearnerOrderDetailRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class LearnerOrderDetailService {
    private final LearnerOrderDetailRepository learnerOrderDetailRepository;
    private final com.capstone.rebyu.common.CascadeDeleteService cascade;
    private final LearnerOrderDetailMapper learnerOrderDetailMapper;

    public List<LearnerOrderDetailDto> getAll() {
        log.debug("Fetching all learner order details");
        return learnerOrderDetailRepository.findAll().stream().map(learnerOrderDetailMapper::toDto).toList();
    }

    public List<LearnerOrderDetailDto> getByOrderId(Long orderId) {
        log.debug("Fetching order details for orderId: {}", orderId);
        return learnerOrderDetailRepository.findByOrder_OrderId(orderId)
                .stream().map(learnerOrderDetailMapper::toDto).toList();
    }

    public LearnerOrderDetailDto getById(Long id) {
        log.debug("Fetching learner order detail id: {}", id);
        return learnerOrderDetailMapper.toDto(findEntity(id));
    }

    public LearnerOrderDetailDto create(LearnerOrderDetailDto dto) {
        log.info("Creating new learner order detail");
        LearnerOrderDetail entity = learnerOrderDetailMapper.toEntity(dto);
        entity.setOrderDetailId(null);
        LearnerOrderDetailDto result = learnerOrderDetailMapper.toDto(learnerOrderDetailRepository.save(entity));
        log.info("LearnerOrderDetail created with id: {}", result.getOrderDetailId());
        return result;
    }

    public LearnerOrderDetailDto update(Long id, LearnerOrderDetailDto dto) {
        log.info("Updating learner order detail id: {}", id);
        findEntity(id);
        LearnerOrderDetail entity = learnerOrderDetailMapper.toEntity(dto);
        entity.setOrderDetailId(id);
        LearnerOrderDetailDto result = learnerOrderDetailMapper.toDto(learnerOrderDetailRepository.save(entity));
        log.info("LearnerOrderDetail id: {} updated", id);
        return result;
    }

    public void delete(Long id) {
        log.info("Deleting learner order detail id: {}", id);
        findEntity(id);
        cascade.delete("learner_order_details", "order_detail_id", id);
        log.info("LearnerOrderDetail id: {} deleted", id);
    }

    private LearnerOrderDetail findEntity(Long id) {
        return learnerOrderDetailRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("LearnerOrderDetail not found: " + id));
    }
}
