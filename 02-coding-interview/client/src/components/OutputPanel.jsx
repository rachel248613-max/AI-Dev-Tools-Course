import React from 'react';

export default function OutputPanel({ output, isLoading }) {
    return (
        <div className="h-full w-full bg-gray-900 rounded-lg shadow-xl overflow-hidden border border-gray-700 flex flex-col font-mono text-sm">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 font-semibold text-gray-300 flex justify-between items-center">
                <span>Console Output</span>
                <span className="text-xs text-gray-500">Read-only</span>
            </div>
            <div className="flex-1 p-4 overflow-auto text-gray-300 whitespace-pre-wrap font-mono relative">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
                        <span className="text-blue-400 animate-pulse">Running code...</span>
                    </div>
                ) : (
                    output || <span className="text-gray-600 italic">Click 'Run Code' to see the output here...</span>
                )}
            </div>
        </div>
    );
}
