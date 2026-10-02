import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";

// Components
import Nav from "../../components/nav";
import Footer from "../../components/footer";
import ChatbotWidget from "../../components/chatbotWidget";
import regService from "../../services/regService";

import "../../assets/student/dashboardStudent.css";
import "../../assets/shared/chatbot.css";

export default function DashStudent() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRegistrations = async () => {
      try {
        setLoading(true);
        const regs = await regService.getRegistrations();

        console.log("Fetched Registrations:", regs); // DEBUG LOG

        if (Array.isArray(regs)) {
          setRegistrations(regs);
        } else {
          setRegistrations([]);
        }
      } catch (err) {
        console.warn("Error fetching registrations:", err);
        setRegistrations([]);
      } finally {
        setLoading(false);
      }
    };

    loadRegistrations();
  }, []);

  // Open a print-friendly HTML ticket in a new window (recommended — avoids PDF blank page issues)
  const generateTicketPDF = async (reg) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(reg.attendanceCode || '', { margin: 1, width: 300 });

      const ticketHtml = `
        <div style="font-family: Poppins, system-ui, -apple-system, sans-serif; padding: 18px; max-width: 720px; margin: 10px auto; color: #111;">
          <div style="display:flex; border-radius:10px; overflow:hidden; border:1px solid #e8f0ff;">
            <div style="flex:1; padding:14px; background:#fff;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-size:18px; font-weight:800; color:#0b4da2">${reg.event?.title || 'Event'}</div>
                  <div style="font-size:12px; color:#6b7280; margin-top:4px">${reg.event?.startDateTime ? new Date(reg.event.startDateTime).toLocaleString() : (reg.event?.date ? new Date(reg.event.date).toLocaleString() : '')}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-size:11px; color:#9aa7c7">Ticket</div>
                  <div style="font-family:monospace; font-weight:800">${reg.attendanceCode}</div>
                </div>
              </div>

              <div style="display:flex; gap:12px; margin-top:10px;">
                <div style="flex:1;">
                  <div style="font-size:11px; color:#6b7280">Name</div>
                  <div style="font-weight:700">${reg.student?.name || '—'}</div>
                  <div style="font-size:11px; color:#6b7280; margin-top:6px">Email</div>
                  <div style="font-weight:600">${reg.student?.email || '—'}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-size:11px; color:#6b7280">Status</div>
                  <div style="font-weight:700">${reg.status === 'attended' ? 'Checked In' : (reg.studentVerified ? 'Awaiting Admin' : 'Issued')}</div>
                </div>
              </div>
            </div>
            <div style="width:160px; background:linear-gradient(180deg,#0b4da2,#2563eb); color:#fff; padding:12px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
              <div style="width:96px; height:96px; background:#fff; padding:8px; border-radius:8px; display:flex; align-items:center; justify-content:center;">
                <img src="${qrDataUrl}" style="width:80px; height:80px;" alt="qr" />
              </div>
              <div style="margin-top:8px; font-size:12px; text-align:center;">Present this at entry</div>
            </div>
          </div>
        </div>
      `;

      const w = window.open('', '_blank', 'width=900,height=700');
      w.document.write(`
        <html>
          <head>
            <title>Ticket - ${reg.event?.title || 'Event'}</title>
            <meta name="viewport" content="width=device-width,initial-scale=1" />
            <style>
              @media print {
                @page { size: auto; margin: 8mm; }
                body { -webkit-print-color-adjust: exact; }
              }
              body { margin:0; padding:12px; background:#fff; }
            </style>
          </head>
          <body>
            ${ticketHtml}
            <script>
              window.onload = function() { setTimeout(()=>{ window.print(); }, 200); };
            </script>
          </body>
        </html>
      `);
      w.document.close();
    } catch (err) {
      console.error('Print ticket error', err);
      alert('Failed to open print window');
    }
  };

  // Small component to render QR images client-side for tickets
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

  const links = [
    { to: "/event-details", title: "Events & Details", desc: "Browse upcoming events." },
    { to: "/reg", title: "Registration", desc: "Register for events." },
    { to: "/recommend", title: "Recommendations", desc: "Suggested events." },
    { to: "/profile-user", title: "Profile", desc: "Manage your info." },
  ];

  return (
    <>
      <Nav />

      <main className="dashboard-simple">

        {/* HERO SECTION */}
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">Discover, Join & Grow</h1>
            <p className="hero-sub">Explore upcoming events hand-picked for you.</p>
            <div className="hero-cta">
              <Link to="/event-details" className="btn-cta">Discover Events</Link>
              <Link to="/recommend" className="btn-ghost">Recommended</Link>
            </div>
          </div>
        </section>

        {/* QUICK LINKS */}
        <section className="links-grid">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="link-card">
              <div className="link-title">{l.title}</div>
              <div className="link-desc">{l.desc}</div>
            </Link>
          ))}
        </section>

        {/* EMPTY STATE */}
        {!loading && registrations.length === 0 && (
          <p className="empty-message">❗ No registrations found. Register for an event to see your ticket here.</p>
        )}

        {/* REGISTERED EVENT PASSES */}
        {registrations.length > 0 && (
          <section className="event-passes-section">
            <h2>Your Event Passes</h2>
            <p className="section-subtitle">View your registered events and attendance status</p>

            <div className="event-passes-grid">
              {registrations.map((reg) => (
                <div key={reg._id} className="pass-card">
                  
                  {/* HEADER */}
                  <div className="pass-header">
                    <h3>{reg.event?.title || "Event"}</h3>
                        <span className={`pass-status ${reg.status}`}>
                      {reg.status === "attended" ? "✅ Checked In" : 
                        reg.studentVerified ? "⏳ Awaiting Admin Confirmation" : 
                        reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                    </span>
                  </div>

                  {/* BODY */}
                  <div className="pass-body">
                    <p className="pass-date">
                      {reg.registeredAt
                        ? new Date(reg.registeredAt).toLocaleDateString()
                        : "Date not available"}
                    </p>

                    {/* ATTENDANCE CODE + PDF */}
                    {(reg.status === "accepted" || reg.status === "attended") && reg.attendanceCode && (
                      <div className="ticket-card" style={{ maxWidth: 720, margin: '8px 0' }}>
                        <div className="ticket-left">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div className="ticket-title">{reg.event?.title || 'Event'}</div>
                              <div className="ticket-sub">{reg.event?.startDateTime ? new Date(reg.event.startDateTime).toLocaleString() : (reg.event?.date ? new Date(reg.event.date).toLocaleString() : '')}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 11, color: '#9aa7c7' }}>Ticket</div>
                              <div className="ticket-code">{reg.attendanceCode}</div>
                            </div>
                          </div>

                          <div className="ticket-meta">
                            <div className="col">
                              <div style={{ fontSize: 11, color: '#6b7280' }}>Name</div>
                              <div style={{ fontWeight: 700 }}>{reg.student?.name || '—'}</div>
                              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>Email</div>
                              <div style={{ fontWeight: 600 }}>{reg.student?.email || '—'}</div>
                            </div>

                            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                              {reg.status === 'attended' ? (
                                <div style={{ color: '#059669', fontWeight: 700 }}>✅ Checked In</div>
                              ) : reg.studentVerified ? (
                                <div style={{ color: '#f59e0b', fontWeight: 700 }}>⏳ Awaiting Admin</div>
                              ) : (
                                <div style={{ color: '#2563eb', fontWeight: 700 }}>🎟️ Issued</div>
                              )}

                              <div className="ticket-actions">
                                <button className="btn-download-ticket" onClick={() => generateTicketPDF(reg)}>Download</button>
                                {reg.status !== 'attended' && (
                                  <button className="btn-verify-attendance" onClick={async () => {
                                    try {
                                      const code = reg.attendanceCode;
                                      const res = await regService.verifyAttendanceCode(code);
                                      if (res && res.registration) {
                                        setRegistrations((prev) => prev.map((r) => (r._id === res.registration._id ? res.registration : r)));
                                        alert('✅ Code accepted. Awaiting admin confirmation.');
                                      } else {
                                        alert('❌ Verification failed.');
                                      }
                                    } catch (err) {
                                      console.error(err);
                                      alert(err?.response?.data?.message || 'Verification failed');
                                    }
                                  }}>Verify</button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="ticket-right">
                          <div className="ticket-qr-wrap">
                            <TicketQR value={reg.attendanceCode} size={80} />
                          </div>
                          <div className="ticket-note">Present this at entry</div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      <Footer />
      <ChatbotWidget />
    </>
  );
}
