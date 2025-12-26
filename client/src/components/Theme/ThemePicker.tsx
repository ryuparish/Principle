import React, { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '../../store/themeStore';
import './ThemePicker.css';

export const ThemePicker: React.FC = () => {
  const { currentTheme, presetThemes, customThemes, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allThemes = [...presetThemes, ...customThemes];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleThemeSelect = (themeId: string) => {
    setTheme(themeId);
    setIsOpen(false);
  };

  return (
    <div className="theme-picker" ref={dropdownRef}>
      <button
        className="theme-picker-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select theme"
        title="Change theme"
      >
        <span className="theme-picker-icon">🎨</span>
        <span className="theme-picker-label">{currentTheme.name}</span>
        <span className="theme-picker-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="theme-picker-dropdown">
          <div className="theme-picker-section">
            <div className="theme-picker-section-title">Preset Themes</div>
            {presetThemes.map((theme) => (
              <button
                key={theme.id}
                className={`theme-picker-item ${currentTheme.id === theme.id ? 'active' : ''}`}
                onClick={() => handleThemeSelect(theme.id)}
              >
                <div
                  className="theme-picker-preview"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
                  }}
                />
                <div className="theme-picker-info">
                  <div className="theme-picker-name">{theme.name}</div>
                  {theme.description && (
                    <div className="theme-picker-description">{theme.description}</div>
                  )}
                </div>
                {currentTheme.id === theme.id && (
                  <span className="theme-picker-check">✓</span>
                )}
              </button>
            ))}
          </div>

          {customThemes.length > 0 && (
            <div className="theme-picker-section">
              <div className="theme-picker-section-title">Custom Themes</div>
              {customThemes.map((theme) => (
                <button
                  key={theme.id}
                  className={`theme-picker-item ${currentTheme.id === theme.id ? 'active' : ''}`}
                  onClick={() => handleThemeSelect(theme.id)}
                >
                  <div
                    className="theme-picker-preview"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
                    }}
                  />
                  <div className="theme-picker-info">
                    <div className="theme-picker-name">{theme.name}</div>
                    {theme.description && (
                      <div className="theme-picker-description">{theme.description}</div>
                    )}
                  </div>
                  {currentTheme.id === theme.id && (
                    <span className="theme-picker-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
