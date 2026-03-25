import React from "react";

export default function AdminUsersSection({
  users,
  selectedIds,
  selectAll,
  currentUser,
  onToggleSelectAll,
  onToggleSelect,
  onBulkDelete,
  onRoleChange,
  onDelete,
}) {
  return (
    <div className="card shadow border-0 mb-7">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Users</h5>
        {currentUser.role === "main_admin" && selectedIds.length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={onBulkDelete}>
            Delete Selected ({selectedIds.length})
          </button>
        )}
      </div>
      <div className="table-responsive">
        <table className="table table-hover table-nowrap">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                />
              </th>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center text-muted py-4">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(user.id)}
                      onChange={(e) =>
                        onToggleSelect(user.id, e.target.checked)
                      }
                    />
                  </td>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={user.role}
                      className="form-select form-select-sm"
                      onChange={(e) => onRoleChange(user.id, e.target.value)}
                      disabled={currentUser.role !== "main_admin"}
                    >
                      <option value="user">User</option>
                      <option value="moderate_admin">Moderate Admin</option>
                      <option value="main_admin">Main Admin</option>
                    </select>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="text-end">
                    {currentUser.role === "main_admin" && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => onDelete(user.id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
