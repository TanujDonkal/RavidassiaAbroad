import React, { useState, useEffect } from "react";
import { apiFetch } from "../utils/api";
import { usePopup } from "../components/PopupProvider";

export default function Profile() {
      const popup = usePopup();
  const [user, setUser] = useState(null);
  const [preview, setPreview] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    setUser(u || {});
  }, []);

  
  const handleUpdate = async (e) => {
  e.preventDefault();
  try {
    const formData = new FormData();
    Object.entries(user).forEach(([key, val]) =>
      formData.append(key, val || "")
    );
    if (photo) formData.append("photo", photo);

    // ✅ FIXED endpoint path (add slash)
    const res = await apiFetch("/user/update-profile", {
      method: "POST",
      body: formData,
    });

    // ✅ Update localStorage + refresh navbar avatar instantly
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
  }
};
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         


  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  return (
    
    <div className="container py-4 profile-page">
      <nav aria-label="breadcrumb" className="main-breadcrumb mb-4">
        <ol className="breadcrumb bg-light p-2 rounded">
          <li className="breadcrumb-item"><a href="/">Home</a></li>
          <li className="breadcrumb-item active">Profile</li>
        </ol>
      </nav>

      <div className="row gutters-sm">
        {/* Left Column */}
        <div className="col-md-4 mb-3">
          <div className="card text-center">
            <div className="card-body">
              <img
                src={
                  preview ||
                  user?.photo_url ||
                  "https://bootdey.com/img/Content/avatar/avatar7.png"
                }
                alt="Profile"
                className="rounded-circle mb-3"
                width="150"
                height="150"
              />
              <div className="mt-2">
                <label className="btn btn-outline-primary btn-sm">
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
              <h4 className="mt-3">{user?.name}</h4>
              <p className="text-secondary mb-1">{user?.role || "Member"}</p>
              <p className="text-muted font-size-sm">
                {user?.city || "Your City"}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-md-8">
          <div className="card mb-3">
            <div className="card-body">
              <form onSubmit={handleUpdate} encType="multipart/form-data">
                <div className="row mb-3">
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
                <div className="row mb-3">
                  <div className="col-sm-3">
                    <h6 className="mb-0">Email</h6>
                  </div>
                  <div className="col-sm-9 text-secondary">
                    <input
                      type="email"
                      name="email"
                      value={user?.email || ""}
                      onChange={handleChange}
                      className="form-control"
                      disabled
                    />
                  </div>
                </div>
                <div className="row mb-3">
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
                <div className="row mb-3">
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
                <div className="row">
                  <div className="col-sm-12 text-end">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Toast Notification */}
<div
  className="position-fixed bottom-0 end-0 p-3"
  style={{ zIndex: 1050 }}
>
  <div
    id="profileToast"
    className="toast align-items-center text-bg-success border-0"
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
  >
    <div className="d-flex">
      <div className="toast-body">
        ✅ Profile updated successfully!
      </div>
      <button
        type="button"
        className="btn-close btn-close-white me-2 m-auto"
        data-bs-dismiss="toast"
        aria-label="Close"
      ></button>
    </div>
  </div>
</div>

    </div>
  );
}
