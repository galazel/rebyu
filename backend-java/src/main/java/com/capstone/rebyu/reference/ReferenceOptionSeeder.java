package com.capstone.rebyu.reference;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Fills each pick-list on first boot with what the frontend used to carry
 * as constants, and leaves a list alone once it has any rows: an admin's
 * edits are never overwritten by a restart.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReferenceOptionSeeder implements ApplicationRunner {

    private final ReferenceOptionRepository options;

    static final List<String> INDUSTRIES = List.of(
            "Information and Communications Technology (ICT)",
            "Business, Management, and Entrepreneurship",
            "Finance, Banking, and Accounting",
            "Human Resources and Institutional Development",
            "Sales, Marketing, and Customer Service",
            "Education and Teacher Development",
            "Healthcare and Allied Health",
            "Pharmacy and Pharmaceutical Services",
            "Dental and Oral Healthcare",
            "Mental Health, Psychology, and Counseling",
            "Social Work and Community Development",
            "Engineering",
            "Architecture, Interior Design, and Environmental Planning",
            "Construction and Skilled Trades",
            "Manufacturing and Industrial Technology",
            "Automotive and Land Transportation",
            "Aviation and Aerospace",
            "Maritime, Seafaring, and Ship Operations",
            "Logistics, Supply Chain, and Customs Administration",
            "Agriculture, Agribusiness, and Food Production",
            "Fisheries and Aquaculture",
            "Forestry, Environment, and Natural Resources",
            "Science, Laboratory, and Research",
            "Chemistry and Chemical Technology",
            "Energy, Electrical Power, and Utilities",
            "Real Estate, Property Management, and Appraisal",
            "Law, Legal Studies, and Paralegal Services",
            "Government, Public Administration, and Civil Service",
            "Criminology, Law Enforcement, and Public Safety",
            "Security and Protective Services",
            "Disaster Risk Reduction and Emergency Services",
            "Hospitality, Tourism, and Travel Services",
            "Culinary Arts, Baking, and Food Services",
            "Beauty, Wellness, and Personal Care",
            "Creative Arts, Design, and Multimedia",
            "Media, Broadcasting, and Communication",
            "Language, Translation, and Communication Skills",
            "Retail, Merchandising, and E-Commerce",
            "Business Process Outsourcing (BPO) and Contact Center Services",
            "Data Analytics, Artificial Intelligence, and Cybersecurity",
            "Sports, Fitness, and Recreation",
            "Religious and Ministry Studies",
            "Other");

    /** Academic colleges first, then the departments of a company. */
    static final List<String> DEPARTMENTS = List.of(
            "College of Computer Studies",
            "College of Information Technology",
            "College of Engineering",
            "College of Business and Accountancy",
            "College of Education",
            "College of Arts and Sciences",
            "College of Nursing and Allied Health Sciences",
            "College of Criminology",
            "College of Hospitality and Tourism Management",
            "College of Law",
            "Graduate School",
            "Senior High School",
            "Information Technology",
            "Human Resources",
            "Finance and Accounting",
            "Operations",
            "Sales and Marketing",
            "Customer Service",
            "Training and Development",
            "Research and Development",
            "Quality Assurance",
            "Other");

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (Map.Entry<String, List<String>> list : Map.of(
                ReferenceOption.KIND_INDUSTRY, INDUSTRIES,
                ReferenceOption.KIND_DEPARTMENT, DEPARTMENTS).entrySet()) {
            if (options.countByKind(list.getKey()) > 0) continue;
            int order = 0;
            for (String label : list.getValue()) {
                options.save(ReferenceOption.builder()
                        .kind(list.getKey()).label(label).sortOrder(++order).active(true).build());
            }
            log.info("Seeded {} {} option(s)", list.getValue().size(), list.getKey());
        }
    }
}
