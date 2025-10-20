import React, { useState, useEffect } from "react";
import { apiFetch } from "../utils/api";
import { usePopup } from "../components/PopupProvider";
import "../css/profile.css"; // 👈 Add this line

export default function Profile() {
  const popup = usePopup();
  const [user, setUser] = useState({});
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser || {});
  }, []);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(user).forEach(([key, val]) =>
        formData.append(key, val || "")
      );
      if (photo) formData.append("photo", photo);

      const res = await apiFetch("/user/update-profile", {
        method: "POST",
        body: formData,
      });

      const updatedUser = { ...user, photo_url: res.photo_url };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("auth-updated"));
      setUser(updatedUser);

      popup.open({
        type: "success",
        title: "Profile Updated",
        message: "✅ Your profile has been updated successfully!",
      });
    } catch (err) {
      console.error("Profile update error:", err);
      popup.open({
        type: "error",
        title: "Update Failed",
        message: "❌ Something went wrong while updating your profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="main-body">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="main-breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a href="/">Home</a>
            </li>
            <li className="breadcrumb-item">
              <a href="javascript:void(0)">User</a>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              User Profile
            </li>
          </ol>
        </nav>

        <div className="row gutters-sm">
          {/* LEFT SIDE */}
          <div className="col-md-4 mb-3">
            <div className="card">
              <div className="card-body">
                <div className="d-flex flex-column align-items-center text-center">
                  <img
                    src={
                      preview ||
                      user?.photo_url ||
                      "https://bootdey.com/img/Content/avatar/avatar7.png"
                    }
                    alt="Admin"
                    className="rounded-circle"
                    width="150"
                    height="150"
                  />
                  <div className="mt-3">
                    <h4>{user?.name || "John Doe"}</h4>
                    <p className="text-secondary mb-1">
                      {user?.role || "Full Stack Developer"}
                    </p>
                    <p className="text-muted font-size-sm">
                      {user?.city || "Bay Area, San Francisco, CA"}
                    </p>
                    <button className="btn btn-primary me-2">Follow</button>
                    <button className="btn btn-outline-primary">Message</button>
                    <div className="mt-3">
                      <label className="btn btn-outline-secondary btn-sm">
                        Change Photo
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setPhoto(file);
                              setPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card mt-3">
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                  <h6 className="mb-0">🌐 Website</h6>
                  <span className="text-secondary">https://bootdey.com</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                  <h6 className="mb-0">🐙 Github</h6>
                  <span className="text-secondary">bootdey</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                  <h6 className="mb-0">🐦 Twitter</h6>
                  <span className="text-secondary">@bootdey</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                  <h6 className="mb-0">📸 Instagram</h6>
                  <span className="text-secondary">bootdey</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                  <h6 className="mb-0">📘 Facebook</h6>
                  <span className="text-secondary">bootdey</span>
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="col-md-8">
            <div className="card mb-3">
              <div className="card-body">
                <form onSubmit={handleUpdate}>
                  <div className="row">
                    <div className="col-sm-3">
                      <h6 className="mb-0">Full Name</h6>
                    </div>
                    <div className="col-sm-9 text-secondary">
                      <input
                        type="text"
                        name="name"
                        value={user?.name || ""}
                        onChange={handleChange}
                        className="form-control"
                      />
                    </div>
                  </div>
                  <hr />
                  <div className="row">
                    <div className="col-sm-3">
                      <h6 className="mb-0">Email</h6>
                    </div>
                    <div className="col-sm-9 text-secondary">
                      <input
                        type="email"
                        name="email"
                        value={user?.email || ""}
                        className="form-control"
                        disabled
                      />
                    </div>
                  </div>
                  <hr />
                  <div className="row">
                    <div className="col-sm-3">
                      <h6 className="mb-0">Phone</h6>
                    </div>
                    <div className="col-sm-9 text-secondary">
                      <input
                        type="text"
                        name="phone"
                        value={user?.phone || ""}
                        onChange={handleChange}
                        className="form-control"
                      />
                    </div>
                  </div>
                  <hr />
                  <div className="row">
                    <div className="col-sm-3">
                      <h6 className="mb-0">City</h6>
                    </div>
                    <div className="col-sm-9 text-secondary">
                      <input
                        type="text"
                        name="city"
                        value={user?.city || ""}
                        onChange={handleChange}
                        className="form-control"
                      />
                    </div>
                  </div>
                  <hr />
                  <div className="row">
                    <div className="col-sm-12">
                      <button
                        type="submit"
                        className="btn btn-primary "
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Update"}
                      </button>
                    </div>
                    <div className="col-sm-12 mt-3">
                      <button
                        type="button"
                        className="btn btn-warning"
                        onClick={() =>
                          (window.location.href = "/forgot-password")
                        }
                      >
                        Change Password
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Project Status Cards */}
            <div className="row gutters-sm">
              {[1, 2].map((i) => (
                <div className="col-sm-6 mb-3" key={i}>
                  <div className="card h-100">
                    <div className="card-body">
                      <h6 className="d-flex align-items-center mb-3">
                        <i className="material-icons text-info mr-2">
                          assignment
                        </i>
                        Project Status
                      </h6>
                      {[
                        ["Web Design", 80],
                        ["Website Markup", 72],
                        ["One Page", 89],
                        ["Mobile Template", 55],
                        ["Backend API", 66],
                      ].map(([label, percent]) => (
                        <React.Fragment key={label}>
                          <small>{label}</small>
                          <div
                            className="progress mb-3"
                            style={{ height: "5px" }}
                          >
                            <div
                              className="progress-bar bg-primary"
                              role="progressbar"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
