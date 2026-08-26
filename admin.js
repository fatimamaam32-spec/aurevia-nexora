import { supabase } from './supabase.js';

/**
 * AUREVIA INSTITUTE
 * Courses Engine
 *
 * Frontend responsibilities:
 * - Authentication
 * - Approved-user access
 * - Load published courses
 * - Load published lessons
 * - Course/lesson navigation
 * - Bunny-ready video player
 *
 * IMPORTANT:
 * Bunny API keys/secrets MUST NOT be placed in this file.
 * Secure 1-hour playback will be generated server-side
 * through a Supabase Edge Function.
 */

let currentCourse = null;
let currentLessons = [];
let activeLessonIndex = 0;

document.addEventListener('DOMContentLoaded', initCoursesPage);

/* =========================================================
   INITIALIZATION
========================================================= */

async function initCoursesPage() {
    try {
        const hasAccess = await checkUserAccess();

        if (!hasAccess) {
            return;
        }

        await loadCourses();
        setupEventListeners();

    } catch (error) {
        console.error('Courses initialization error:', error);
        showError('Something went wrong. Please refresh the page.');
    }
}

/* =========================================================
   AUTHENTICATION & ACCESS
========================================================= */

async function checkUserAccess() {
    try {
        const {
            data: { session },
            error: sessionError
        } = await supabase.auth.getSession();

        if (sessionError) {
            console.error('Session error:', sessionError);
            redirectToLogin();
            return false;
        }

        if (!session) {
            redirectToLogin();
            return false;
        }

        const {
            data: profile,
            error: profileError
        } = await supabase
            .from('profiles')
            .select('status, role')
            .eq('id', session.user.id)
            .single();

        if (profileError || !profile) {
            console.error('Profile error:', profileError);
            redirectToLogin();
            return false;
        }

        const isAdmin = profile.role === 'admin';
        const isApproved = profile.status === 'approved';

        if (!isApproved && !isAdmin) {
            showAccessPending();
            return false;
        }

        return true;

    } catch (error) {
        console.error('Access check error:', error);
        showError('Authentication error. Please login again.');
        return false;
    }
}

function redirectToLogin() {
    window.location.href = 'login.html';
}

function showAccessPending() {
    const grid = document.getElementById('courses-grid');

    if (!grid) return;

    grid.innerHTML = `
        <div class="state-message"
             style="
                grid-column: 1 / -1;
                color: var(--brand-maroon);
                background:#FFF5F5;
                border:1px solid #FCE8E8;
                border-radius:16px;
                padding:2rem;
             ">
            <strong style="font-size:1.1rem;">
                Course Access Pending
            </strong>

            <br><br>

            Your account is currently under review.
            Course access will become available after your account is approved.
        </div>
    `;
}

/* =========================================================
   LOAD COURSES
========================================================= */

async function loadCourses() {
    const grid = document.getElementById('courses-grid');

    if (!grid) return;

    showLoading(grid, 'Loading courses...');

    try {
        const {
            data: courses,
            error
        } = await supabase
            .from('courses')
            .select(`
                id,
                title,
                slug,
                description,
                thumbnail,
                course_number,
                level,
                is_published,
                created_at
            `)
            .eq('is_published', true)
            .order('course_number', { ascending: true });

        if (error) {
            throw error;
        }

        if (!courses || courses.length === 0) {
            showEmptyCourses();
            return;
        }

        await renderCourses(courses);

    } catch (error) {
        console.error('Load courses error:', error);

        grid.innerHTML = `
            <div class="state-message"
                 style="grid-column:1/-1;">
                Unable to load courses right now.
                <br><br>
                <button
                    id="retry-courses"
                    class="btn-start-learning"
                    style="max-width:220px;margin:auto;">
                    Try Again
                </button>
            </div>
        `;

        document
            .getElementById('retry-courses')
            ?.addEventListener('click', loadCourses);
    }
}

/* =========================================================
   COURSE CARD RENDERING
========================================================= */

async function renderCourses(courses) {
    const grid = document.getElementById('courses-grid');

    if (!grid) return;

    grid.innerHTML = '';

    /*
     * Fetch lesson counts separately.
     * This keeps the existing database structure simple.
     */

    const courseCards = await Promise.all(
        courses.map(async course => {

            const {
                count,
                error
            } = await supabase
                .from('course_lessons')
                .select('*', {
                    count: 'exact',
                    head: true
                })
                .eq('course_id', course.id)
                .eq('is_published', true);

            if (error) {
                console.warn(
                    `Lesson count failed for ${course.title}:`,
                    error
                );
            }

            return {
                ...course,
                lessonCount: count || 0
            };
        })
    );

    courseCards.forEach(course => {
        grid.insertAdjacentHTML(
            'beforeend',
            createCourseCard(course)
        );
    });

    document
        .querySelectorAll('.btn-start-learning')
        .forEach(button => {

            button.addEventListener('click', () => {

                const courseId =
                    button.dataset.courseId;

                const selectedCourse =
                    courseCards.find(
                        course => course.id === courseId
                    );

                if (selectedCourse) {
                    openCourse(selectedCourse);
                }
            });
        });
}

