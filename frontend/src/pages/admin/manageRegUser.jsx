// src/pages/admin/manageRegUser.jsx
import React, { useEffect, useState } from "react";
import QRCode from 'qrcode';
import NavAdmin from "../../components/navAdmin";
import Footer from "../../components/footer";
import regService from "../../services/regService";
import "../../assets/admin/manageRegUser.css";

// CSV export utility
const exportToCSV = (data, filename = "registrations.csv") => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","), // header row
    ...data.map(row =>
      headers.map(field => `"${row[field] ?? ""}"`).join(",")
    )
  ];
  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  link.click();
};

export default function ManageRegUser() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [verifyingId, setVerifyingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedTickets, setExpandedTickets] = useState({});

  useEffect(() => {
    fetchRegs();
  }, []);

  // Small component to render QR images client-side for tickets (admin preview)
  const TicketQR = ({ value, size = 110 }) => {
    const [src, setSrc] = useState(null);
    useEffect(() => {
      let mounted = true;
      if (!value) return;
      QRCode.toDataURL(value, { margin: 1, width: size }).then((url) => {
        if (mounted) setSrc(url);
      }).catch(() => {});
      return () => { mounted = false; };
    }, [value, size]);

    if (!src) return <div style={{ width: size, height: size, background: '#fff', borderRadius: 8 }} />;
    return <img src={src} alt="ticket-qr" style={{ width: size, height: size, borderRadius: 8 }} />;
  };

  const showMessage = (txt, type = "success") => {
    setMessage(txt);
    setMessageType(type);
    clearTimeout(window.__manageRegMsgTimeout);
    window.__manageRegMsgTimeout = setTimeout(() => setMessage(""), 4000);
  };

  const fetchRegs = async () => {
    setLoading(true);
    try {
      const data = await regService.getRegistrations();
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      showMessage("Failed to load registrations", "error");
    } finally {
      setLoading(false);
    }
  };

  // Admins are not allowed to mark 'attended' directly.
  // Student must verify themselves via their dashboard. Admin UI only supports accept/reject.

  const handleStatusUpdate = async (reg, status) => {
    try {
      // If rejecting, prompt for a reason
      let extra = {};
      if (status === 'rejected') {
        const reason = window.prompt('Enter rejection reason:');
        if (!reason || reason.trim() === '') {
          showMessage('Rejection reason required', 'error');
          return;
        }
        extra.reason = reason;
      }

      const res = await regService.updateRegistrationStatus(reg._id, status, extra);

      // If server returned updated registration, replace it in state
      if (res && res.registration) {
        setRegistrations((prev) => prev.map((r) => (r._id === res.registration._id ? res.registration : r)));
      } else {
        setRegistrations((prev) => prev.map((r) => (r._id === reg._id ? { ...r, status } : r)));
      }

      showMessage(`✅ Status updated to "${status}"`, "success");
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || 'Failed to update status';
      showMessage(msg, "error");
    }
  };

  const handleDelete = async (reg) => {
    try {
      await regService.deleteRegistration(reg._id);
      setRegistrations((prev) => prev.filter((r) => r._id !== reg._id));
      showMessage("✅ Registration deleted", "success");
    } catch (err) {
      console.error(err);
      showMessage("Failed to delete registration", "error");
    }
  };

  const getStatusLabel = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "Pending");

  // Filter registrations by status
  const filteredRegs =
    filterStatus === "all"
      ? registrations
      : registrations.filter((r) => r.status === filterStatus);

  // Prepare data for CSV export
  const exportData = filteredRegs.map((r) => ({
    Student: r.student?.name,
    Email: r.student?.email,
    Event: r.event?.title,
    Date: r.event?.date ? new Date(r.event.date).toLocaleDateString() : "",
    Status: r.status,
    AttendanceCode: r.attendanceCode,
  }));

  return (
    <>
      <NavAdmin />
      <div className="manage-users-container full-width">
        <div className="manage-header">
          <h2>📋 Manage Event Registrations</h2>
          <p>Approve, reject, cancel, delete, or verify attendance</p>

          <div className="header-actions">
            <button onClick={fetchRegs} className="btn-refresh">🔄 Refresh</button>

            {/* UPDATED FILTER (added "Attended") */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="attended">Attended</option>
            </select>

            <button onClick={() => exportToCSV(exportData)} className="btn-download">
              📥 Download CSV
            </button>
          </div>
        </div>

        {message && (
          <div className={`message message-${messageType === "error" ? "error" : "success"}`}>
            {message}
          </div>
        )}

        {loading ? (
          <div>Loading registrations...</div>
        ) : (
          <table className="registrations-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Email</th>
                <th>Event</th>
                <th>Registered</th>
                <th>Status</th>
                <th>Attendance Code</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRegs.length === 0 ? (
                <tr>
                  <td colSpan="8">No registrations found</td>
                </tr>
              ) : (
                filteredRegs.map((r, i) => (
                  <React.Fragment key={r._id}>
                    <tr className={`status-row status-${r.status}`}>
                      <td>{i + 1}</td>
                      <td>{r.student?.name || "—"}</td>
                      <td>{r.student?.email || "—"}</td>
                      <td>{r.event?.title || "—"}</td>
                      <td>{r.registeredAt ? new Date(r.registeredAt).toLocaleDateString() : "—"}</td>
                      <td><span className="status-badge">{getStatusLabel(r.status)}</span></td>
                      <td>{r.attendanceCode || "—"}</td>

                      <td className="actions-cell">
                        {r.status === "pending" && (
                          <>
                            <button className="btn-accept" onClick={() => handleStatusUpdate(r, "accepted")}>Accept</button>
                            <button className="btn-reject" onClick={() => handleStatusUpdate(r, "rejected")}>Reject</button>
                          </>
                        )}

                        {r.status === "accepted" && (
                          <>
                            {r.studentVerified ? (
                              <button className="btn-attendance" onClick={() => handleStatusUpdate(r, "attended") }>
                                Mark as Attended
                              </button>
                            ) : (
                              <span className="awaiting-verification">Awaiting student verification</span>
                            )}

                            <button className="btn-view-ticket" onClick={() => setExpandedTickets(prev => ({ ...prev, [r._id]: !prev[r._id] }))}>
                              {expandedTickets[r._id] ? 'Hide Ticket' : 'View Ticket'}
                            </button>
                          </>
                        )}

                        <button className="btn-delete" onClick={() => handleDelete(r)}>Delete</button>
                      </td>
                    </tr>

                    {expandedTickets[r._id] && (
                      <tr className="ticket-row">
                        <td colSpan="8">
                          <div style={{ maxWidth: 900, margin: '8px auto' }}>
                            <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1px solid #eef6ff' }}>
                                  <div className="ticket-left">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <div>
                                        <div className="ticket-title">{r.event?.title}</div>
                                        <div className="ticket-sub">{r.event?.date ? new Date(r.event.date).toLocaleString() : ''}</div>
                                      </div>
                                      <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: 11, color: '#9aa7c7' }}>Ticket</div>
                                        <div className="ticket-code">{r.attendanceCode}</div>
                                      </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 18, marginTop: 10 }}>
                                      <div>
                                        <div style={{ fontSize: 11, color: '#6b7280' }}>Name</div>
                                        <div style={{ fontWeight: 700 }}>{r.student?.name}</div>
                                        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>Email</div>
                                        <div style={{ fontWeight: 600 }}>{r.student?.email}</div>
                                      </div>

                                      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                        <div style={{ fontSize: 11, color: '#6b7280' }}>Status</div>
                                        <div style={{ fontWeight: 700 }}>{r.studentVerified ? 'Awaiting Admin' : r.status}</div>
                                        <div style={{ marginTop: 8 }}>
                                          {r.studentVerified && r.status === 'accepted' && (
                                            <button className="btn-attendance" onClick={() => handleStatusUpdate(r, 'attended')}>Mark as Attended</button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="ticket-right">
                                    <div className="ticket-qr-wrap">
                                      <TicketQR value={r.attendanceCode} size={80} />
                                    </div>
                                    <div style={{ marginTop: 8, fontSize: 12 }}>Scanner Preview</div>
                                  </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      <Footer />
    </>
  );
}
