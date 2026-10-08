package com.capstone.rebyu.aigateway;

import com.capstone.rebyu.auth.dto.CurrentUserDto;

/**
 * Pictures learners snip from a lesson to ask the AI tutor about. Stored under
 * {@code tutor-snips/{owner}/}, where the owner is the learner (or, for staff
 * previewing a lesson, the user account), and viewable only by that owner and
 * admins: unlike lesson media, a snip is a learner's own message.
 */
public final class TutorSnips {

    public static final String FOLDER = "tutor-snips/";

    private TutorSnips() {
    }

    public static String ownerOf(CurrentUserDto user) {
        return user.learnerId() != null ? "l" + user.learnerId() : "u" + user.userId();
    }

    public static boolean isSnip(String key) {
        return key != null && key.startsWith(FOLDER);
    }

    public static boolean canView(String key, CurrentUserDto user) {
        return "ADMIN".equalsIgnoreCase(user.role()) || key.startsWith(FOLDER + ownerOf(user) + "/");
    }
}
