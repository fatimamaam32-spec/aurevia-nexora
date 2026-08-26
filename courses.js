/* ============================================================
   AUREVIA INSTITUTE
   COURSES PAGE — SUPABASE
   Compatible with:
   public.courses
   public.course_lessons

   DATABASE STRUCTURE
   ------------------
   courses:
     id
     title
     slug
     description
     thumbnail
     course_number
     level
     is_published
     created_at
     updated_at

   course_lessons:
     id
     course_id
     title
     description
     lesson_number
     bunny_video_id
     duration
     is_published
     created_at
     updated_at
     video_url
============================================================ */


/* ============================================================
   SUPABASE CONFIG
============================================================ */

const SUPABASE_URL =
  "https://vqfwtbksyykkbdrclglm.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable_JFuzjJm1HOIMkQgulRY-lw_w0zn4wot";


/* ============================================================
   SETTINGS
============================================================ */

const REQUIRE_LOGIN = true;

const LOGIN_PAGE = "login.html";

const REQUEST_TIMEOUT = 12000;

const MAX_RETRIES = 2;

const REALTIME_ENABLED = true;


/* ============================================================
   SUPABASE CLIENT
============================================================ */

let supabaseClient = null;

try {

  if (
    window.supabase &&
    typeof window.supabase.createClient === "function"
  ) {

    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );

  } else {

    console.error(
      "Supabase JavaScript library was not loaded."
    );

  }

} catch (error) {

  console.error(
    "Supabase initialization error:",
    error
  );

}


/* ============================================================
   DOM ELEMENTS
============================================================ */

const els = {

  grid:
    document.getElementById("coursesGrid"),

  status:
    document.getElementById("status"),

  retry:
    document.getElementById("retryBtn"),

  modal:
    document.getElementById("lessonModal") ||
    document.getElementById("modal"),

  modalTitle:
    document.getElementById("lessonModalTitle") ||
    document.getElementById("modalTitle"),

  lessonList:
    document.getElementById("lessonList"),

  closeModal:
    document.getElementById("closeLessonModal") ||
    document.getElementById("closeModal")

};


/* ============================================================
   GLOBAL STATE
============================================================ */

let coursesCache = [];

let lessonsCache = {};

let realtimeChannel = null;

let isLoadingCourses = false;

let loadRequestId = 0;


/* ============================================================
   UTILITY — ESCAPE HTML
============================================================ */

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* ============================================================
   UTILITY — VALID URL
============================================================ */

function isValidUrl(value) {

  if (!value) {
    return false;
  }

  try {

    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );

  } catch {

    return false;

  }

}


/* ============================================================
   UTILITY — TIMEOUT
============================================================ */

function withTimeout(
  promise,
  timeout = REQUEST_TIMEOUT
) {

  return Promise.race([

    promise,

    new Promise((_, reject) => {

      setTimeout(() => {

        reject(
          new Error(
            "Supabase request timed out."
          )
        );

      }, timeout);

    })

  ]);

}


/* ============================================================
   STATUS
============================================================ */

function setStatus(
  message = "",
  type = ""
) {

  if (!els.status) {
    return;
  }

  els.status.textContent = message;

  els.status.className = "status";

  if (type) {
    els.status.classList.add(type);
  }

}


/* ============================================================
   LOADING UI
============================================================ */

function showLoading() {

  if (!els.grid) {
    return;
  }

  els.grid.innerHTML = `

    <div class="skeleton"></div>
    <div class="skeleton"></div>
    <div class="skeleton"></div>

  `;

}


/* ============================================================
   ERROR UI
============================================================ */

function renderError(message) {

  if (!els.grid) {
    return;
  }

  els.grid.innerHTML = `

    <div
      class="empty error-box"
      style="grid-column:1/-1;"
    >

      <strong>
        Unable to load courses
      </strong>

      <small>
        ${escapeHtml(message)}
      </small>

      <div style="margin-top:16px;">

        <button
          class="retry"
          type="button"
          onclick="loadCourses()"
        >
          Try Again
        </button>

      </div>

    </div>

  `;

}


/* ============================================================
   FALLBACK ART
============================================================ */

