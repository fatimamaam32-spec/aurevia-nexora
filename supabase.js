// ==========================================
// Aurevia Institute
// supabase.js
// Production Supabase Client
// ==========================================

import {
    createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


// ==========================================
// SUPABASE CONFIGURATION
// ==========================================

const supabaseUrl =
    "https://vqfwtbksyykkbdrclglm.supabase.co";

const supabaseKey =
    "sb_publishable_JFuzjJm1HOIMkQgulRY-lw_w0zn4wot";


// ==========================================
// CREATE SUPABASE CLIENT
// ==========================================

export const supabase =
    createClient(
        supabaseUrl,
        supabaseKey,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );


// ==========================================
// GET CURRENT USER
// ==========================================

export async function getCurrentUser() {

    try {

        const {
            data,
            error
        } =
            await supabase.auth.getUser();

        if (error) {

            console.error(
                "Get current user error:",
                error
            );

            return null;
        }

        return data?.user || null;

    } catch (error) {

        console.error(
            "Unexpected getCurrentUser error:",
            error
        );

        return null;
    }
}


// ==========================================
// GET CURRENT SESSION
// ==========================================

export async function getCurrentSession() {

    try {

        const {
            data,
            error
        } =
            await supabase.auth.getSession();

        if (error) {

            console.error(
                "Get session error:",
                error
            );

            return null;
        }

        return data?.session || null;

    } catch (error) {

        console.error(
            "Unexpected getCurrentSession error:",
            error
        );

        return null;
    }
}


// ==========================================
// CHECK LOGIN
// ==========================================

export async function isLoggedIn() {

    const session =
        await getCurrentSession();

    return !!session;
}


// ==========================================
// GET CURRENT USER PROFILE
// ==========================================

export async function getCurrentProfile() {

    try {

        const user =
            await getCurrentUser();

        if (!user) {

            return null;
        }


        const {
            data,
            error
        } =
            await supabase

                .from("profiles")

                .select(`
                    id,
                    full_name,
                    email,
                    phone,
                    status,
                    created_at,
                    avatar_url,
                    referral_code,
                    balance,
                    role,
                    transaction_id,
                    payment_method,
                    screenshot_url,
                    total_referrals,
                    approved_referrals,
                    total_earnings,
                    total_withdraw,
                    reward_level,
                    last_login,
                    referred_by
                `)

                .eq(
                    "id",
                    user.id
                )

                .maybeSingle();


        if (error) {

            console.error(
                "Profile fetch error:",
                error
            );

            return null;
        }


        return data || null;

    } catch (error) {

        console.error(
            "Unexpected profile error:",
            error
        );

        return null;
    }
}


// ==========================================
// UPDATE LAST LOGIN
// ==========================================

export async function updateLastLogin() {

    try {

        const user =
            await getCurrentUser();

        if (!user) {

            return {
                success: false,
                error: "User is not logged in."
            };
        }


        const {
            error
        } =
            await supabase

                .from("profiles")

                .update({

                    last_login:
                        new Date().toISOString()

                })

                .eq(
                    "id",
                    user.id
                );


        if (error) {

            console.error(
                "Last login update error:",
                error
            );

            return {
                success: false,
                error
            };
        }


        return {
            success: true,
            error: null
        };

    } catch (error) {

        console.error(
            "Unexpected last login error:",
            error
        );

        return {
            success: false,
            error
        };
    }
}


// ==========================================
// UPDATE OWN PROFILE
// ==========================================

export async function updateProfile(
    updates = {}
) {

    try {

        const user =
            await getCurrentUser();

        if (!user) {

            return {
                data: null,
                error: new Error(
                    "You are not logged in."
                )
            };
        }


        const allowedFields = {

            full_name:
                updates.full_name,

            phone:
                updates.phone,

            avatar_url:
                updates.avatar_url

        };


        const cleanUpdates = {};


        Object.keys(allowedFields)
            .forEach((key) => {

                if (
                    allowedFields[key] !==
                    undefined
                ) {

                    cleanUpdates[key] =
                        allowedFields[key];
                }

            });


        if (
            Object.keys(cleanUpdates).length === 0
        ) {

            return {
                data: null,
                error: new Error(
                    "No profile changes were provided."
                )
            };
        }


        const {
            data,
            error
        } =
            await supabase

                .from("profiles")

                .update(
                    cleanUpdates
                )

                .eq(
                    "id",
                    user.id
                )

                .select()

                .single();


        if (error) {

            console.error(
                "Update profile error:",
                error
            );
        }


        return {
            data,
            error
        };

    } catch (error) {

        console.error(
            "Unexpected update profile error:",
            error
        );

        return {
            data: null,
            error
        };
    }
}


// ==========================================
// AVATAR BUCKET
// ==========================================

export const AVATAR_BUCKET =
    "avatars";


// ==========================================
// UPLOAD PROFILE PHOTO
// ==========================================

export async function uploadAvatar(
    file
) {

    try {

        const user =
            await getCurrentUser();

        if (!user) {

            throw new Error(
                "You must be logged in to upload a profile photo."
            );
        }


        if (!file) {

            throw new Error(
                "Please select an image."
            );
        }


        // ======================================
        // Allowed image types
        // ======================================

        const allowedTypes = [

            "image/jpeg",
            "image/png",
            "image/webp"

        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            throw new Error(
                "Only JPG, PNG and WEBP images are allowed."
            );
        }


        // ======================================
        // Maximum 5MB
        // ======================================

        const maxSize =
            5 * 1024 * 1024;


        if (
            file.size > maxSize
        ) {

            throw new Error(
                "Profile photo must be 5MB or smaller."
            );
        }


        // ======================================
        // File extension
        // ======================================

        let extension =
            "jpg";


        if (
            file.type ===
            "image/png"
        ) {

            extension =
                "png";

        } else if (
            file.type ===
            "image/webp"
        ) {

            extension =
                "webp";
        }


        // ======================================
        // User-specific folder
        // ======================================

        const filePath =
            `${user.id}/avatar.${extension}`;


        // ======================================
        // Upload / Replace
        // ======================================

        const {
            error: uploadError
        } =
            await supabase.storage

                .from(
                    AVATAR_BUCKET
                )

                .upload(
                    filePath,
                    file,
                    {

                        cacheControl:
                            "3600",

                        upsert:
                            true,

                        contentType:
                            file.type

                    }
                );


        if (uploadError) {

            console.error(
                "Avatar upload error:",
                uploadError
            );

            throw uploadError;
        }


        // ======================================
        // Public URL
        // ======================================

        const {
            data: publicData
        } =
            supabase.storage

                .from(
                    AVATAR_BUCKET
                )

                .getPublicUrl(
                    filePath
                );


        const avatarUrl =
            publicData?.publicUrl;


        if (!avatarUrl) {

            throw new Error(
                "Could not create profile photo URL."
            );
        }


        // ======================================
        // Add cache-buster
        // ======================================

        const finalAvatarUrl =
            `${avatarUrl}?v=${Date.now()}`;


        // ======================================
        // Save URL in profiles
        // ======================================

        const {
            data: updatedProfile,
            error: profileError
        } =
            await supabase

                .from("profiles")

                .update({

                    avatar_url:
                        finalAvatarUrl

                })

                .eq(
                    "id",
                    user.id
                )

                .select()

                .single();


        if (profileError) {

            console.error(
                "Avatar profile update error:",
                profileError
            );

            throw profileError;
        }


        return {

            success: true,

            avatarUrl:
                finalAvatarUrl,

            profile:
                updatedProfile,

            error: null

        };

    } catch (error) {

        console.error(
            "Upload avatar failed:",
            error
        );

        return {

            success: false,

            avatarUrl: null,

            profile: null,

            error

        };
    }
}


// ==========================================
// DELETE PROFILE PHOTO
// ==========================================

export async function deleteAvatar() {

    try {

        const user =
            await getCurrentUser();

        if (!user) {

            throw new Error(
                "You must be logged in."
            );
        }


        // ======================================
        // Remove supported avatar files
        // ======================================

        const paths = [

            `${user.id}/avatar.jpg`,
            `${user.id}/avatar.png`,
            `${user.id}/avatar.webp`

        ];


        const {
            error: removeError
        } =
            await supabase.storage

                .from(
                    AVATAR_BUCKET
                )

                .remove(
                    paths
                );


        if (removeError) {

            console.error(
                "Avatar delete error:",
                removeError
            );

            throw removeError;
        }


        // ======================================
        // Clear avatar_url
        // ======================================

        const {
            data,
            error
        } =
            await supabase

                .from("profiles")

                .update({

                    avatar_url:
                        null

                })

                .eq(
                    "id",
                    user.id
                )

                .select()

                .single();


        if (error) {

            console.error(
                "Avatar URL clear error:",
                error
            );

            throw error;
        }


        return {

            success: true,

            profile:
                data,

            error: null

        };

    } catch (error) {

        console.error(
            "Delete avatar failed:",
            error
        );

        return {

            success: false,

            profile: null,

            error

        };
    }
}


// ==========================================
// GET AVATAR URL
// ==========================================

export async function getAvatarUrl() {

    try {

        const profile =
            await getCurrentProfile();

        return (
            profile?.avatar_url ||
            null
        );

    } catch (error) {

        console.error(
            "Get avatar URL error:",
            error
        );

        return null;
    }
}


// ==========================================
// LOGOUT USER
// ==========================================

export async function logoutUser() {

    try {

        const {
            error
        } =
            await supabase.auth.signOut();


        if (error) {

            console.error(
                "Logout error:",
                error
            );

            throw error;
        }


        window.location.replace(
            "login.html"
        );


    } catch (error) {

        console.error(
            "Logout failed:",
            error
        );

        return false;
    }
}


// ==========================================
// AUTH STATE LISTENER
// ==========================================

supabase.auth.onAuthStateChange(
    (
        event,
        session
    ) => {

        console.log(
            "Aurevia Auth Event:",
            event
        );


        if (session?.user) {

            console.log(
                "Authenticated user:",
                session.user.email
            );

        } else {

            console.log(
                "No active authenticated session."
            );

        }

    }
);


// ==========================================
// SUPABASE CONNECTION TEST
// ==========================================

export async function testSupabaseConnection() {

    try {

        const {
            error
        } =
            await supabase

                .from("profiles")

                .select("id")

                .limit(1);


        if (error) {

            console.error(
                "Supabase connection test failed:",
                error
            );

            return false;
        }


        console.log(
            "Supabase connection successful."
        );

        return true;

    } catch (error) {

        console.error(
            "Supabase connection test error:",
            error
        );

        return false;
    }
}


// ==========================================
// FILE LOADED
// ==========================================

console.log(
    "Aurevia Institute Supabase JS Loaded Successfully."
);


// ==========================================
// END supabase.js
// ==========================================