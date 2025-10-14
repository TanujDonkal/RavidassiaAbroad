import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

export default function ViewMatrimonialProfile() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/matrimonial/my")
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-danger text-center mt-5">{error}</p>;
  if (!data) return <p className="text-center mt-5">Loading...</p>;

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center">My Matrimonial Profile</h2>
      <div className="card shadow p-4 mx-auto" style={{ maxWidth: 800 }}>
        <img
          src={data.photo_url || "/template/img/no-photo.png"}
          alt="profile"
          className="rounded-circle mx-auto d-block mb-3"
          width="120"
          height="120"
        />
        <table className="table table-bordered">
          <tbody>
            {Object.entries(data).map(([k, v]) => (
              <tr key={k}>
                <th className="text-capitalize">{k.replaceAll("_", " ")}</th>
                <td>{v || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
