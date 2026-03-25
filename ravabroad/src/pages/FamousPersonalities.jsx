import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { API_BASE } from "../utils/api";

export default function FamousPersonalities() {
  const [searchParams] = useSearchParams();
  const requestedPersonId = searchParams.get("person");
  const searchText = searchParams.get("q")?.trim() || "";
  const hasSearchLanding = Boolean(requestedPersonId || searchText);

  const [list, setList] = useState([]);
  const [filters, setFilters] = useState({
    caste: hasSearchLanding ? "" : "Chamar",
    region: "",
    category: "",
    sc_st_type: "",
  });
  const [selectedIndex, setSelectedIndex] = useState(null);

  const fetchList = useCallback(async () => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
    );
    const res = await fetch(`${API_BASE}/personalities?${params.toString()}`);
    const data = await res.json();
    setList(data || []);
  }, [filters]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!requestedPersonId && !searchText) return;

    setFilters((current) => {
      if (current.caste === "") return current;
      return { ...current, caste: "" };
    });
  }, [requestedPersonId, searchText]);

  const filteredList = useMemo(() => {
    if (!searchText) return list;

    const normalized = searchText.toLowerCase();
    return list.filter((person) =>
      [
        person.name,
        person.category,
        person.region,
        person.caste,
        person.sc_st_type,
        person.short_bio,
        person.full_bio,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    );
  }, [list, searchText]);

  useEffect(() => {
    if (!requestedPersonId || filteredList.length === 0) return;

    const index = filteredList.findIndex(
      (person) => String(person.id) === String(requestedPersonId)
    );

    if (index !== -1) {
      setSelectedIndex(index);
    }
  }, [filteredList, requestedPersonId]);

  useEffect(() => {
    if (selectedIndex === null) return;
    if (selectedIndex > filteredList.length - 1) {
      setSelectedIndex(filteredList.length ? 0 : null);
    }
  }, [filteredList.length, selectedIndex]);

  const selected = selectedIndex !== null ? filteredList[selectedIndex] : null;

  const handleNext = useCallback(() => {
    if (filteredList.length > 0) {
      setSelectedIndex((prev) => (prev + 1) % filteredList.length);
    }
  }, [filteredList.length]);

  const handlePrev = useCallback(() => {
    if (filteredList.length > 0) {
      setSelectedIndex((prev) => (prev - 1 + filteredList.length) % filteredList.length);
    }
  }, [filteredList.length]);

  const handleClose = useCallback(() => setSelectedIndex(null), []);

  useEffect(() => {
    const handleKey = (event) => {
      if (selectedIndex === null) return;
      if (event.key === "ArrowRight") handleNext();
      if (event.key === "ArrowLeft") handlePrev();
      if (event.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIndex, handleNext, handlePrev, handleClose]);

  return (
    <main className="container py-5">
      <h2 className="text-center text-primary fw-bold mb-4">
        Famous Personalities
      </h2>

      {searchText && (
        <div className="alert alert-light border mb-4" role="status">
          Search results for <strong>{searchText}</strong>
        </div>
      )}

      <div className="famous-filters card p-3 mb-4 shadow-sm">
        <div className="row g-3">
          <div className="col-6 col-md-3">
            <select
              className="form-select form-select-sm"
              value={filters.region}
              onChange={(event) =>
                setFilters({ ...filters, region: event.target.value })
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
              onChange={(event) =>
                setFilters({ ...filters, caste: event.target.value })
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
              onChange={(event) =>
                setFilters({ ...filters, sc_st_type: event.target.value })
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
              onChange={(event) =>
                setFilters({ ...filters, category: event.target.value })
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

      <div className="row g-3 g-md-4">
        {filteredList.length === 0 && (
          <div className="text-center text-muted">No personalities found.</div>
        )}

        {filteredList.map((person, index) => (
          <div
            key={person.id}
            className="famous-card-col col-6 col-md-4 col-lg-3 d-flex"
            onClick={() => setSelectedIndex(index)}
            style={{ cursor: "pointer" }}
          >
            <div className="card shadow-sm border-0 h-100 flex-fill">
              <img
                src={person.photo_url}
                alt={person.name}
                className="card-img-top"
                style={{
                  height: "200px",
                  objectFit: "cover",
                }}
              />
              <div className="card-body text-center p-2">
                <h6 className="fw-semibold mb-1" style={{ fontSize: "0.9rem" }}>
                  {person.name}
                </h6>
                <p className="text-muted mb-0" style={{ fontSize: "0.75rem" }}>
                  {person.category} • {person.region}
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
                  {person.short_bio}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div
          className="famous-modal modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.85)",
            zIndex: 2000,
          }}
        >
          <div
            className="famous-modal-dialog modal-dialog modal-fullscreen"
            style={{
              margin: 0,
              maxWidth: "100%",
              width: "100%",
            }}
          >
            <div className="modal-content border-0 bg-dark text-light h-100 overflow-hidden">
              <div className="famous-modal-header modal-header border-0 bg-primary text-white">
                <h5 className="modal-title text-center w-100">{selected.name}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white position-absolute end-0 me-3"
                  onClick={handleClose}
                ></button>
              </div>

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

              <div className="famous-modal-footer modal-footer border-0 justify-content-between px-4 pb-4">
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
