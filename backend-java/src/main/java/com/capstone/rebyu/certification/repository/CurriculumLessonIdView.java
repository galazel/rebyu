package com.capstone.rebyu.certification.repository;

/**
 * A lesson's place in the curriculum, without the lesson.
 *
 * <p>Progress only ever needs to count lessons and know which lessons, middle
 * categories and major categories are the certification's own. Loading
 * {@code Lesson} entities to answer that is disproportionate: every row drags
 * its {@code lesson_component_structure} JSONB with it -- the lesson's entire
 * authored content, tens of kilobytes apiece -- so counting a 100-lesson
 * certification meant pulling several megabytes of teaching material into
 * memory to take its {@code size()}.
 *
 * <p>A projection reads four ids per row and no content at all.
 */
public interface CurriculumLessonIdView {

    Long getLessonId();

    Long getMiddleCategoryId();

    Long getMajorCategoryId();
}
