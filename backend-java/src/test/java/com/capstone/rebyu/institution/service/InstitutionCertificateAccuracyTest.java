package com.capstone.rebyu.institution.service;

import com.capstone.rebyu.institution.dto.InstitutionCertificateDto;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.institution.mapper.InstitutionCertificateMapper;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class InstitutionCertificateAccuracyTest {
    @Test void readsLiveSeatCountInsteadOfStaleCache() {
        var repo = mock(InstitutionCertificateRepository.class);
        var mapper = mock(InstitutionCertificateMapper.class);
        var seats = mock(SeatLedgerService.class);
        var allocation = new InstitutionCertificate(); allocation.setInstitutionCertId(1L);
        allocation.setUsedSlots(15);
        var dto = new InstitutionCertificateDto(); dto.setTotalSlots(25); dto.setUsedSlots(15);
        when(repo.findAll()).thenReturn(List.of(allocation));
        when(mapper.toDto(allocation)).thenReturn(dto);
        when(seats.usedSeats(1L)).thenReturn(6);
        var result = new InstitutionCertificateService(repo, mapper, seats).getAll().getFirst();
        assertEquals(6, result.getUsedSlots());
        assertEquals(19, result.getRemainingSlots());
    }
}
