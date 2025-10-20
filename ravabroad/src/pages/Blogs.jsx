import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "../bootstrap-overrides.css";
import "../css/Blogs.css";
import { Link } from "react-router-dom";

const BegampuraHeading = () => (
  <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
    <div
      style={{
        flex: 1,
        height: "2px",
        background:
          "linear-gradient(to right, transparent, #e63946, transparent)",
      }}
    ></div>
    <img
      src="/template/img/6Qt0bpw3_400x400-removebg-preview.png
"
      alt="Begampura Logo"
      style={{
        width: "55px",
        height: "55px",
        borderRadius: "50%",
        objectFit: "cover",
      }}
    />
    <h3 className="fw-bold text-uppercase mb-0">The Begampura News</h3>
    <div
      style={{
        flex: 1,
        height: "2px",
        background:
          "linear-gradient(to right, transparent, #e63946, transparent)",
      }}
    ></div>
  </div>
);

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchBlogs();
    fetchCategories();
  }, []);

  const fetchBlogs = async (category = "") => {
    try {
      const url = category
        ? `${process.env.REACT_APP_API_URL}/api/blogs?category=${category}`
        : `${process.env.REACT_APP_API_URL}/api/blogs`;

      const res = await fetch(url);
      const data = await res.json();
      setBlogs(data || []);
    } catch (err) {
      console.error("❌ Failed to fetch blogs:", err);
    } finally {
      setLoading(false);
    }
  };

