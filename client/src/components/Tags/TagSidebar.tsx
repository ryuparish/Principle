import React, { useState, useMemo } from 'react';
import { useTagStore } from '../../store/tagStore';
import { TagChip } from './TagChip';
import './TagSidebar.css';

interface TagSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type SortOption = 'usage' | 'name' | 'recent';

export const TagSidebar: React.FC<TagSidebarProps> = ({ isOpen, onClose }) => {
  const {
    tags,
    activeTags,
    tagMode,
    toggleTagFilter,
    clearFilters,
    setTagMode,
    deleteTag,
  } = useTagStore();

  const [sortBy, setSortBy] = useState<SortOption>('usage');
  const [searchQuery, setSearchQuery] = useState('');

  // Convert Map to array and sort
  const sortedTags = useMemo(() => {
    const tagsArray = Array.from(tags.values());

    // Filter by search query
    const filtered = searchQuery
      ? tagsArray.filter((tag) =>
          tag.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : tagsArray;

    // Sort based on selected option
    switch (sortBy) {
      case 'usage':
        return filtered.sort((a, b) => b.count - a.count);
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'recent':
        return filtered.sort(
          (a, b) =>
            new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
        );
      default:
        return filtered;
    }
  }, [tags, sortBy, searchQuery]);

  const stats = useMemo(() => {
    const totalTags = tags.size;
    const activeFilterCount = activeTags.size;
    const mostUsed = sortedTags[0];

    return {
      totalTags,
      activeFilterCount,
      mostUsed,
    };
  }, [tags, activeTags, sortedTags]);

  const handleTagClick = (tagName: string) => {
    toggleTagFilter(tagName);
  };

  const handleDeleteTag = (tagName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Delete tag "${tagName}"? This will remove it from all nodes.`)) {
      deleteTag(tagName);
    }
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  if (!isOpen) return null;

  return (
    <div className="tag-sidebar-overlay" onClick={onClose}>
      <div className="tag-sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="tag-sidebar-header">
          <h2 className="tag-sidebar-title">Tags</h2>
          <button
            className="tag-sidebar-close"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Stats */}
        <div className="tag-sidebar-stats">
          <div className="tag-stat">
            <span className="tag-stat-value">{stats.totalTags}</span>
            <span className="tag-stat-label">Total Tags</span>
          </div>
          <div className="tag-stat">
            <span className="tag-stat-value">{stats.activeFilterCount}</span>
            <span className="tag-stat-label">Active Filters</span>
          </div>
        </div>

        {/* Filter Controls */}
        {activeTags.size > 0 && (
          <div className="tag-filter-controls">
            <div className="tag-filter-mode">
              <label className="tag-filter-label">Filter Mode:</label>
              <div className="tag-filter-buttons">
                <button
                  className={`tag-filter-button ${tagMode === 'AND' ? 'active' : ''}`}
                  onClick={() => setTagMode('AND')}
                >
                  AND
                </button>
                <button
                  className={`tag-filter-button ${tagMode === 'OR' ? 'active' : ''}`}
                  onClick={() => setTagMode('OR')}
                >
                  OR
                </button>
              </div>
            </div>
            <button className="tag-clear-filters" onClick={handleClearFilters}>
              Clear Filters
            </button>
          </div>
        )}

        {/* Search */}
        <div className="tag-sidebar-search">
          <input
            type="text"
            className="tag-search-input"
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Sort Options */}
        <div className="tag-sidebar-sort">
          <label className="tag-sort-label">Sort by:</label>
          <select
            className="tag-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="usage">Usage</option>
            <option value="name">Name</option>
            <option value="recent">Recent</option>
          </select>
        </div>

        {/* Tags List */}
        <div className="tag-sidebar-list">
          {sortedTags.length === 0 ? (
            <div className="tag-sidebar-empty">
              {searchQuery ? 'No tags match your search' : 'No tags yet'}
            </div>
          ) : (
            sortedTags.map((tag) => (
              <div
                key={tag.name}
                className={`tag-sidebar-item ${activeTags.has(tag.name) ? 'active' : ''}`}
              >
                <div
                  className="tag-sidebar-item-main"
                  onClick={() => handleTagClick(tag.name)}
                >
                  <TagChip
                    tagName={tag.name}
                    color={tag.color}
                    size="md"
                    interactive={false}
                  />
                  <span className="tag-sidebar-item-count">{tag.count}</span>
                </div>
                <button
                  className="tag-sidebar-item-delete"
                  onClick={(e) => handleDeleteTag(tag.name, e)}
                  aria-label={`Delete tag ${tag.name}`}
                  title="Delete tag"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
