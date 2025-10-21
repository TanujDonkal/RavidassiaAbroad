import React, { useEffect, useState } from "react";
import { API_BASE } from "../utils/api";

export default function FamousPersonalities() {
  const [list, setList] = useState([]);
  const [filters, setFilters] = useState({
    caste: "Chamar",
    region: "",
    category: "",
    sc_st_type: "",
  });
  const [selectedIndex, setSelectedIndex] = useState(null);

  const fetchList = async () => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
    );
    const res = await fetch(`${API_BASE}/personalities?${params.toString()}`);
    const data = await res.json();
    setList(data || []);
  };

  useEffect(() => {
    fetchList();
  }, [filters]);

  const selected = selectedIndex !== null ? list[selectedIndex] : null;

  const handleNext = () => {
    if (list.length > 0)
      setSelectedIndex((prev) => (prev + 1) % list.length);
  };

  const handlePrev = () => {
    if (list.length > 0)
      setSelectedIndex((prev) => (prev - 1 + list.length) % list.length);
  };

  return (
    <main className="container py-5">
      <h2 className="text-center text-primary fw-bold mb-4">
        🌟 Famous Personalities
      </h2>

      {/* Filters */}
      <div className="card p-3 mb-4 shadow-sm">
        <div className="row g-3">
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={filters.region}
              onChange={(e) =>
                setFilters({ ...filters, region: e.target.value })
              }
            >
              <option value="">All Regions</option>
              <option value="India">India</option>
              <option value="Abroad">Abroad</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={filters.caste}
              onChange={(e) =>
                setFilters({ ...filters, caste: e.target.value })
              }
            >
              <option value="Chamar">Chamar</option>
              <option value="Valmiki">Valmiki</option>
              <option value="Ravidassia">Ravidassia</option>
              <option value="">All Castes</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={filters.sc_st_type}
              onChange={(e) =>
                setFilters({ ...filters, sc_st_type: e.target.value })
              }
            >
              <option value="">All</option>
              <option value="SC">Schedule Caste</option>
              <option value="ST">Schedule Tribe</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
            >
              <option value="">All Categories</option>
              <option value="Artist">Artist</option>
              <option value="Politician">Politician</option>
              <option value="Scholar">Scholar</option>
              <option value="Activist">Activist</option>
              <option value="Religious Leader">Religious Leader</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listing */}
      <div className="row g-3 g-md-4">
        {list.length === 0 && (
          <div className="text-center text-muted">No personalities found.</div>
        )}

        {list.map((p, i) => (
          <div
            key={p.id}
            className="col-6 col-md-4 col-lg-3 d-flex"
            onClick={() => setSelectedIndex(i)}
            style={{ cursor: "pointer" }}
          >
            <div className="card shadow-sm border-0 h-100 flex-fill">
              <img
                src={p.photo_url}
                alt={p.name}
                className="card-img-top"
                style={{
                  height: "200px",
                  objectFit: "cover",
                }}
              />
              <div className="card-body text-center p-2">
                <h6 className="fw-semibold mb-1" style={{ fontSize: "0.9rem" }}>
                  {p.name}
                </h6>
                <p className="text-muted mb-0" style={{ fontSize: "0.75rem" }}>
                  {p.category} • {p.region}
                </p>
                <p
                  className="text-secondary mt-1"
                  style={{
                    fontSize: "0.7rem",
                    lineHeight: "1.2",
                    height: "2.2em",
                    overflow: "hidden",
                  }}
                >
                  {p.short_bio}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Modal with navigation */}
      {selected && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.85)",
            zIndex: 2000,
          }}
        >
          <div
            className="modal-dialog modal-fullscreen"
            style={{
              margin: 0,
              maxWidth: "100%",
              width: "100%",
            }}
          >
            <div className="modal-content border-0 bg-white text-dark h-100 overflow-hidden">
              {/* Header */}
              <div className="modal-header border-0 bg-primary text-white">
                <h5 className="modal-title text-center w-100">
                  {selected.name}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white position-absolute end-0 me-3"
                  onClick={() => setSelectedIndex(null)}
                ></button>
              </div>

              {/* Body */}
              <div
                className="modal-body text-center overflow-auto py-4"
                style={{ maxHeight: "100%" }}
              >
                <img
                  src={selected.photo_url}
                  alt={selected.name}
                  className="rounded mb-3 shadow"
                  style={{
                    width: "180px",
                    height: "180px",
                    objectFit: "cover",
                    border: "4px solid #fff",
                  }}
                />
                <h5 className="fw-bold text-warning mb-1">
                  {selected.category}
                </h5>
                <p
                  className="text-light mb-2 small"
                  style={{ opacity: 0.85 }}
                >
                  {selected.caste} • {selected.region} • {selected.sc_st_type}
                </p>
                <div
                  className="text-start mx-auto"
                  style={{
                    maxWidth: "800px",
                    fontSize: "0.9rem",
                    lineHeight: "1.6",
                    opacity: 0.9,
                  }}
                >
                  {selected.full_bio || selected.short_bio}
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer border-0 justify-content-between px-4 pb-4">
                <button
                  className="btn btn-outline-light btn-sm px-4"
                  onClick={handlePrev}
                >
                  ← Prev
                </button>
                <button
                  className="btn btn-outline-light btn-sm px-4"
                  onClick={handleNext}
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
