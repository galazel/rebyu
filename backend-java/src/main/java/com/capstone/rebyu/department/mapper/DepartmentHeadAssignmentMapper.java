package com.capstone.rebyu.department.mapper;

import com.capstone.rebyu.department.dto.DepartmentHeadAssignmentDto;
import com.capstone.rebyu.department.entity.DepartmentHeadAssignment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DepartmentHeadAssignmentMapper {
    @Mapping(source = "department.departmentId", target = "departmentId")
    @Mapping(source = "user.userId", target = "userId")
    @Mapping(source = "assignedBy.userId", target = "assignedBy")
    @Mapping(source = "user.email", target = "email")
    @Mapping(target = "firstName", ignore = true)
    @Mapping(target = "lastName", ignore = true)
    @Mapping(target = "headRole", ignore = true)
    DepartmentHeadAssignmentDto toDto(DepartmentHeadAssignment entity);

    @Mapping(source = "departmentId", target = "department.departmentId")
    @Mapping(source = "userId", target = "user.userId")
    @Mapping(source = "assignedBy", target = "assignedBy.userId")
    DepartmentHeadAssignment toEntity(DepartmentHeadAssignmentDto dto);
}
