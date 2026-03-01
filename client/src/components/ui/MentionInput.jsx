import { useState, useRef } from 'react';

const getName = (m) => m.user_name || m.name || '';

export default function MentionInput({
  value, onChange, onSubmit, placeholder, members = [], className = '', autoFocus = false, disabled = false,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const inputRef = useRef(null);

  const filteredMembers = members.filter((m) =>
    getName(m).toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);

    const cursorPos = e.target.selectionStart;
    const textBefore = val.slice(0, cursorPos);
    const atIdx = textBefore.lastIndexOf('@');

    if (atIdx >= 0 && (atIdx === 0 || textBefore[atIdx - 1] === ' ')) {
      const query = textBefore.slice(atIdx + 1);
      if (!query.includes(' ') || query.length < 20) {
        setMentionStart(atIdx);
        setMentionQuery(query);
        setShowDropdown(true);
        return;
      }
    }
    setShowDropdown(false);
  };

  const selectMember = (member) => {
    const name = getName(member);
    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + mentionQuery.length + 1);
    const newVal = `${before}@${name} ${after}`;
    onChange(newVal);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !showDropdown) {
      onSubmit?.(e);
    }
    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const visible = showDropdown && filteredMembers.length > 0;

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        disabled={disabled}
      />
      <div
        className={`absolute bottom-full mb-1 left-0 w-full glass rounded-xl border border-[var(--color-border)] p-1 max-h-40 overflow-y-auto z-30 transition-all duration-200 origin-bottom ${
          visible ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {filteredMembers.map((m) => (
          <button
            key={m.user_id}
            type="button"
            onClick={() => selectMember(m)}
            className="w-full text-left text-sm px-3 py-1.5 rounded-lg hover:bg-surface-glass flex items-center gap-2"
          >
            {m.avatar_url ? (
              <img src={m.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {getName(m)?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <span>{getName(m)}</span>
            <span className="text-xs text-content-muted ml-auto">{m.role}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