function createCourseCard(course) {
    const paddedNumber =
        String(course.course_number).padStart(2, '0');

    const fallbackImage =
        `images/course-${course.slug || 'default'}.jpg`;

    const image =
        course.thumbnail || fallbackImage;

    const safeTitle =
        escapeHTML(course.title || 'Course');

    const safeDescription =
        escapeHTML(
            course.description ||
            'Learn practical skills and build your knowledge.'
        );

    const safeLevel =
        escapeHTML(
            course.level ||
            'Beginner to Advanced'
        );

    return `
        <article class="course-card">

            <img
                src="${escapeAttribute(image)}"
                alt="${safeTitle}"
                class="course-card-image"
                loading="lazy"
                onerror="this.onerror=null;this.style.display='none';this.parentElement.classList.add('course-image-fallback');"
            >

            <div class="course-card-body">

                <div class="course-badge">
                    ${paddedNumber}
                </div>

                <h3 class="course-title">
                    ${safeTitle}
                </h3>

                <p class="course-description">
                    ${safeDescription}
                </p>

                <div class="course-meta-divider"></div>

                <div class="course-meta-item">

                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>

                    <span>
                        ${course.lessonCount}
                        ${course.lessonCount === 1 ? 'Lesson' : 'Lessons'}
                    </span>

                </div>

                <div class="course-meta-item">

                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                    >
                        <line x1="18" y1="20" x2="18" y2="10"></line>
                        <line x1="12" y1="20" x2="12" y2="4"></line>
                        <line x1="6" y1="20" x2="6" y2="14"></line>
                    </svg>

                    <span>
                        ${safeLevel}
                    </span>

                </div>

                <button
                    type="button"
                    class="btn-start-learning"
                    data-course-id="${escapeAttribute(course.id)}"
                >

                    Start Learning

                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        style="width:16px;height:16px;"
                        aria-hidden="true"
                    >
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>

                </button>

            </div>
        </article>
    `;
}

/* =========================================================
   OPEN COURSE
========================================================= */

async function openCourse(course) {

    currentCourse = course;
    currentLessons = [];
    activeLessonIndex = 0;

    const coursesSection =
        document.getElementById('courses-section');

    const lessonSection =
        document.getElementById('lesson-view-section');

    if (!coursesSection || !lessonSection) {
        return;
    }

    coursesSection.style.display = 'none';
    lessonSection.style.display = 'block';

    lessonSection.innerHTML = `
        <div class="lesson-view-container">
            <div class="state-message">
                Loading course content...
            </div>
        </div>
    `;

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    try {

        const {
            data: lessons,
            error
        } = await supabase
            .from('course_lessons')
            .select(`
                id,
                course_id,
                title,
                description,
                lesson_number,
                bunny_video_id,
                duration,
                is_published
            `)
            .eq('course_id', course.id)
            .eq('is_published', true)
            .order('lesson_number', {
                ascending: true
            });

        if (error) {
            throw error;
        }

        currentLessons = lessons || [];

        activeLessonIndex = 0;

        renderLessonInterface();

    } catch (error) {

        console.error(
            'Course lessons error:',
            error
        );

        lessonSection.innerHTML = `
            <div class="lesson-view-container">

                <div class="state-message">

                    Unable to load this course.

                    <br><br>

                    <button
                        type="button"
                        class="btn-back-courses"
                        id="btn-back-fallback"
                    >
                        ← Back to Courses
                    </button>

                </div>

            </div>
        `;

        document
            .getElementById('btn-back-fallback')
            ?.addEventListener(
                'click',
                closeLessonView
            );
    }
}

/* =========================================================
   LESSON INTERFACE
========================================================= */

