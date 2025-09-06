import { useState, useEffect } from 'react';
import './App.css';

const languages = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'hi', name: 'Hindi' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' }
];

function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [target, setTarget] = useState('es');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleTranslate = async () => {
    if (!input.trim()) {
      setOutput('Please enter text to translate.');
      return;
    }

    setLoading(true);
    setOutput('Translating...');
    
    try {
      // Using MyMemory API (free and reliable)
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=en|${target}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
        setOutput(data.responseData.translatedText);
      } else if (data.matches && data.matches.length > 0) {
        // Fallback to matches if available
        setOutput(data.matches[0].translation);
      } else {
        throw new Error('No translation received from API');
      }
    } catch (err) {
      console.error('Translation error:', err);
      setOutput(`Translation failed: ${err.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="header">
        <h1 className="title">AnyLang Translator</h1>
        <button
          className="theme-toggle"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      <div className="main-content">
        <div className="card">
          <label className="label">Enter English Text:</label>
          <textarea
            className="textarea"
            rows={6}
            placeholder="Type your English text here..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          
          <div className="select-container">
            <label className="label">Translate to:</label>
            <select
              className="select"
              value={target}
              onChange={e => setTarget(e.target.value)}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>

          <button
            className="translate-btn"
            onClick={handleTranslate}
            disabled={loading || !input}
          >
            {loading ? 'Translating...' : 'Translate'}
          </button>
        </div>

        <div className="card">
          <label className="label">Translation:</label>
          <div className="output-area">
            {output || 'Translation will appear here...'}
          </div>
        </div>
      </div>

      <div className="footer">
        <p>&copy; 2025 AnyLang Translator. Made by Soujanya Shanbhag.</p>
      </div>
    </div>
  );
}

export default App;