function getCourseArtwork(course) {

  const title =
    String(course.title || "").toLowerCase();

  const thumbnail =
    String(course.thumbnail || "").trim();


  /*
    If Supabase has a thumbnail URL,
    use it.
  */

  if (isValidUrl(thumbnail)) {

    return `
      <img
        class="real-art"
        src="${escapeHtml(thumbnail)}"
        alt="${escapeHtml(course.title)}"
        loading="lazy"
        onerror="this.remove();"
      >
    `;

  }


  /*
    Otherwise use built-in artwork.
  */

  if (
    title.includes("ai") ||
    title.includes("artificial")
  ) {

    return `

      <div class="generated-art art-ai">

        <div class="orbit o1"></div>
        <div class="orbit o2"></div>

        <div class="circuit c1"></div>
        <div class="circuit c2"></div>
        <div class="circuit c3"></div>

        <div class="brain">
          AI
        </div>

        <div class="ai-chip">
          INTELLIGENCE
        </div>

      </div>

    `;

  }


  if (
    title.includes("tiktok") ||
    title.includes("tik tok")
  ) {

    return `

      <div class="generated-art art-tiktok">

        <div class="phone">

          <div class="phone-screen">

            <div class="tt">
              ♪
            </div>

            <small>
              SHORT VIDEO
            </small>

          </div>

        </div>

        <div class="heart h1">♥</div>
        <div class="heart h2">♥</div>
        <div class="heart h3">♥</div>

        <div class="spark s1">✦</div>
        <div class="spark s2">✦</div>

      </div>

    `;

  }


  if (
    title.includes("youtube") ||
    title.includes("youtube")
  ) {

    return `

      <div class="generated-art art-youtube">

        <div class="laptop">

          <div class="screen">

            <div class="play">
              ▶
            </div>

            <div class="ytbar"></div>

          </div>

          <div class="base"></div>

        </div>

        <div class="camera"></div>
        <div class="plant"></div>

      </div>

    `;

  }


  return `

    <div class="generated-art default-art">

      <div
        style="
          width:125px;
          height:125px;
          border-radius:50%;
          border:1px solid rgba(239,207,130,.5);
          display:grid;
          place-items:center;
          color:#e9c979;
          font-family:Georgia,serif;
          font-size:42px;
          background:
            radial-gradient(
              circle,
              rgba(169,22,61,.38),
              transparent 65%
            );
          box-shadow:
            0 0 50px rgba(169,22,61,.22);
        "
      >
        ✦
      </div>

    </div>

  `;

}


/* ============================================================
   COURSE CARD
============================================================ */

function renderCourses(courses) {

  if (!els.grid) {
    return;
  }


  if (!Array.isArray(courses) || courses.length === 0) {

    els.grid.innerHTML = `

      <div
        class="empty"
        style="grid-column:1/-1;"
      >

        <strong>
          No published courses available.
        </strong>

        <div style="margin-top:8px;">
          Please check back soon.
        </div>

      </div>

    `;

    return;

  }


  els.grid.innerHTML = courses.map(
    (course, index) => {

      const number = String(
        course.course_number ??
        index + 1
      ).padStart(2, "0");


      const title =
        escapeHtml(
          course.title ||
          "Untitled Course"
        );


      const description =
        escapeHtml(
          course.description ||
          "Explore this course and start learning."
        );


      const level =
        escapeHtml(
          course.level ||
          "Beginner to Advanced"
        );


      const lessonCount =
        lessonsCache[course.id]?.length || 0;


      return `

        <article
          class="course-card"
          data-course-id="${escapeHtml(course.id)}"
        >

          <div class="art">

            ${getCourseArtwork(course)}

            <div class="number">
              ${number}
            </div>

            <div class="course-badge">
              ✦
            </div>

          </div>


          <div class="course-body">

            <h2>
              ${title}
            </h2>

            <p>
              ${description}
            </p>


            <div class="course-meta">

              <div class="lesson-count">

                <span class="book-icon">
                  ▣
                </span>

                <span>
                  ${lessonCount}
                  ${lessonCount === 1 ? "Lesson" : "Lessons"}
                </span>

              </div>


              <button
                class="explore"
                type="button"
                data-open-course="${escapeHtml(course.id)}"
              >

                Explore Course

                <span class="arrow">
                  →
                </span>

              </button>

            </div>

          </div>

        </article>

      `;

    }
  ).join("");


  /*
    Attach events
  */

  els.grid
    .querySelectorAll("[data-open-course]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const courseId =
            button.dataset.openCourse;

          openCourseLessons(courseId);

        }
      );

    });


  /*
    Also make whole card clickable
  */

  els.grid
    .querySelectorAll(".course-card")
    .forEach(card => {

      card.addEventListener(
        "click",
        event => {

          if (
            event.target.closest("button")
          ) {
            return;
          }

          const courseId =
            card.dataset.courseId;

          openCourseLessons(courseId);

        }
      );

    });

}


