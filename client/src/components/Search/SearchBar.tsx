import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useConceptMapStore } from '../../store/conceptMapStore';
import { ConceptMapNode } from '../../types';
import './SearchBar.css';

interface SearchBarProps {
  onSelectNode: (nodeId: string) => void;
  onClose: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSelectNode, onClose }) => {
  const { nodes } = useConceptMapStore();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce the query (only triggers on user typing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Compute results from debounced query + nodes (instant updates when nodes change)
  const results = useMemo(() => {
    if (debouncedQuery.length < 2) return [];

    // Client-side search across title, content, and tags
    const filtered = nodes.filter((node) => {
      const titleMatch = node.title.toLowerCase().includes(debouncedQuery.toLowerCase());
      const contentMatch = JSON.stringify(node.content)
        .toLowerCase()
        .includes(debouncedQuery.toLowerCase());
      const tagMatch = node.tags.some((tag) =>
        tag.toLowerCase().includes(debouncedQuery.toLowerCase())
      );
      return titleMatch || contentMatch || tagMatch;
    });
    return filtered.slice(0, 10); // Limit to 10 results
  }, [debouncedQuery, nodes]);

  // Reset selection when debounced query changes (user typed new search)
  useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedQuery]);

  // Clamp selection when results length changes (preserve selection if possible)
  useEffect(() => {
    setSelectedIndex((prev) => Math.min(prev, Math.max(0, results.length - 1)));
  }, [results.length]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            onSelectNode(results[selectedIndex].id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [results, selectedIndex, onSelectNode, onClose]
  );

  const handleSelectResult = (nodeId: string) => {
    onSelectNode(nodeId);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-bar-container')) {
        onClose();
      }
    };

    // Delay adding listener to avoid immediate close
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="search-bar-container" role="dialog" aria-label="Search nodes">
      <div className="search-bar">
        <svg
          className="search-icon"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 17A8 8 0 119 1a8 8 0 010 16zM19 19l-4.35-4.35"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search nodes..."
          className="search-input"
          aria-label="Search nodes"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-activedescendant={results[selectedIndex]?.id}
        />
        {query && (
          <button
            className="search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            tabIndex={-1}
          >
            ×
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div
          className="search-results"
          id="search-results"
          role="listbox"
          aria-label="Search results"
        >
          {results.map((node, index) => (
            <div
              key={node.id}
              id={node.id}
              className={`search-result-item ${
                index === selectedIndex ? 'selected' : ''
              }`}
              onClick={() => handleSelectResult(node.id)}
              onMouseEnter={() => setSelectedIndex(index)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="result-title">{node.title}</div>
              {node.tags.length > 0 && (
                <div className="result-tags">
                  {node.tags.map((tag) => (
                    <span key={tag} className="result-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && (
        <div className="search-no-results">No nodes found</div>
      )}

      <div className="search-shortcuts">
        <span>
          <kbd>↑</kbd><kbd>↓</kbd> Navigate
        </span>
        <span>
          <kbd>Enter</kbd> Select
        </span>
        <span>
          <kbd>Esc</kbd> Close
        </span>
      </div>
    </div>
  );
};

export default SearchBar;
