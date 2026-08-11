import { useRef, useEffect, useCallback } from 'react';

const LANGUAGE_LABELS = {
  js: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  tsx: 'TSX',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  md: 'Markdown',
  py: 'Python',
  sh: 'Shell',
  default: 'Plain Text',
};

const Editor = ({
  value = '',
  onChange,
  language = 'js',
  fileName = '',
  readOnly = false,
  placeholder = 'Start typing…',
  lineNumbers = true,
}) => {
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const syncScroll = useCallback(() => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  useEffect(() => {
    syncScroll();
  }, [value, syncScroll]);

  const handleKeyDown = useCallback(
    (event) => {
      if (readOnly) return;

      const { key, ctrlKey, metaKey, shiftKey } = event;
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Insert tab instead of losing focus
      if (key === 'Tab') {
        event.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const indent = '  ';
        const nextValue =
          value.slice(0, start) + indent + value.slice(end);
        onChange?.(nextValue);
        requestAnimationFrame(() => {
          textarea.selectionStart = start + indent.length;
          textarea.selectionEnd = start + indent.length;
        });
        return;
      }

      // Auto-indent new lines
      if (key === 'Enter') {
        const start = textarea.selectionStart;
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const currentLine = value.slice(lineStart, start);
        const match = currentLine.match(/^\s*/);
        const indent = match ? match[0] : '';
        event.preventDefault();
        const nextValue =
          value.slice(0, start) + '\n' + indent + value.slice(textarea.selectionEnd);
        onChange?.(nextValue);
        requestAnimationFrame(() => {
          const pos = start + 1 + indent.length;
          textarea.selectionStart = pos;
          textarea.selectionEnd = pos;
        });
        return;
      }

      // Undo / redo via Ctrl+Z / Ctrl+Shift+Z
      if ((ctrlKey || metaKey) && key.toLowerCase() === 'z') {
        event.preventDefault();
        if (shiftKey) {
          document.execCommand('redo');
        } else {
          document.execCommand('undo');
        }
        return;
      }
    },
    [value, onChange, readOnly]
  );

  const lineCount = value.split('\n').length;
  const lineNumbersMarkup = Array.from(
    { length: lineCount },
    (_, i) => i + 1
  ).join('\n');

  const displayName =
    fileName || `${language.toUpperCase()} File`;

  return (
    <div className="code-editor">
      <div className="code-editor__header">
        <span className="code-editor__file">{displayName}</span>
        <span className="code-editor__lang">
          {LANGUAGE_LABELS[language] || LANGUAGE_LABELS.default}
        </span>
      </div>
      <div className="code-editor__body">
        {lineNumbers && (
          <div
            ref={lineNumbersRef}
            className="code-editor__gutter"
            aria-hidden="true"
          >
            <pre>{lineNumbersMarkup}</pre>
          </div>
        )}
        <textarea
          ref={textareaRef}
          className="code-editor__textarea"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          readOnly={readOnly}
          placeholder={placeholder}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      </div>
    </div>
  );
};

export default Editor;