/* ============================================================
   FETCH COURSES
============================================================ */

async function fetchCourses() {

  if (!supabaseClient) {

    throw new Error(
      "Supabase client is not initialized."
    );

  }


  const query = supabaseClient

    .from("courses")

    .select(`
      id,
      title,
      slug,
      description,
      thumbnail,
      course_number,
      level,
      is_published,
      created_at,
      updated_at
    `)

    .eq(
      "is_published",
      true
    )

    .order(
      "course_number",
      {
        ascending: true
      }
    );


  const result =
    await withTimeout(
      query
    );


  if (result.error) {

    throw result.error;

  }


  return result.data || [];

}


/* ============================================================
   FETCH ALL PUBLISHED LESSONS
============================================================ */

async function fetchAllLessons() {

  if (!supabaseClient) {

    throw new Error(
      "Supabase client is not initialized."
    );

  }


  const query = supabaseClient

    .from("course_lessons")

    .select(`
      id,
      course_id,
      title,
      description,
      lesson_number,
      bunny_video_id,
      duration,
      is_published,
      created_at,
      updated_at,
      video_url
    `)

    .eq(
      "is_published",
      true
    )

    .order(
      "lesson_number",
      {
        ascending: true
      }
    );


  const result =
    await withTimeout(
      query
    );


  if (result.error) {

    throw result.error;

  }


  return result.data || [];

}


/* ============================================================
   ORGANIZE LESSONS BY COURSE
============================================================ */

function organizeLessons(
  lessons
) {

  const grouped = {};


  lessons.forEach(
    lesson => {

      if (!lesson.course_id) {
        return;
      }


      if (
        !grouped[lesson.course_id]
      ) {

        grouped[lesson.course_id] = [];

      }


      grouped[
        lesson.course_id
      ].push(lesson);

    }
  );


  /*
    Sort again client-side to make
    sure lesson order is correct.
  */

  Object.keys(grouped)
    .forEach(courseId => {

      grouped[courseId].sort(
        (a, b) => {

          return (
            Number(a.lesson_number || 0) -
            Number(b.lesson_number || 0)
          );

        }
      );

    });


  return grouped;

}


/* ============================================================
   LOAD COURSES
============================================================ */

