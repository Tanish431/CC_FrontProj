import React from "react";

export default function Navbar({ activeTab, setActiveTab }) {
  const tabs = ["Status", "Upcoming", "Today", "This Week"];

  return (
    <div className="navbar">
      {tabs.map(tab => (
        <button
          key={tab}
          className={`nav-btn ${activeTab === tab ? "active" : ""}`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
      <button className="nav-btn add-task" onClick={() => setActiveTab("NewTask")}>
        + New Task
      </button>
    </div>
  );
}
