package com.capstone.rebyu.community;

import com.capstone.rebyu.certification.service.S3StorageService;
import com.capstone.rebyu.community.entity.CommunityPost;
import com.capstone.rebyu.community.repository.CommunityCircleMemberRepository;
import com.capstone.rebyu.community.repository.CommunityCircleRepository;
import com.capstone.rebyu.community.repository.CommunityCommentRepository;
import com.capstone.rebyu.community.repository.CommunityPostLikeRepository;
import com.capstone.rebyu.community.repository.CommunityPostReportRepository;
import com.capstone.rebyu.community.repository.CommunityPostRepository;
import com.capstone.rebyu.community.repository.CommunityPostRow;
import com.capstone.rebyu.community.repository.CommunityPostViewRepository;
import com.capstone.rebyu.community.repository.CommunitySavedPostRepository;
import com.capstone.rebyu.community.repository.LearnerCommunityNotificationRepository;
import com.capstone.rebyu.learningtools.entity.LearnerLibraryItem;
import com.capstone.rebyu.learningtools.repository.LearnerLibraryItemRepository;
import com.capstone.rebyu.user.entity.Learner;
import com.capstone.rebyu.user.repository.LearnerRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CommunityServiceTest {

    private static final Long LEARNER_ID = 1L;
    private static final Long OTHER_LEARNER_ID = 99L;
    private static final Long POST_ID = 20L;

    private CommunityPostRepository postRepository;
    private CommunityCircleRepository circleRepository;
    private CommunityCircleMemberRepository circleMemberRepository;
    private CommunityCommentRepository commentRepository;
    private CommunityPostLikeRepository postLikeRepository;
    private CommunitySavedPostRepository savedPostRepository;
    private CommunityPostViewRepository postViewRepository;
    private CommunityPostReportRepository reportRepository;
    private LearnerCommunityNotificationRepository notificationRepository;
    private LearnerLibraryItemRepository libraryItemRepository;
    private LearnerRepository learnerRepository;
    private S3StorageService s3StorageService;
    private CommunityService service;

    @BeforeEach
    void setUp() {
        postRepository = mock(CommunityPostRepository.class);
        circleRepository = mock(CommunityCircleRepository.class);
        circleMemberRepository = mock(CommunityCircleMemberRepository.class);
        commentRepository = mock(CommunityCommentRepository.class);
        postLikeRepository = mock(CommunityPostLikeRepository.class);
        savedPostRepository = mock(CommunitySavedPostRepository.class);
        postViewRepository = mock(CommunityPostViewRepository.class);
        reportRepository = mock(CommunityPostReportRepository.class);
        notificationRepository = mock(LearnerCommunityNotificationRepository.class);
        libraryItemRepository = mock(LearnerLibraryItemRepository.class);
        learnerRepository = mock(LearnerRepository.class);
        s3StorageService = mock(S3StorageService.class);
        service = new CommunityService(postRepository, circleRepository, circleMemberRepository, commentRepository,
                postLikeRepository, savedPostRepository, postViewRepository, reportRepository, notificationRepository,
                libraryItemRepository, learnerRepository, s3StorageService);

        when(postRepository.save(any(CommunityPost.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private CommunityPost sharedQuizPost(String moderationStatus) {
        return sharedStudyPost(moderationStatus, "quiz", "/learner/practice/77");
    }

    private CommunityPost sharedStudyPost(String moderationStatus, String postType, String resourceUrl) {
        LearnerLibraryItem item = LearnerLibraryItem.builder()
                .libraryItemId(5L)
                .itemType(postType)
                .title("Algebra basics")
                .resourceUrl(resourceUrl)
                .build();
        CommunityPost post = CommunityPost.builder()
                .postId(POST_ID)
                .author(Learner.builder().learnerId(LEARNER_ID).firstName("Ana").lastName("Cruz").build())
                .postType(postType)
                .title("Algebra basics")
                .body("Shared quiz")
                .sharedLibraryItem(item)
                .build();
        post.setModerationStatus(moderationStatus);
        return post;
    }

    private CommunityPost visiblePost() {
        return sharedQuizPost("VISIBLE");
    }

    // ---- createPost: several images in one post ----

    private static CommunityService.PostRequest reviewerRequest(List<CommunityService.Attachment> files) {
        CommunityService.Attachment first = files.isEmpty() ? null : files.get(0);
        return new CommunityService.PostRequest("notes", "Diagrams", "Three pages of notes", null,
                first == null ? null : first.name(), "IMAGE", first == null ? null : first.key(),
                first == null ? null : first.size(), files);
    }

    private static List<CommunityService.Attachment> images(int count) {
        return java.util.stream.IntStream.rangeClosed(1, count)
                .mapToObj(i -> new CommunityService.Attachment(
                        "page-" + i + ".png", "community-attachments/page-" + i + ".png", 1000L * i))
                .toList();
    }

    /** The feed row the post is read back through, carrying whatever file list was saved. */
    private void stubReadBack(String attachmentsJson) {
        CommunityPostRow row = mock(CommunityPostRow.class);
        when(row.getPostType()).thenReturn("notes");
        when(row.getAttachmentsJson()).thenReturn(attachmentsJson);
        when(postRepository.findRowById(any(), any())).thenReturn(Optional.of(row));
        when(postRepository.findById(any())).thenReturn(Optional.of(visiblePost()));
    }

    @Test
    void createPost_withSeveralImages_storesAndReturnsEveryFile() {
        List<CommunityService.Attachment> files = images(3);
        stubReadBack(CommunityService.writeAttachments(files));

        CommunityService.Post created = service.createPost(LEARNER_ID, reviewerRequest(files));

        verify(postRepository).save(argThat(post -> post.getAttachmentsJson() != null
                && post.getAttachmentsJson().contains("community-attachments/page-1.png")
                && post.getAttachmentsJson().contains("community-attachments/page-3.png")
                && "community-attachments/page-1.png".equals(post.getAttachmentKey())));
        assertEquals(files, created.attachments());
    }

    @Test
    void createPost_withOneFile_storesNoFileList() {
        stubReadBack(null);

        CommunityService.Post created = service.createPost(LEARNER_ID, reviewerRequest(images(1)));

        verify(postRepository).save(argThat(post -> post.getAttachmentsJson() == null
                && "community-attachments/page-1.png".equals(post.getAttachmentKey())));
        assertTrue(created.attachments().isEmpty());
    }

    @Test
    void createPost_withMoreFilesThanTheLimit_isRefused() {
        assertThrows(IllegalArgumentException.class,
                () -> service.createPost(LEARNER_ID, reviewerRequest(images(CommunityService.MAX_ATTACHMENTS + 1))));
        verify(postRepository, never()).save(any(CommunityPost.class));
    }

    @Test
    void attachmentList_survivesTheJsonColumn() {
        List<CommunityService.Attachment> files = images(2);

        assertEquals(files, CommunityService.readAttachments(CommunityService.writeAttachments(files)));
        assertTrue(CommunityService.readAttachments(null).isEmpty());
        assertTrue(CommunityService.readAttachments("not json").isEmpty());
    }

    // ---- hidePost ----

    @Test
    void hidePost_setsModerationStatusAndNotifiesAuthor() {
        CommunityPost post = sharedQuizPost("VISIBLE");
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(post));

        service.hidePost(POST_ID);

        assertEquals("HIDDEN", post.getModerationStatus());
        verify(postRepository).save(post);
        verify(notificationRepository).save(argThat(n ->
                n.getLearner().getLearnerId().equals(LEARNER_ID)
                        && n.getBody().contains("Algebra basics")));
    }

    @Test
    void hidePost_postNotFound_throws() {
        when(postRepository.findById(POST_ID)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.hidePost(POST_ID));
    }

    // ---- sharedStudyTarget: the moderation bypass, and the route shapes
    //      the two generation paths actually write ----

    @Test
    void sharedStudyTarget_hiddenPost_throwsInsteadOfReturningStudySet() {
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(sharedQuizPost("HIDDEN")));

        assertThrows(IllegalArgumentException.class, () -> service.sharedStudyTarget(POST_ID));
    }

    @Test
    void sharedStudyTarget_legacyPracticeRoute_resolvesToStudySet() {
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(sharedQuizPost("VISIBLE")));

        CommunityService.SharedStudyTarget target = service.sharedStudyTarget(POST_ID);

        assertEquals("STUDY_SET", target.store());
        assertEquals(77L, target.id());
        assertEquals("QUIZ", target.studyType());
    }

    /* A generated quiz is persisted as an exam, not a study set -- the reason
       every shared quiz used to answer "this older study post cannot be
       practised yet" however new it was. */
    @Test
    void sharedStudyTarget_generatedQuiz_resolvesToExam() {
        when(postRepository.findById(POST_ID)).thenReturn(
                Optional.of(sharedStudyPost("VISIBLE", "quiz", "/learner/assessments/91")));

        CommunityService.SharedStudyTarget target = service.sharedStudyTarget(POST_ID);

        assertEquals("EXAM", target.store());
        assertEquals(91L, target.id());
        assertEquals("QUIZ", target.studyType());
    }

    @Test
    void sharedStudyTarget_generatedFlashcards_resolveToStudySet() {
        when(postRepository.findById(POST_ID)).thenReturn(
                Optional.of(sharedStudyPost("VISIBLE", "flashcard", "/learner/flashcards/42")));

        CommunityService.SharedStudyTarget target = service.sharedStudyTarget(POST_ID);

        assertEquals("STUDY_SET", target.store());
        assertEquals(42L, target.id());
        assertEquals("FLASHCARD", target.studyType());
    }

    @Test
    void sharedStudyTarget_discussionPost_throws() {
        CommunityPost post = sharedQuizPost("VISIBLE");
        post.setPostType("discussion");
        post.setSharedLibraryItem(null);
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(post));

        assertThrows(IllegalArgumentException.class, () -> service.sharedStudyTarget(POST_ID));
    }

    // ---- like/save toggle ----

    @Test
    void toggleLike_notPreviouslyLiked_addsLikeAndReturnsTrue() {
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(visiblePost()));
        when(postLikeRepository.existsByPost_PostIdAndLearner_LearnerId(POST_ID, LEARNER_ID)).thenReturn(false);
        when(postLikeRepository.countByPost_PostId(POST_ID)).thenReturn(4L);

        CommunityService.PostCounts result = service.toggleLike(LEARNER_ID, POST_ID);

        assertTrue(result.active());
        assertEquals(4L, result.reactions());
        verify(postLikeRepository).addLike(POST_ID, LEARNER_ID);
        verify(postLikeRepository, never()).deleteByPost_PostIdAndLearner_LearnerId(any(), any());
    }

    @Test
    void toggleLike_previouslyLiked_removesLikeAndReturnsFalse() {
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(visiblePost()));
        when(postLikeRepository.existsByPost_PostIdAndLearner_LearnerId(POST_ID, LEARNER_ID)).thenReturn(true);

        CommunityService.PostCounts result = service.toggleLike(LEARNER_ID, POST_ID);

        assertFalse(result.active());
        verify(postLikeRepository).deleteByPost_PostIdAndLearner_LearnerId(POST_ID, LEARNER_ID);
        verify(postLikeRepository, never()).addLike(any(), any());
    }

    // ---- deletePost / reportPost guards ----

    /*
     * deletePost stopped expressing "not yours" as a zero-row delete and now
     * loads the post to authorise BEFORE touching it -- the engagement wipe it
     * delegates to is unconditional, so it must never run for someone else's
     * post. This test still asserts the guard; it stubs the read the service
     * actually makes rather than the delete-by-owner it no longer calls.
     */
    @Test
    void deletePost_notOwner_throws() {
        CommunityPost someoneElsesPost = visiblePost();
        someoneElsesPost.setAuthor(Learner.builder().learnerId(LEARNER_ID + 1).build());
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(someoneElsesPost));

        assertThrows(IllegalArgumentException.class, () -> service.deletePost(LEARNER_ID, POST_ID));
        // The point of the guard: nothing is deleted.
        verify(postRepository, never()).deletePostWithEngagement(any());
    }

    @Test
    void deletePost_owner_deletesWithEngagement() {
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(visiblePost()));

        service.deletePost(LEARNER_ID, POST_ID);

        verify(postRepository).deletePostWithEngagement(POST_ID);
    }

    @Test
    void deletePost_missingPost_throws() {
        when(postRepository.findById(POST_ID)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> service.deletePost(LEARNER_ID, POST_ID));
        verify(postRepository, never()).deletePostWithEngagement(any());
    }

    @Test
    void reportPost_invalidReason_throws() {
        assertThrows(IllegalArgumentException.class,
                () -> service.reportPost(LEARNER_ID, POST_ID, new CommunityService.ReportRequest("NOT_A_REASON", null)));
        verify(reportRepository, times(0)).upsertReport(any(), any(), any(), any());
    }

    @Test
    void reportPost_postDoesNotExist_throws() {
        when(postRepository.existsById(POST_ID)).thenReturn(false);

        assertThrows(EntityNotFoundException.class,
                () -> service.reportPost(LEARNER_ID, POST_ID, new CommunityService.ReportRequest("SPAM", null)));
    }

    // ---- recordView: how many learners opened what a post shares ----

    @Test
    void recordView_otherLearner_recordsTheViewAndReturnsTheCount() {
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(sharedQuizPost("VISIBLE")));
        when(postViewRepository.countByPost_PostId(POST_ID)).thenReturn(12L);

        long views = service.recordView(OTHER_LEARNER_ID, POST_ID);

        assertEquals(12L, views);
        verify(postViewRepository).recordView(POST_ID, OTHER_LEARNER_ID);
    }

    /* Otherwise every post reads "1 view" the moment its author looks at it,
       and the number stops meaning what it says it means. */
    @Test
    void recordView_author_returnsTheCountWithoutCountingThemselves() {
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(sharedQuizPost("VISIBLE")));
        when(postViewRepository.countByPost_PostId(POST_ID)).thenReturn(3L);

        long views = service.recordView(LEARNER_ID, POST_ID);

        assertEquals(3L, views);
        verify(postViewRepository, never()).recordView(any(), any());
    }

    @Test
    void recordView_discussionPost_throwsBecauseThereIsNothingToOpen() {
        CommunityPost post = sharedQuizPost("VISIBLE");
        post.setPostType("discussion");
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(post));

        assertThrows(IllegalArgumentException.class, () -> service.recordView(OTHER_LEARNER_ID, POST_ID));
        verify(postViewRepository, never()).recordView(any(), any());
    }

    @Test
    void recordView_hiddenPost_throws() {
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(sharedQuizPost("HIDDEN")));

        assertThrows(EntityNotFoundException.class, () -> service.recordView(OTHER_LEARNER_ID, POST_ID));
    }
}