async function loadCourses(
  retryCount = 0
) {

  if (isLoadingCourses) {
    return;
  }


  isLoadingCourses = true;

  const currentRequest =
    ++loadRequestId;


  showLoading();

  setStatus(
    "Loading courses..."
  );


  if (els.retry) {
    els.retry.hidden = true;
  }


  try {

    /*
      Make sure Supabase exists.
    */

    if (!supabaseClient) {

      throw new Error(
        "Supabase client is unavailable."
      );

    }


    /*
      Login check.
    */

    const allowed =
      await requireLoggedInUser();


    if (!allowed) {

      isLoadingCourses = false;

      return;

    }


    /*
      Fetch courses + lessons.
    */

    const [
      courses,
      lessons
    ] = await Promise.all([

      fetchCourses(),

      fetchAllLessons()

    ]);


    /*
      Ignore stale request.
    */

    if (
      currentRequest !== loadRequestId
    ) {

      isLoadingCourses = false;

      return;

    }


    coursesCache =
      courses;


    lessonsCache =
      organizeLessons(
        lessons
      );


    /*
      Render.
    */

    renderCourses(
      coursesCache
    );


    /*
      Status.
    */

    if (courses.length > 0) {

      setStatus(
        `${courses.length} ${
          courses.length === 1
            ? "course"
            : "courses"
        } available.`,
        "ok"
      );

    } else {

      setStatus(
        ""
      );

    }


  } catch (error) {

    console.error(
      "Courses loading error:",
      error
    );


    /*
      Automatic retry.
    */

    if (
      retryCount < MAX_RETRIES
    ) {

      isLoadingCourses = false;


      const delay =
        1000 * (
          retryCount + 1
        );


      setStatus(
        `Connection issue. Retrying...`
      );


      setTimeout(
        () => {

          loadCourses(
            retryCount + 1
          );

        },
        delay
      );


      return;

    }


    /*
      Final error.
    */

    const message =
      getReadableSupabaseError(
        error
      );


    setStatus(
      message,
      "error"
    );


    renderError(
      message
    );


    if (els.retry) {
      els.retry.hidden = false;
    }


  } finally {

    isLoadingCourses = false;

  }

}


/* ============================================================
   SUPABASE ERROR MESSAGE
============================================================ */

function getReadableSupabaseError(
  error
) {

  if (!error) {

    return (
      "Unknown Supabase error."
    );

  }


  const message =
    String(
      error.message ||
      error.error_description ||
      error
    );


  if (
    message.toLowerCase().includes(
      "row-level security"
    )
  ) {

    return (
      "Supabase RLS blocked this request. " +
      "Make sure the logged-in user is approved."
    );

  }


  if (
    message.toLowerCase().includes(
      "jwt"
    )
  ) {

    return (
      "Your login session has expired. " +
      "Please login again."
    );

  }


  if (
    message.toLowerCase().includes(
      "timeout"
    )
  ) {

    return (
      "Supabase took too long to respond. " +
      "Please try again."
    );

  }


  if (
    message.toLowerCase().includes(
      "failed to fetch"
    )
  ) {

    return (
      "Unable to connect to Supabase. " +
      "Please check your internet connection."
    );

  }


  return message;

}


/* ============================================================
   LOGIN CHECK
============================================================ */

async function requireLoggedInUser() {

  /*
    If you don't want authentication,
    set REQUIRE_LOGIN = false above.
  */

  if (!REQUIRE_LOGIN) {
    return true;
  }


  if (!supabaseClient) {

    setStatus(
      "Supabase configuration is missing.",
      "error"
    );

    return false;

  }


  try {

    const {
      data,
      error
    } =
      await withTimeout(
        supabaseClient.auth.getSession()
      );


    if (error) {
      throw error;
    }


    if (
      !data ||
      !data.session
    ) {

      const currentPage =
        window.location.pathname
          .split("/")
          .pop() ||
        "courses.html";


      const next =
        encodeURIComponent(
          currentPage
        );


      /*
        Redirect only if login.html exists.
      */

      if (LOGIN_PAGE) {

        window.location.href =
          `${LOGIN_PAGE}?redirect=${next}`;

      }


      return false;

    }


    return true;


  } catch (error) {

    console.error(
      "Authentication check error:",
      error
    );


    setStatus(
      "Unable to verify your login session.",
      "error"
    );


    return false;

  }

}


/* ============================================================
   GET LESSON VIDEO URL
============================================================ */

function getLessonVideoUrl(
  lesson
) {

  /*
    Your database contains video_url.
    This is the primary video source.
  */

  if (
    isValidUrl(
      lesson.video_url
    )
  ) {

    return lesson.video_url;

  }


  /*
    bunny_video_id exists in your schema,
    but without the actual Bunny CDN hostname
    we must NOT invent a URL.

    Therefore return empty if only bunny_video_id
    exists.
  */

  return "";

}


/* ============================================================
   OPEN COURSE LESSONS
============================================================ */

