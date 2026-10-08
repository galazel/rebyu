package com.capstone.rebyu.aigateway;

import com.capstone.rebyu.auth.dto.CurrentUserDto;

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
