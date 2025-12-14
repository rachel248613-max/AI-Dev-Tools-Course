import React, { useState, useEffect } from 'react';

const VideoChat = ({ socket, roomId, initialName }) => {
    // Presence State (No Media)
    const [users, setUsers] = useState([]); // List of { id, name }

    useEffect(() => {
        const handleAllUsers = (existingUsers) => {
            setUsers(existingUsers);
        };

        const handleUserJoined = (newUser) => {
            setUsers(prev => {
                if (prev.find(u => u.id === newUser.id)) return prev;
                return [...prev, newUser];
            });
        };

        const handleUserLeft = (id) => {
            setUsers(prev => prev.filter(u => u.id !== id));
        };

        socket.on('all-users', handleAllUsers);
        socket.on('user-joined', handleUserJoined);
        socket.on('user-left', handleUserLeft);

        return () => {
            socket.off('all-users', handleAllUsers);
            socket.off('user-joined', handleUserJoined);
            socket.off('user-left', handleUserLeft);
        };
    }, [socket]);

    const Avatar = ({ name, isSelf }) => {
        const initial = name ? name[0].toUpperCase() : '?';
        const colorClass = isSelf ? 'border-blue-500' : 'border-green-500';

        return (
            <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors w-full">
                <div className={`w-8 h-8 rounded-full border-2 ${colorClass} bg-gray-800 flex items-center justify-center shadow-lg relative shrink-0`}>
                    <span className="text-white font-bold text-xs">{initial}</span>
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-gray-900"></div>
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-gray-200 truncate">{name} {isSelf && '(You)'}</span>
                    <span className="text-[10px] text-gray-500">Online</span>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-1 w-full max-h-[300px] overflow-y-auto custom-scrollbar">
            <Avatar name={initialName} isSelf={true} />
            {users.map((u) => (
                <Avatar key={u.id} name={u.name} isSelf={false} />
            ))}
            {users.length === 0 && (
                <div className="text-xs text-gray-500 italic px-2 py-1">Waiting for others...</div>
            )}
        </div>
    );
};

export default VideoChat;