async function openCourseLessons(
  courseId
) {

  if (!courseId) {
    return;
  }


  const course =
    coursesCache.find(
      item =>
        String(item.id) ===
        String(courseId)
    );


  if (!course) {

    setStatus(
      "Course not found.",
      "error"
    );

    return;

  }


  if (!els.modal) {

    console.error(
      "Lesson modal element not found."
    );

    return;

  }


  /*
    Title
  */

  if (els.modalTitle) {

    els.modalTitle.textContent =
      course.title ||
      "Course Lessons";

  }


  /*
    Show modal immediately.
  */

  els.modal.classList.add(
    "open"
  );

  document.body.style.overflow =
    "hidden";


  /*
    Get lessons from cache.
  */

  let lessons =
    lessonsCache[courseId] || [];


  /*
    If lessons are not cached,
    fetch specifically for this course.
  */

  if (
    lessons.length === 0
  ) {

    if (els.lessonList) {

      els.lessonList.innerHTML = `

        <div
          style="
            padding:40px 20px;
            text-align:center;
            color:#aaa1a5;
          "
        >
          Loading lessons...
        </div>

      `;

    }


    try {

      lessons =
        await fetchLessonsForCourse(
          courseId
        );


      lessonsCache[
        courseId
      ] =
        lessons;


      /*
        Refresh cards so lesson count updates.
      */

      renderCourses(
        coursesCache
      );


      /*
        Re-open modal after render.
      */

      if (els.modalTitle) {

        els.modalTitle.textContent =
          course.title ||
          "Course Lessons";

      }

    } catch (error) {

      console.error(
        "Lesson loading error:",
        error
      );


      if (els.lessonList) {

        els.lessonList.innerHTML = `

          <div class="empty">

            Unable to load lessons.

            <br>

            <small>
              ${escapeHtml(
                getReadableSupabaseError(
                  error
                )
              )}
            </small>

            <br><br>

            <button
              class="retry"
              type="button"
              id="retryLessonsBtn"
            >
              Retry
            </button>

          </div>

        `;


        const retryLessons =
          document.getElementById(
            "retryLessonsBtn"
          );


        if (retryLessons) {

          retryLessons.addEventListener(
            "click",
            () => {

              openCourseLessons(
                courseId
              );

            }
          );

        }

      }

      return;

    }

  }


  renderLessons(
    lessons
  );

}


/* ============================================================
   FETCH LESSONS FOR ONE COURSE
============================================================ */

async function fetchLessonsForCourse(
  courseId
) {

  if (!supabaseClient) {

    throw new Error(
      "Supabase client is unavailable."
    );

  }


  const query =
    supabaseClient

      .from(
        "course_lessons"
      )

      .select(`
        id,
        course_id,
        title,
        description,
        lesson_number,
        bunny_video_id,
        duration,
        is_published,
        created_at,
        updated_at,
        video_url
      `)

      .eq(
        "course_id",
        courseId
      )

      .eq(
        "is_published",
        true
      )

      .order(
        "lesson_number",
        {
          ascending: true
        }
      );


  const result =
    await withTimeout(
      query
    );


  if (result.error) {

    throw result.error;

  }


  return result.data || [];

}


/* ============================================================
   RENDER LESSONS
============================================================ */

function renderLessons(
  lessons
) {

  if (!els.lessonList) {
    return;
  }


  if (
    !lessons ||
    lessons.length === 0
  ) {

    els.lessonList.innerHTML = `

      <div class="empty">

        No published lessons are available
        for this course yet.

      </div>

    `;

    return;

  }


  els.lessonList.innerHTML =
    lessons.map(
      (lesson, index) => {

        const number =
          String(
            lesson.lesson_number ??
            index + 1
          ).padStart(
            2,
            "0"
          );


        const title =
          escapeHtml(
            lesson.title ||
            `Lesson ${index + 1}`
          );


        const description =
          escapeHtml(
            lesson.description ||
            ""
          );


        const duration =
          escapeHtml(
            lesson.duration ||
            ""
          );


        const videoUrl =
          getLessonVideoUrl(
            lesson
          );


        const hasVideo =
          isValidUrl(
            videoUrl
          );


        return `

          <button
            class="
              lesson
              ${hasVideo ? "" : "no-video"}
            "
            type="button"
            data-video-url="${escapeHtml(videoUrl)}"
            ${hasVideo ? "" : "disabled"}
          >

            <span class="lesson-no">
              ${number}
            </span>


            <span class="lesson-info">

              <span class="lesson-title">
                ${title}
              </span>

              <span class="lesson-desc">

                ${
                  duration
                    ? escapeHtml(duration)
                    : ""
                }

                ${
                  duration && description
                    ? " · "
                    : ""
                }

                ${description}

                ${
                  !hasVideo
                    ? " · Video unavailable"
                    : ""
                }

              </span>

            </span>


            <span class="lesson-arrow">

              ${
                hasVideo
                  ? "▶"
                  : "—"
              }

            </span>

          </button>

        `;

      }
    ).join("");


  /*
    Open video URL stored in Supabase.
  */

  els.lessonList
    .querySelectorAll(
      ".lesson:not(:disabled)"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const url =
              button.dataset.videoUrl;


            if (
              !isValidUrl(url)
            ) {

              return;

            }


            window.open(
              url,
              "_blank",
              "noopener,noreferrer"
            );

          }
        );

      }
    );

}


