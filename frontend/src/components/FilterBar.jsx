import React from 'react';
import { Search } from 'lucide-react';

const PRIORITIES = ['All', 'Low', 'Medium', 'High'];

export default function FilterBar({
  selectedPriority,
  onSelectPriority,
  searchQuery,
  onSearchChange
}) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span className="filter-label">Priority:</span>
        <div className="priority-filters">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              className={`filter-btn ${selectedPriority === p ? 'active' : ''}`}
              onClick={() => onSelectPriority(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="search-box">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