function renderLessonInterface() {

    const lessonSection =
        document.getElementById('lesson-view-section');

    if (!lessonSection || !currentCourse) {
        return;
    }

    const hasLessons =
        currentLessons.length > 0;

    const activeLesson =
        hasLessons
            ? currentLessons[activeLessonIndex]
            : null;

    const lessonNumber =
        activeLesson
            ? String(activeLesson.lesson_number)
                .padStart(2, '0')
            : '';

    let playerContent = '';

    if (!activeLesson) {

        playerContent = `
            <div class="video-player-wrapper">
                <div style="
                    text-align:center;
                    padding:2rem;
                    color:#fff;
                ">
                    <div style="
                        font-size:2rem;
                        margin-bottom:.5rem;
                    ">
                        📚
                    </div>

                    <strong>
                        Course content coming soon
                    </strong>

                    <p style="
                        margin:.5rem 0 0;
                        opacity:.75;
                    ">
                        Lessons will appear here once published.
                    </p>
                </div>
            </div>
        `;

    } else if (activeLesson.bunny_video_id) {

        /*
         * Bunny-ready container.
         *
         * IMPORTANT:
         * We intentionally do NOT put Bunny API credentials here.
         *
         * Later:
         *
         * Supabase Edge Function
         *       ↓
         * secure 1-hour playback URL
         *       ↓
         * this player
         */

        playerContent = `
            <div
                class="video-player-wrapper"
                id="bunny-player-${escapeAttribute(activeLesson.id)}"
                data-video-id="${escapeAttribute(activeLesson.bunny_video_id)}"
            >
                <div style="
                    text-align:center;
                    color:#fff;
                    padding:2rem;
                ">
                    <div style="
                        font-size:2rem;
                        margin-bottom:.5rem;
                    ">
                        ▶
                    </div>

                    <strong>
                        Video ready
                    </strong>

                    <p style="
                        margin:.5rem 0 0;
                        opacity:.75;
                        font-size:.85rem;
                    ">
                        Secure Bunny playback will load here.
                    </p>
                </div>
            </div>
        `;

    } else {

        playerContent = `
            <div class="video-player-wrapper">
                <div style="
                    text-align:center;
                    color:#fff;
                    padding:2rem;
                ">
                    <div style="
                        font-size:2rem;
                        margin-bottom:.5rem;
                    ">
                        🎬
                    </div>

                    <strong>
                        Video coming soon
                    </strong>

                    <p style="
                        margin:.5rem 0 0;
                        opacity:.75;
                    ">
                        This lesson does not have a video yet.
                    </p>
                </div>
            </div>
        `;
    }

    const lessonsListHTML = hasLessons
        ? currentLessons.map(
            (lesson, index) => {

                const number =
                    String(lesson.lesson_number)
                        .padStart(2, '0');

                const title =
                    escapeHTML(
                        lesson.title ||
                        `Lesson ${number}`
                    );

                const duration =
                    escapeHTML(
                        lesson.duration || ''
                    );

                const activeClass =
                    index === activeLessonIndex
                        ? 'active'
                        : '';

                return `
                    <button
                        type="button"
                        class="lesson-item-row ${activeClass}"
                        data-index="${index}"
                    >

                        <span>
                            <strong>
                                Lesson ${number}:
                            </strong>
                            ${title}
                        </span>

                        ${
                            duration
                                ? `<span style="
                                    font-size:.85rem;
                                    opacity:.8;
                                  ">
                                    ${duration}
                                  </span>`
                                : ''
                        }

                    </button>
                `;
            }
        ).join('')
        : `
            <p class="state-message">
                No lessons available for this course yet.
            </p>
        `;

    const safeCourseTitle =
        escapeHTML(
            currentCourse.title || 'Course'
        );

    const safeDescription =
        activeLesson
            ? escapeHTML(
                activeLesson.description || ''
            )
            : '';

    lessonSection.innerHTML = `
        <div class="lesson-view-container">

            <button
                type="button"
                class="btn-back-courses"
                id="btn-back-to-courses"
            >
                ← Back to Courses
            </button>

            <h2 style="
                font-size:1.75rem;
                font-weight:800;
                margin:0 0 .25rem;
            ">
                ${safeCourseTitle}
            </h2>

            ${
                activeLesson
                    ? `
                        <p style="
                            color:var(--text-muted);
                            margin:0;
                        ">
                            Lesson ${lessonNumber}:
                            ${escapeHTML(activeLesson.title)}
                        </p>
                    `
                    : ''
            }

            ${playerContent}

            ${
                activeLesson && safeDescription
                    ? `
                        <p style="
                            line-height:1.6;
                            color:#444;
                        ">
                            ${safeDescription}
                        </p>
                    `
                    : ''
            }

                       <div class="lesson-nav-buttons">

                <button
                    type="button"
                    class="btn-nav-lesson"
                    id="btn-prev-lesson"
                    ${activeLessonIndex === 0 || !hasLessons ? 'disabled' : ''}
                >
                    ← Previous
                </button>

                <button
                    type="button"
                    class="btn-nav-lesson"
                    id="btn-next-lesson"
                    ${
                        activeLessonIndex >= currentLessons.length - 1 ||
                        !hasLessons
                            ? 'disabled'
                            : ''
                    }
                >
                    Next →
                </button>

            </div>

            <div class="lessons-list-sidebar">

                <h3 style="
                    font-size:1.1rem;
                    font-weight:700;
                    margin-bottom:1rem;
                ">
                    Course Content
                </h3>

                ${lessonsListHTML}

            </div>

        </div>
    `;

    bindLessonEvents();
}