/* ============================================================
   CLOSE LESSON MODAL
============================================================ */

function closeLessons() {

  if (!els.modal) {
    return;
  }


  els.modal.classList.remove(
    "open"
  );


  document.body.style.overflow =
    "";

}


/* ============================================================
   MODAL EVENTS
============================================================ */

if (els.closeModal) {

  els.closeModal.addEventListener(
    "click",
    closeLessons
  );

}


if (els.modal) {

  els.modal.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        els.modal
      ) {

        closeLessons();

      }

    }
  );

}


document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      closeLessons();

    }

  }
);


/* ============================================================
   RETRY BUTTON
============================================================ */

if (els.retry) {

  els.retry.addEventListener(
    "click",
    () => {

      loadCourses();

    }
  );

}


/* ============================================================
   REALTIME
============================================================ */

function startRealtimeUpdates() {

  if (
    !supabaseClient ||
    !REALTIME_ENABLED
  ) {

    return;

  }


  /*
    Avoid duplicate channels.
  */

  if (realtimeChannel) {

    try {

      supabaseClient.removeChannel(
        realtimeChannel
      );

    } catch (error) {

      console.warn(
        "Could not remove old realtime channel:",
        error
      );

    }

  }


  realtimeChannel =
    supabaseClient

      .channel(
        "aurevia-courses-live"
      )

      /*
        Courses changed
      */

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "courses"
        },
        () => {

          loadCourses();

        }
      )

      /*
        Lessons changed
      */

      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "course_lessons"
        },
        () => {

          loadCourses();

        }
      )

      .subscribe(
        status => {

          console.log(
            "Aurevia realtime:",
            status
          );

        }
      );

}


/* ============================================================
   AUTH STATE CHANGES
============================================================ */

if (supabaseClient) {

  supabaseClient.auth.onAuthStateChange(
    (
      event,
      session
    ) => {

      console.log(
        "Auth event:",
        event
      );


      /*
        User logged out.
      */

      if (
        event === "SIGNED_OUT"
      ) {

        coursesCache = [];

        lessonsCache = {};

        if (els.grid) {

          els.grid.innerHTML = "";

        }


        return;

      }


      /*
        User logged in or token refreshed.
      */

      if (
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED"
      ) {

        if (session) {

          loadCourses();

        }

      }

    }
  );

}


/* ============================================================
   INITIALIZE
============================================================ */

async function initializeCoursesPage() {

  /*
    Check basic DOM.
  */

  if (!els.grid) {

    console.error(
      "coursesGrid element not found."
    );

    return;

  }


  /*
    Check Supabase.
  */

  if (!supabaseClient) {

    setStatus(
      "Supabase could not be initialized.",
      "error"
    );

    renderError(
      "Supabase client could not be initialized. Make sure the Supabase CDN script is loaded before courses.js."
    );

    return;

  }


  /*
    Load initial data.
  */

  await loadCourses();


  /*
    Start realtime after initial load.
  */

  startRealtimeUpdates();

}


/* ============================================================
   START
============================================================ */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeCoursesPage
  );

} else {

  initializeCoursesPage();

}