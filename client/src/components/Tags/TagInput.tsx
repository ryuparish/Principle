import React, { useState, useRef, useEffect } from 'react';
import { useTagStore } from '../../store/tagStore';
import { useConceptMapStore } from '../../store/conceptMapStore';
import './TagInput.css';

interface TagInputProps {
  nodeId: string;
  currentTags: string[];
  onTagsChange?: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  nodeId,
  currentTags,
  onTagsChange,
  placeholder = 'Add tags...',
  className = '',
  autoFocus = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { getTagSuggestions, addTagToNode, removeTagFromNode, tags } = useTagStore();
  const { updateNode } = useConceptMapStore();

  // Auto-focus input when component mounts (if autoFocus is true)
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Get suggestions excluding already added tags
  const suggestions = getTagSuggestions(inputValue).filter(
    (tagName) => !currentTags.includes(tagName)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsDropdownOpen(value.length > 0 || suggestions.length > 0);
    setSelectedIndex(0);
  };

  const addTag = async (tagName: string) => {
    const normalizedTag = tagName.trim().toLowerCase();
    if (!normalizedTag || currentTags.includes(normalizedTag)) return;

    const newTags = [...currentTags, normalizedTag];

    // Update local state first for immediate UI feedback
    if (onTagsChange) onTagsChange(newTags);

    // Update tag store
    addTagToNode(nodeId, normalizedTag);

    // Persist to backend
    await updateNode(nodeId, { tags: newTags });

    // Reset input
    setInputValue('');
    setIsDropdownOpen(false);
    setSelectedIndex(0);
    inputRef.current?.focus();
  };

  const removeTag = async (tagName: string) => {
    const newTags = currentTags.filter((t) => t !== tagName);

    // Update local state first
    if (onTagsChange) onTagsChange(newTags);

    // Update tag store
    removeTagFromNode(nodeId, tagName);

    // Persist to backend
    await updateNode(nodeId, { tags: newTags });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isDropdownOpen && suggestions.length > 0 && selectedIndex < suggestions.length) {
        addTag(suggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue.trim());
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsDropdownOpen(true);
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsDropdownOpen(false);
      setInputValue('');
    } else if (e.key === 'Backspace' && inputValue === '' && currentTags.length > 0) {
      e.preventDefault();
      removeTag(currentTags[currentTags.length - 1]);
    }
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`tag-input-container ${className}`}>
      <div className="tag-input-wrapper">
        <div className="tag-input-tags">
          {currentTags.map((tag, index) => (
            <div key={`${tag}-${index}`} className="tag-input-chip">
              <span className="tag-input-chip-text">{tag}</span>
              <button
                type="button"
                className="tag-input-chip-remove"
                onClick={() => removeTag(tag)}
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <input
          ref={inputRef}
          type="text"
          className="tag-input-field"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsDropdownOpen(suggestions.length > 0)}
          placeholder={currentTags.length === 0 ? placeholder : ''}
          aria-label="Tag input"
          aria-autocomplete="list"
          aria-expanded={isDropdownOpen}
          aria-controls="tag-suggestions"
        />
      </div>
      {isDropdownOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="tag-input-dropdown"
          id="tag-suggestions"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => {
            const tagData = tags.get(suggestion);
            const count = tagData?.count || 0;

            return (
              <div
                key={suggestion}
                data-index={index}
                className={`tag-input-suggestion ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => addTag(suggestion)}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <span className="tag-input-suggestion-name">{suggestion}</span>
                <span className="tag-input-suggestion-count">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