/* =========================================================
   LESSON EVENTS
========================================================= */

function bindLessonEvents() {

    const backButton =
        document.getElementById(
            'btn-back-to-courses'
        );

    backButton?.addEventListener(
        'click',
        closeLessonView
    );

    const previousButton =
        document.getElementById(
            'btn-prev-lesson'
        );

    previousButton?.addEventListener(
        'click',
        () => {

            if (activeLessonIndex <= 0) {
                return;
            }

            activeLessonIndex--;

            renderLessonInterface();

            scrollToLessonTop();
        }
    );

    const nextButton =
        document.getElementById(
            'btn-next-lesson'
        );

    nextButton?.addEventListener(
        'click',
        () => {

            if (
                activeLessonIndex >=
                currentLessons.length - 1
            ) {
                return;
            }

            activeLessonIndex++;

            renderLessonInterface();

            scrollToLessonTop();
        }
    );

    document
        .querySelectorAll('.lesson-item-row')
        .forEach(row => {

            row.addEventListener(
                'click',
                () => {

                    const index =
                        Number(row.dataset.index);

                    if (
                        Number.isNaN(index) ||
                        index < 0 ||
                        index >= currentLessons.length
                    ) {
                        return;
                    }

                    activeLessonIndex = index;

                    renderLessonInterface();

                    scrollToLessonTop();
                }
            );
        });
}

/* =========================================================
   CLOSE COURSE
========================================================= */

function closeLessonView() {

    const coursesSection =
        document.getElementById(
            'courses-section'
        );

    const lessonSection =
        document.getElementById(
            'lesson-view-section'
        );

    if (coursesSection) {
        coursesSection.style.display = 'block';
    }

    if (lessonSection) {
        lessonSection.style.display = 'none';
        lessonSection.innerHTML = '';
    }

    currentCourse = null;
    currentLessons = [];
    activeLessonIndex = 0;

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/* =========================================================
   CTA / PAGE EVENTS
========================================================= */

function setupEventListeners() {

    const ctaButton =
        document.getElementById(
            'cta-scroll-btn'
        );

    ctaButton?.addEventListener(
        'click',
        event => {

            event.preventDefault();

            const courses =
                document.getElementById(
                    'our-courses'
                );

            courses?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    );

    const keepLearning =
        document.querySelector(
            '.keep-learning-card'
        );

    keepLearning?.addEventListener(
        'click',
        event => {

            event.preventDefault();

            const courses =
                document.getElementById(
                    'our-courses'
                );

            courses?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    );
}

/* =========================================================
   UI HELPERS
========================================================= */

function showLoading(element, message) {

    element.innerHTML = `
        <div
            class="state-message"
            style="grid-column:1/-1;"
        >
            <div style="
                width:32px;
                height:32px;
                border:3px solid #F0DCDC;
                border-top-color:var(--brand-maroon);
                border-radius:50%;
                margin:0 auto 1rem;
                animation:aureviaSpin .8s linear infinite;
            "></div>

            ${escapeHTML(message)}
        </div>

        <style>
            @keyframes aureviaSpin {
                to {
                    transform:rotate(360deg);
                }
            }
        </style>
    `;
}

function showEmptyCourses() {

    const grid =
        document.getElementById(
            'courses-grid'
        );

    if (!grid) return;

    grid.innerHTML = `
        <div
            class="state-message"
            style="grid-column:1/-1;"
        >
            <strong>
                No courses available yet.
            </strong>

            <br><br>

            New courses will appear here when published.
        </div>
    `;
}

function showError(message) {

    const grid =
        document.getElementById(
            'courses-grid'
        );

    if (!grid) return;

    grid.innerHTML = `
        <div
            class="state-message"
            style="
                grid-column:1/-1;
                color:var(--brand-maroon);
            "
        >
            ${escapeHTML(message)}
        </div>
    `;
}

function scrollToLessonTop() {

    const lessonSection =
        document.getElementById(
            'lesson-view-section'
        );

    lessonSection?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

/* =========================================================
   SECURITY / HTML HELPERS
========================================================= */

function escapeHTML(value) {

    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttribute(value) {

    return escapeHTML(value)
        .replace(/`/g, '&#096;');
}