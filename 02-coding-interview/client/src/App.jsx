import { useEffect, useState, useRef } from 'react';
import { socket } from './socket';
import CodeEditor from './components/CodeEditor';
import OutputPanel from './components/OutputPanel';
import ChatPanel from './components/ChatPanel';
import VideoChat from './components/VideoChat';
import LandingPage from './components/LandingPage';
import axios from 'axios';
import confetti from 'canvas-confetti';

function App() {
  // Code Samples
  const SAMPLE_CODE = {
    python: `def factorial(n):
    if n == 0:
        return 1
    else:
        return n * factorial(n-1)

print(factorial(5))`,
    javascript: `function factorial(n) {
  if (n === 0) return 1;
  return n * factorial(n - 1);
}

console.log(factorial(5));`
  };

  const [code, setCode] = useState(SAMPLE_CODE.python);
  const [language, setLanguage] = useState('python');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [roomId, setRoomId] = useState(null); // Null initially

  // Layout state
  const [layout, setLayout] = useState('horizontal'); // 'horizontal' or 'vertical'
  const [terminalSize, setTerminalSize] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState(''); // Initialize empty
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState('');

  // Theme state
  const [theme, setTheme] = useState('dark'); // 'dark' or 'light'

  // Menu states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  // Flag to track if we have actively joined the room to prevent duplicate listeners
  const [isJoined, setIsJoined] = useState(false);

  // Pyodide State
  const [pyodide, setPyodide] = useState(null);
  const [isPyodideLoading, setIsPyodideLoading] = useState(true);

  // Load Pyodide on mount
  useEffect(() => {
    const loadPyodideAsync = async () => {
      try {
        if (window.loadPyodide) {
          const py = await window.loadPyodide();
          // Load default packages or just ready up
          setPyodide(py);
        } else {
          // Retry or wait if script hasn't loaded (simulated simplistic retry)
          setTimeout(async () => {
            if (window.loadPyodide) {
              const py = await window.loadPyodide();
              setPyodide(py);
            }
          }, 1000);
        }
      } catch (err) {
        console.error("Failed to load Pyodide:", err);
      } finally {
        setIsPyodideLoading(false);
      }
    };
    loadPyodideAsync();
  }, []);

  // Check storage only to determine if we show modal? 
  // User requested "Don't autofill". So we ALWAYS show modal if username is empty.
  useEffect(() => {
    // If no username (which is default now), show modal.
    if (!username) {
      setShowNameModal(true);
    }
  }, [username]);

  const saveName = (e) => {
    e.preventDefault();
    if (tempName.trim()) {
      const name = tempName.trim();
      setUsername(name);
      // localStorage.setItem('codeStream_username', name); // Remove persistence as requested? 
      // "don't autofill" implies don't read. Write is okay but if we don't read, write is useless for autofill.
      // Let's NOT write to storage if they want to avoid autofill behavior entirely.
      setShowNameModal(false);
    }
  };

  const leaveRoom = () => {
    if (confirm("Are you sure you want to leave the room?")) {
      window.location.href = '/';
    }
  };

  const isChatOpenRef = useRef(isChatOpen);
  useEffect(() => { isChatOpenRef.current = isChatOpen; }, [isChatOpen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('room');

    // Defer join until we have a username
    if (id) {
      setRoomId(id);

      if (username && !isJoined) {
        socket.emit('join-room', { roomId: id, name: username });
        setIsJoined(true);

        // Listeners
        socket.on('code-update', (newCode) => {
          setCode(newCode);
        });

        socket.on('chat-message', (message) => {
          setMessages((prev) => [...prev, message]);
          if (!isChatOpenRef.current) {
            setUnreadCount(prev => prev + 1);
            setToastMessage(message);
            setTimeout(() => setToastMessage(null), 3000);
          }
        });
      }
    }

    return () => {
      // Cleanup listeners? Only if we unmount.
      // Note: active listeners might duplicate if username changes? 
      // isJoined prevents re-joining.
    };
  }, [username, isJoined]); // Re-run when username is set


  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      let newSize;
      if (layout === 'horizontal') {
        const percentage = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
        newSize = Math.min(Math.max(percentage, 20), 80);
      } else {
        const percentage = ((window.innerHeight - e.clientY) / window.innerHeight) * 100;
        newSize = Math.min(Math.max(percentage, 20), 80);
      }
      setTerminalSize(newSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = layout === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, layout]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit('code-update', { roomId, code: newCode });
  };

  const handleSendMessage = (message) => {
    const msgData = { roomId, message, sender: username };
    socket.emit('chat-message', msgData);
  };

  const toggleChat = () => {
    if (!isChatOpen) {
      setUnreadCount(0);
      setToastMessage(null);
    }
    setIsChatOpen(prev => !prev);
  };

  const toggleLayout = () => {
    setLayout(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
    setTerminalSize(50);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const startDragging = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const runCode = async () => {
    setIsLoading(true);
    setOutput('');

    try {
      let result = '';
      const captureLog = (msg) => { result += msg + '\n'; };

      if (language === 'python') {
        if (!pyodide) {
          setOutput('Error: Python runtime (Pyodide) is not loaded yet. Please wait...');
          setIsLoading(false);
          return;
        }
        // Redirect stdout
        pyodide.setStdout({ batched: (msg) => captureLog(msg) });
        pyodide.setStderr({ batched: (msg) => captureLog(msg) }); // simplified

        await pyodide.runPythonAsync(code);
        setOutput(result);

        // Confetti if no error (heuristic)
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

      } else if (language === 'javascript') {
        // Safe(r) Browser Execution for JS
        // We capture console.log by overriding it temporarily
        const originalLog = console.log;
        const logs = [];
        console.log = (...args) => {
          logs.push(args.map(a => String(a)).join(' '));
          originalLog(...args); // Optional: keep logging to real console
        };

        try {
          // Wrap in scope
          // Note: 'eval' in global scope or new Function
          // new Function is slightly cleaner scope-wise
          const runUserCode = new Function(code);
          runUserCode();
          setOutput(logs.join('\n') || 'Code executed successfully (no output)');

          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

        } catch (err) {
          setOutput('Error:\n' + err.toString());
        } finally {
          console.log = originalLog; // Restore
        }
      } else {
        setOutput(`Execution for ${language} is not supported in the browser yet.\nOnly Python and JavaScript are supported in this WASM mode.`);
      }

    } catch (error) {
      console.error(error);
      // Pyodide errors
      const msg = error.message;
      setOutput('Execution Error:\n' + msg);
    } finally {
      setIsLoading(false);
    }
  };

  // RENDER: Name Modal if needed (and we are in a room)
  if (roomId && showNameModal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <form onSubmit={saveName} className="bg-gray-900 border border-gray-700 p-8 rounded-2xl shadow-2xl w-full max-w-md flex flex-col gap-6">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Welcome!
          </h2>
          <p className="text-gray-400">Please enter your name to join the session.</p>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Your Name</label>
            <input
              autoFocus
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full bg-black/50 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!tempName.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform transform active:scale-95 disabled:opacity-50 disabled:transform-none"
          >
            Enter Room
          </button>
        </form>
      </div>
    );
  }

  if (!roomId) return <LandingPage />;

  const getThemeColors = () => {
    return theme === 'dark'
      ? { bg: 'bg-gray-950', text: 'text-white', header: 'bg-gray-900', border: 'border-gray-800', panel: 'bg-gray-900', chatBorder: 'border-gray-800' }
      : { bg: 'bg-gray-50', text: 'text-gray-900', header: 'bg-white', border: 'border-gray-200', panel: 'bg-white', chatBorder: 'border-gray-200' };
  };

  const colors = getThemeColors();

  return (
    <div className={`h-screen w-screen ${colors.bg} ${colors.text} flex flex-col p-4 gap-4 overflow-hidden transition-colors duration-300 relative`}>

      <header className={`flex items-center justify-between ${colors.header} p-4 rounded-xl border ${colors.border} shadow-lg shrink-0 transition-colors duration-300 relative z-50`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-lg shadow-lg shadow-cyan-500/20">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-500 to-gray-400 bg-clip-text text-transparent tracking-tight leading-none">
              CodeStream
            </h1>
          </div>
          <span className={`text-sm ml-2 font-mono px-2 py-1 rounded border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-600'}`}>Room: {roomId}</span>


        </div>

        <div className="flex items-center gap-3">
          {/* Participants Toggle */}
          <div className="relative">
            <button
              onClick={() => { setIsParticipantsOpen(!isParticipantsOpen); setIsSettingsOpen(false); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${isParticipantsOpen ? 'bg-blue-600 border-blue-600 text-white' : (theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700')}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              <span className="hidden sm:inline">Team</span>
            </button>

            {isParticipantsOpen && (
              <div className={`absolute top-full right-0 mt-2 w-64 ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-2xl p-3 z-50`}>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Participants</div>
                <VideoChat socket={socket} roomId={roomId} initialName={username} />
              </div>
            )}
          </div>

          {/* Chat Toggle */}
          <button
            onClick={toggleChat}
            className={`border px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2 relative ${isChatOpen ? 'bg-blue-600 border-blue-600 text-white' : (theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300')}`}
            title="Chat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            <span className="hidden sm:inline">Chat</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] flex items-center justify-center text-white border-2 border-gray-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Settings Dropdown */}
          <div className="relative">
            <button
              onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsParticipantsOpen(false); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${isSettingsOpen ? 'bg-gray-700 border-gray-600 text-white' : (theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700')}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </button>

            {isSettingsOpen && (
              <div className={`absolute top-full right-0 mt-2 w-48 ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl shadow-2xl p-1 z-50 flex flex-col`}>
                <button onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-white/5 rounded-lg transition-colors">
                  {theme === 'dark' ? (
                    <><svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> Light Mode</>
                  ) : (
                    <><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg> Dark Mode</>
                  )}
                </button>
                <button onClick={toggleLayout} className="flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-white/5 rounded-lg transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                  {layout === 'horizontal' ? 'Vertical Layout' : 'Horizontal Layout'}
                </button>
                <button onClick={copyLink} className="flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-white/5 rounded-lg transition-colors">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                  Share Link
                </button>
                <div className="h-[1px] bg-gray-700/50 my-1"></div>
                <button onClick={leaveRoom} className="flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-white/5 rounded-lg transition-colors text-red-400 hover:text-red-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                  Leave Room
                </button>
              </div>
            )}
          </div>

          <div className="h-6 w-[1px] bg-gray-700/50 mx-1"></div>

          <select
            value={language}
            onChange={(e) => {
              const newLang = e.target.value;
              setLanguage(newLang);
              // Update code to sample if it exists (simple behavior for now)
              if (SAMPLE_CODE[newLang]) {
                setCode(SAMPLE_CODE[newLang]);
                socket.emit('code-update', { roomId, code: SAMPLE_CODE[newLang] });
              }
            }}
            className={`border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'}`}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            {/* Disabled for WASM mode 
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
            <option value="go">Go</option>
            */}
          </select>
          <button
            onClick={runCode}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-1.5 rounded-lg font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {isLoading ? 'Running...' : 'Run'}
          </button>
        </div>
      </header>

      {/* Main Container + Sidebar Layout */}
      <div className={`flex-1 flex min-h-0 ${isChatOpen ? 'gap-4' : 'gap-0'} overflow-hidden relative transition-all duration-300`}>

        <main className={`flex-1 flex min-h-0 gap-0 transition-all duration-300 ${layout === 'horizontal' ? 'flex-row' : 'flex-col'}`}>
          <section
            className="flex flex-col gap-2 relative min-w-0 min-h-0 transition-all"
            style={{
              width: layout === 'horizontal' ? `${100 - terminalSize}%` : '100%',
              height: layout === 'horizontal' ? '100%' : `${100 - terminalSize}%`,
              paddingRight: layout === 'horizontal' ? '4px' : '0',
              paddingBottom: layout === 'vertical' ? '4px' : '0'
            }}
          >
            <div className="text-gray-400 text-sm font-medium pl-1">Editor</div>
            <div className="flex-1 min-h-0 shadow-xl rounded-lg overflow-hidden">
              <CodeEditor
                code={code}
                onChange={handleCodeChange}
                language={language}
              />
            </div>
          </section>

          {/* Resizer Handle */}
          <div
            onMouseDown={startDragging}
            className={`${layout === 'horizontal' ? 'w-2 cursor-col-resize hover:bg-blue-500/50' : 'h-2 cursor-row-resize hover:bg-blue-500/50'} ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'} transition-colors shrink-0 z-10 flex items-center justify-center`}
          >
            <div className={`${layout === 'horizontal' ? 'w-[1px] h-8' : 'h-[1px] w-8'} bg-gray-400 opacity-50`}></div>
          </div>

          <section
            className="flex flex-col gap-2 min-w-0 min-h-0 transition-all"
            style={{
              width: layout === 'horizontal' ? `${terminalSize}%` : '100%',
              height: layout === 'horizontal' ? '100%' : `${terminalSize}%`,
              paddingLeft: layout === 'horizontal' ? '4px' : '0',
              paddingTop: layout === 'vertical' ? '4px' : '0'
            }}
          >
            <div className="text-gray-400 text-sm font-medium pl-1">Terminal</div>
            <div className="flex-1 min-h-0 shadow-xl rounded-lg overflow-hidden">
              <OutputPanel output={output} isLoading={isLoading} />
            </div>
          </section>
        </main>

        {/* Chat Sidebar */}
        <div className={`${isChatOpen ? 'w-80 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-20'} flex flex-col gap-2 min-w-0 overflow-hidden transition-all duration-300 ease-in-out`}>
          <div className="text-gray-400 text-sm font-medium pl-1 whitespace-nowrap">Chat</div>
          <div className={`flex-1 min-h-0 shadow-xl rounded-lg overflow-hidden border ${colors.chatBorder}`}>
            <ChatPanel messages={messages} onSendMessage={handleSendMessage} username={username} />
          </div>
        </div>

      </div>

      {/* Toast Notification */}
      {toastMessage && !isChatOpen && (
        <div className="absolute bottom-20 right-20 z-50 bg-blue-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-xs">{toastMessage.sender.substring(0, 2)}</div>
          <div className="flex flex-col">
            <span className="text-xs font-bold opacity-75">New Message</span>
            <span className="text-sm max-w-[200px] truncate">{toastMessage.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
