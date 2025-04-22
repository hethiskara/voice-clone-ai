'use client';

import { useState } from 'react';

export default function ScriptInput() {
  const [script, setScript] = useState('');
  const maxLength = 1000;

  return (
    <div>
      <div>
        <h2>Enter Your Script</h2>
        <p>
          Write or paste the text you want to convert to speech (max {maxLength} characters)
        </p>
      </div>

      <div>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value.slice(0, maxLength))}
          placeholder="Enter your text here..."
          rows={6}
          style={{ width: '100%' }}
        />
        <div>
          {script.length}/{maxLength}
        </div>
      </div>

      <div>
        <button
          disabled={!script.trim()}
        >
          Generate Voice
        </button>
      </div>
    </div>
  );
}
