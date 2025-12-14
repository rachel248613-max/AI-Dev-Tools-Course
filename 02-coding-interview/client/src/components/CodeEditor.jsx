import React from 'react';
import Editor from '@monaco-editor/react';

export default function CodeEditor({ code, onChange, language }) {
    const handleEditorChange = (value) => {
        onChange(value);
    };

    return (
        <div className="h-full w-full bg-[#1e1e1e] rounded-lg shadow-xl overflow-hidden border border-gray-700">
            <Editor
                height="100%"
                language={language}
                value={code}
                theme="vs-dark"
                onChange={handleEditorChange}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    lineNumbers: 'on',
                    glyphMargin: false,
                    folding: false,
                    lineDecorationsWidth: 0,
                    lineNumbersMinChars: 3,
                    padding: { top: 16 }
                }}
            />
        </div>
    );
}