const fetchCategories = async () => {
  try {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/categories`);
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("❌ Failed to load categories:", err);
  }
};

  return (
    <main className="gray-bg">
      {/* ===== Trending Section ===== */}
      <section className="trending-area pt-25 gray-bg">
        <div className="container">
          <div className="section-tittle mb-4 text-center">
            <BegampuraHeading />
          </div>
          {/* 🏷 Category Filter Bar */}
          <div className="text-center my-4">
            <div className="d-inline-flex flex-wrap justify-content-center gap-2">
              <button
                className={`btn btn-sm ${
                  selectedCategory === ""
                    ? "btn-primary"
                    : "btn-outline-primary"
                }`}
                onClick={() => {
                  setSelectedCategory("");
                  fetchBlogs("");
                }}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`btn btn-sm ${
                    selectedCategory === cat.id
                      ? "btn-primary"
                      : "btn-outline-primary"
                  }`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    fetchBlogs(cat.id);
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-center text-muted">Loading latest posts...</p>
          ) : blogs.length === 0 ? (
            <p className="text-center text-muted">No blog posts yet.</p>
          ) : (
            <Swiper
              spaceBetween={30}
              slidesPerView={2}
              loop={blogs.length > 2}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              pagination={{ clickable: true }}
              navigation={true}
              modules={[Autoplay, Pagination, Navigation]}
              className="mySwiper"
              breakpoints={{
                0: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                1200: { slidesPerView: 3 },
              }}
            >
              {blogs.map((post) => (
                <SwiperSlide key={post.id}>
                  <Link
                    to={`/blogs/${post.slug}`}
                    className="text-decoration-none text-dark"
                  >
                    <div className="blog-card">
                      <div className="card-banner">
                        <p
                          className={`category-tag ${
                            post.category_name ? "popular" : ""
                          }`}
                        >
                          {post.category_name || "General"}
                        </p>
                        <img
                          className="banner-img"
                          src={
                            post.image_url ||
                            "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80"
                          }
                          alt={post.title}
                        />
                      </div>
                      <div className="card-body">
                        <h5 className="blog-title">{post.title}</h5>
                        <p
                          className="blog-description"
                          dangerouslySetInnerHTML={{
                            __html: post.excerpt || "",
                          }}
                        ></p>
                        <div className="card-profile">
                          <img
                            className="profile-img"
                            src="https://cdn-icons-png.flaticon.com/512/1077/1077114.png"
                            alt={post.author_name || "Admin"}
                          />
                          <div className="card-profile-info">
                            <h6 className="profile-name mb-0">
                              {post.author_name || "Admin"}
                            </h6>
                            <p className="profile-followers mb-0 small text-muted">
  {new Date(post.created_at).toLocaleDateString()} • 👁 {post.views || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>

      {/* ===== What's New Section ===== */}
      <section className="whats-news-area pt-50 pb-20 gray-bg">
        <div className="container">
          <div className="whats-news-wrapper">
            <div className="section-tittle mb-30">
              <h3>🆕 What's New</h3>
            </div>
            <div className="row">
              {loading ? (
                <p className="text-center text-muted">Loading...</p>
              ) : blogs.length === 0 ? (
                <p className="text-center text-muted">No recent posts found.</p>
              ) : (
                blogs.slice(0, 2).map((post) => (
                  <div className="col-lg-6 col-md-6" key={post.id}>
                    <Link
                      to={`/blogs/${post.slug}`}
                      className="text-decoration-none text-dark"
                    >
                      <div className="whats-news-single mb-40">
                        <div className="whates-img">
                          <img
                            src={
                              post.image_url ||
                              "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80"
                            }
                            alt={post.title}
                            className="img-fluid rounded shadow-sm"
                          />
                        </div>
                        <div className="whates-caption">
                          <h4>{post.title}</h4>
                          <span>
                            {post.author_name || "Admin"} –{" "}
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                          <p
                            dangerouslySetInnerHTML={{
                              __html: post.excerpt || "",
                            }}
                          ></p>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Video Section ===== */}
      <section className="youtube-area video-padding bg-light py-5">
        <div className="container text-center">
          <h3 className="mb-4">🎥 Featured Video</h3>
          <div className="row justify-content-center">
            <div className="col-md-8">
              <iframe
                width="100%"
                height="420"
                src="https://www.youtube.com/embed/zpOULjyy-n8?autoplay=1&mute=1"
                title="Ravidassia Abroad Overview"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded shadow"
              ></iframe>
              <p className="mt-2 text-muted">
                Insight into Ravidassia Abroad community development – 2025
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Weekly News Slider ===== */}
      <section className="weekly-news py-5 gray-bg">
        <div className="container">
          <div className="section-tittle mb-4 text-center">
            <h3>🗞️ Weekly Highlights</h3>
          </div>
          <Swiper
            spaceBetween={15}
            slidesPerView={3}
            loop={true}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            modules={[Autoplay]}
            breakpoints={{
              0: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1200: { slidesPerView: 3 },
            }}
          >
            {[
              {
                img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
                title: "Tech Expo Halifax 2025",
                desc: "Youth innovators showcase AI-powered tools.",
              },
              {
                img: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=900&q=80",
                title: "Community Gathering in Toronto",
                desc: "Hundreds unite to celebrate cultural heritage.",
              },
              {
                img: "https://images.unsplash.com/photo-1504805572947-34fad45aed93?auto=format&fit=crop&w=900&q=80",
                title: "Ravidassia Abroad Volunteers Program",
                desc: "Join seva teams helping newcomers across Canada.",
              },
            ].map((item, i) => (
              <SwiperSlide key={i}>
                <div className="blog-card small">
                  <div className="card-banner">
                    <img
                      className="banner-img"
                      src={item.img}
                      alt={item.title}
                    />
                  </div>
                  <div className="card-body">
                    <h6 className="blog-title mb-1">{item.title}</h6>
                    <p className="small text-muted mb-0">{item.desc}</p>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* ===== Banner Section ===== */}
      <div className="banner-area gray-bg pt-90 pb-90">
        <div className="container text-center">
          <img
            src="https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&w=900&q=80"
            alt="Banner"
            className="img-fluid rounded shadow"
          />
          <h4 className="mt-3 fw-bold">
            Empowering Global Ravidassia Community
          </h4>
        </div>
      </div>
    </main>
  );
};

export default Blogs;
