import { useTheme } from "../context/useTheme";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/layout/Footer";
import "../styles/Home.css";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleCourseClick = () => {
    navigate("/signup");
  };

  return (
    <div className={`home-page ${theme === "dark" ? "home-page--dark" : "home-page--light"}`}>
      <header className="home-navbar">
        <div className="home-navbar__brand">
          <Link className="home-navbar__logo" to="/">
            E-Learning Platform
          </Link>
          <span className="home-navbar__tag">Premium learning made intuitive</span>
        </div>
        <div className="home-navbar__actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          <Link className="btn primary-btn" to="/signup">
            Signup
          </Link>
          <Link className="btn secondary-btn" to="/login">
            Login
          </Link>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-background"></div>
          <div className="landing-grid container">
            <div className="hero-copy animate-fade-up">
              <span className="eyebrow">Build premium learning experiences</span>
              <h1>Launch the academy your learners deserve.</h1>
              <p>
                Create stunning courses, motivate students with intelligent learning paths, and track success with beautiful analytics.
                Every interaction feels fast, modern, and unmistakably premium.
              </p>
              <div className="hero-actions">
                <Link className="btn primary-btn" to="/signup">
                  Start Free Trial
                </Link>
                <Link className="btn secondary-btn" to="/login">
                  Login
                </Link>
              </div>
              <div className="hero-badges">
                <div className="badge">Trusted by educators</div>
                <div className="badge">Launch in minutes</div>
                <div className="badge">Secure publishing</div>
              </div>
            </div>
            <div className="hero-panel animate-fade-up delay-sm">
              <div className="glass-card">
                <div className="glass-card__header">
                  <span>Action-ready insights</span>
                  <strong>Decisions powered by real-time course data</strong>
                </div>
                <div className="glass-card__stats">
                  <div>
                    <strong>98%</strong>
                    <p>Completion rate</p>
                  </div>
                  <div>
                    <strong>4.9/5</strong>
                    <p>Instructor rating</p>
                  </div>
                </div>
                <div className="glass-card__list">
                  <p>Highlights</p>
                  <ul>
                    <li>Live progress snapshots</li>
                    <li>Smarter feedback loops</li>
                    <li>AI-style course recommendations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-features">
          <div className="section-header">
            <span className="eyebrow">Features crafted for growth</span>
            <h2>Everything your academy needs in one elegant dashboard.</h2>
          </div>
          <div className="feature-grid">
            <article className="feature-card animate-fade-up">
              <strong>Course authoring</strong>
              <p>Create interactive lessons, upload media, and launch polished programs in minutes.</p>
            </article>
            <article className="feature-card animate-fade-up delay-xs">
              <strong>Student engagement</strong>
              <p>Keep learners motivated with progress streaks, certificates, and real-time updates.</p>
            </article>
            <article className="feature-card animate-fade-up delay-sm">
              <strong>Assessments & quizzes</strong>
              <p>Build customizable quizzes with instant results, analytics, and secure grading.</p>
            </article>
            <article className="feature-card animate-fade-up delay-md">
              <strong>Premium reporting</strong>
              <p>Run instant reports on course completion, engagement, and instructor performance.</p>
            </article>
            <article className="feature-card animate-fade-up delay-lg">
              <strong>Collaborative workflows</strong>
              <p>Share resources, enroll teams, and coordinate with instructors across every course.</p>
            </article>
            <article className="feature-card animate-fade-up delay-xl">
              <strong>Secure feedback</strong>
              <p>Collect ratings, reviews, and complaints with robust moderation and reporting tools.</p>
            </article>
          </div>
        </section>

        <section className="landing-courses">
          <div className="section-header">
            <span className="eyebrow">Popular course paths</span>
            <h2>Designed to help learners master the most in-demand skills.</h2>
            <p className="section-subtitle">Most recommended courses for learners who want to grow fast and become developers.</p>
          </div>
          <div className="course-grid">
            <article
              className="course-card animate-fade-up clickable-card"
              onClick={handleCourseClick}
              onKeyDown={(event) => event.key === "Enter" && handleCourseClick()}
              role="button"
              tabIndex="0"
            >
              <strong>Python for Data Science</strong>
              <p>From fundamentals to machine learning pipelines, build confidence with real-world projects.</p>
              <span>Beginner → Advanced</span>
            </article>
            <article
              className="course-card animate-fade-up delay-xs clickable-card"
              onClick={handleCourseClick}
              onKeyDown={(event) => event.key === "Enter" && handleCourseClick()}
              role="button"
              tabIndex="0"
            >
              <strong>Java Mastery</strong>
              <p>Create scalable backend systems, microservices, and enterprise apps with Java.</p>
              <span>Core to Cloud</span>
            </article>
            <article
              className="course-card animate-fade-up delay-sm clickable-card"
              onClick={handleCourseClick}
              onKeyDown={(event) => event.key === "Enter" && handleCourseClick()}
              role="button"
              tabIndex="0"
            >
              <strong>Spring Boot</strong>
              <p>Build modern APIs, secure services, and production-ready systems with Spring Boot.</p>
              <span>APIs, Security, Deployment</span>
            </article>
            <article
              className="course-card animate-fade-up delay-md clickable-card"
              onClick={handleCourseClick}
              onKeyDown={(event) => event.key === "Enter" && handleCourseClick()}
              role="button"
              tabIndex="0"
            >
              <strong>React JS</strong>
              <p>Develop polished, interactive user interfaces and reusable component systems.</p>
              <span>UI, State, Performance</span>
            </article>
            <article
              className="course-card animate-fade-up delay-lg clickable-card"
              onClick={handleCourseClick}
              onKeyDown={(event) => event.key === "Enter" && handleCourseClick()}
              role="button"
              tabIndex="0"
            >
              <strong>Node JS</strong>
              <p>Create fast APIs, real-time apps, and server-side workflows using Node.js.</p>
              <span>Backend, APIs, DevOps</span>
            </article>
            <article
              className="course-card animate-fade-up delay-xl clickable-card"
              onClick={handleCourseClick}
              onKeyDown={(event) => event.key === "Enter" && handleCourseClick()}
              role="button"
              tabIndex="0"
            >
              <strong>Fullstack Launchpad</strong>
              <p>Combine frontend and backend skills for complete course projects and portfolio-ready apps.</p>
              <span>React + Node + Database</span>
            </article>
          </div>
          <div className="course-signup-text animate-fade-up delay-sm" onClick={handleCourseClick} role="button" tabIndex="0" onKeyDown={(event) => event.key === "Enter" && handleCourseClick()}>
            <span>Ready to start your journey?</span> <strong>Sign up now to access all courses.</strong>
          </div>
        </section>

        <section className="landing-stats">
          <div className="stats-grid animate-fade-up">
            <div className="stat-card">
              <strong>12K+</strong>
              <p>Active learners served</p>
            </div>
            <div className="stat-card">
              <strong>1.8M</strong>
              <p>Lessons delivered</p>
            </div>
            <div className="stat-card">
              <strong>24/7</strong>
              <p>Premium support access</p>
            </div>
          </div>
        </section>

        <section className="landing-cta">
          <div className="cta-panel animate-fade-up">
            <div>
              <span className="eyebrow">Launch with confidence</span>
              <h2>Design a premium learning experience your audience will love.</h2>
            </div>
            <div className="cta-actions">
              <Link className="btn primary-btn" to="/signup">
                Create your account
              </Link>
              <Link className="btn secondary-btn" to="/login">
                Explore dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
