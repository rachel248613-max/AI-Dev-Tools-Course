import React, { useState } from 'react';

const LandingPage = () => {
    const [roomId, setRoomId] = useState('');
    const [createRoomName, setCreateRoomName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const createSession = (e) => {
        e.preventDefault();
        const finalRoomName = createRoomName.trim() || Math.random().toString(36).substring(2, 9);
        window.location.href = `/?room=${finalRoomName}`;
    };

    const joinSession = (e) => {
        e.preventDefault();
        if (roomId.trim()) {
            window.location.href = `/?room=${roomId.trim()}`;
        }
    };

    return (
        <div className="h-screen w-screen bg-gray-950 flex flex-col items-center justify-center text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[100px] animate-pulse animation-delay-2000"></div>
            </div>

            <div className="z-10 flex flex-col items-center gap-8 p-8 max-w-4xl w-full">
                <div className="text-center">
                    <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4 tracking-tight">
                        CodeStream
                    </h1>
                    <p className="text-xl text-gray-400">
                        Real-time collaborative coding interview platform.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-6 w-full mt-4">
                    {/* Create New */}
                    <div className="flex-1 bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl flex flex-col hover:border-blue-500/50 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-6xl">🚀</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-blue-400">New</span> Interview
                        </h3>

                        {!isCreating ? (
                            <div className="flex-1 flex flex-col justify-end">
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform transform active:scale-95"
                                >
                                    Create Room
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={createSession} className="flex-1 flex flex-col justify-end space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Room Name</label>
                                    <input
                                        type="text"
                                        autoFocus
                                        value={createRoomName}
                                        onChange={(e) => setCreateRoomName(e.target.value)}
                                        placeholder="e.g. ProjectX"
                                        className="w-full bg-black/30 border border-gray-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-2 rounded-lg text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg shadow-lg text-sm"
                                    >
                                        Go
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Join Existing */}
                    <form onSubmit={joinSession} className="flex-1 bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl flex flex-col hover:border-gray-700 transition-colors relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="text-6xl">👋</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-purple-400">Join</span> Room
                        </h3>

                        <div className="space-y-4 flex-1 flex flex-col justify-end">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Room ID / Name</label>
                                <input
                                    type="text"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    placeholder="Enter Room ID"
                                    className="w-full bg-black/30 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!roomId.trim()}
                                className="mt-6 w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl border border-gray-700 hover:border-gray-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                Join Session
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <footer className="absolute bottom-4 text-gray-600 text-sm">
                Built with React, Socket.io, and WebRTC
            </footer>
        </div>
    );
};

export default LandingPage;
