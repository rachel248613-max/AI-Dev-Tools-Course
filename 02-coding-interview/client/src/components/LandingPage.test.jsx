import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LandingPage from './LandingPage';

describe('LandingPage Component', () => {
    const originalLocation = window.location;

    beforeEach(() => {
        delete window.location;
        window.location = { href: '' };
    });

    afterEach(() => {
        window.location = originalLocation;
    });

    it('renders the join room form initially', () => {
        render(<LandingPage />);
        expect(screen.getByPlaceholderText(/Enter Room ID/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Join Session/i })).toBeInTheDocument();
        // Create room button should be visible
        expect(screen.getByRole('button', { name: /Create Room/i })).toBeInTheDocument();
    });

    it('allows typing in the join room input', () => {
        render(<LandingPage />);
        const input = screen.getByPlaceholderText(/Enter Room ID/i);
        fireEvent.change(input, { target: { value: 'test-room' } });
        expect(input.value).toBe('test-room');
    });

    it('updates window.location when joining a room', () => {
        render(<LandingPage />);
        const input = screen.getByPlaceholderText(/Enter Room ID/i);
        const joinButton = screen.getByRole('button', { name: /Join Session/i });

        fireEvent.change(input, { target: { value: 'room-123' } });
        fireEvent.click(joinButton);

        expect(window.location.href).toBe('/?room=room-123');
    });

    it('shows create room form when "Create Room" is clicked', () => {
        render(<LandingPage />);
        const createButton = screen.getByRole('button', { name: /Create Room/i });
        fireEvent.click(createButton);

        expect(screen.getByPlaceholderText(/e.g. ProjectX/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Go/i })).toBeInTheDocument();
    });

    it('updates window.location when creating a room', () => {
        render(<LandingPage />);
        const createButton = screen.getByRole('button', { name: /Create Room/i });
        fireEvent.click(createButton);

        const input = screen.getByPlaceholderText(/e.g. ProjectX/i);
        const goButton = screen.getByRole('button', { name: /Go/i });

        fireEvent.change(input, { target: { value: 'new-project' } });
        fireEvent.click(goButton);

        expect(window.location.href).toBe('/?room=new-project');
    });
});
