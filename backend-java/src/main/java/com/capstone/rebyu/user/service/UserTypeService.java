package com.capstone.rebyu.user.service;

import com.capstone.rebyu.user.dto.UserTypeDto;
import com.capstone.rebyu.user.mapper.UserTypeMapper;
import com.capstone.rebyu.user.entity.UserType;
import com.capstone.rebyu.user.repository.UserTypeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserTypeService {
    private final UserTypeRepository userTypeRepository;
    private final com.capstone.rebyu.common.CascadeDeleteService cascade;
    private final UserTypeMapper userTypeMapper;

    public List<UserTypeDto> getAll() {
        return userTypeRepository.findAll().stream().map(userTypeMapper::toDto).toList();
    }

    public UserTypeDto getById(Long id) {
        return userTypeMapper.toDto(findEntity(id));
    }

    public UserTypeDto create(UserTypeDto dto) {
        UserType entity = userTypeMapper.toEntity(dto);
        entity.setUserTypeId(null);
        return userTypeMapper.toDto(userTypeRepository.save(entity));
    }

    public UserTypeDto update(Long id, UserTypeDto dto) {
        findEntity(id);
        UserType entity = userTypeMapper.toEntity(dto);
        entity.setUserTypeId(id);
        return userTypeMapper.toDto(userTypeRepository.save(entity));
    }

    public void delete(Long id) {
        var type = findEntity(id);
        long used = cascade.countReferences("user_types", id);
        if (used > 0) {
            throw new com.capstone.rebyu.common.BusinessRuleException.InUseException(
                    "This user type is used by " + used + " account" + (used == 1 ? "" : "s")
                    + ". Change those accounts' type first.");
        }
        userTypeRepository.delete(type);
    }

    private UserType findEntity(Long id) {
        return userTypeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("UserType not found: " + id));
    }
}
