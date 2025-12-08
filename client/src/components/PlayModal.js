import { useContext, useEffect, useState } from 'react';
import { GlobalStoreContext } from '../store';
import storeRequestSender from '../store/requests';

export default function PlayModal(props) {
    const { onClose } = props;
    const { store } = useContext(GlobalStoreContext);
    const playlist = store.currentList;
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    // (debug) playlist song count logging removed

    // Playback controls
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        setCurrentSongIndex(0);
        setIsPlaying(false);
    }, [playlist?._id]); // Only reset when playlist ID changes, not on every playlist update
    
    useEffect(() => {
        // When the song begins playing, attempt to increment listen count
        if (!isPlaying || !playlist || !playlist.songs || playlist.songs.length === 0) return;
        const song = playlist.songs[currentSongIndex];
        if (!song) return;
        const key = `${playlist._id}|${song.youTubeId || song.title}`;
        const listened = JSON.parse(sessionStorage.getItem('listenedSongs') || '[]');
        if (listened.includes(key)) return;
        // Call server to increment listens and update local store
        (async () => {
            try {
                const response = await storeRequestSender.incrementSongListen(playlist._id, song.youTubeId, song.title, song.artist, song.year);
                if (response.status === 200) {
                    const data = await response.json();
                    if (data.success && data.song) {
                        // update local store's listens
                        if (typeof store.incrementSongListenLocal === 'function') {
                            store.incrementSongListenLocal(playlist._id, song.youTubeId, data.song.listens);
                        }
                        listened.push(key);
                        sessionStorage.setItem('listenedSongs', JSON.stringify(listened));
                    }
                }
            } catch (err) {
                console.error('Error increasing listen count:', err);
            }
        })();
    }, [isPlaying, currentSongIndex, playlist, store]);
    useEffect(() => {
        // Scroll current song into view
        const el = document.getElementById(`play-song-${currentSongIndex}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [currentSongIndex]);

    const prevSong = () => {
        if (!playlist || !playlist.songs || playlist.songs.length === 0) return;
        setCurrentSongIndex(i => (i > 0 ? i - 1 : i));
        setIsPlaying(true);
    }
    const nextSong = () => {
        if (!playlist || !playlist.songs || playlist.songs.length === 0) return;
        setCurrentSongIndex(i => (i < playlist.songs.length - 1 ? i + 1 : i));
        setIsPlaying(true);
    }
    const togglePlay = () => {
        if (!playlist || !playlist.songs || playlist.songs.length === 0) return;
        setIsPlaying(p => !p);
    }
    return (
            <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
                <div className="bg-white border-2 border-black w-[min(90vw,900px)] max-h-[90vh] flex flex-col overflow-hidden p-4 rounded" onClick={(e)=>e.stopPropagation()}>
                    <h2 className="text-xl font-bold mb-4">{playlist ? playlist.name : "Loading playlist..."}</h2>
                    {playlist && playlist.songs && playlist.songs.length > 0 ? (
                        <>
                            <div className="mb-4 text-left w-full px-6">
                                <strong>Now {isPlaying ? 'Playing' : 'Paused'}:</strong>
                                <div className="mt-2">{currentSongIndex + 1}. {playlist.songs[currentSongIndex].title} - {playlist.songs[currentSongIndex].artist} ({playlist.songs[currentSongIndex].year})</div>
                            </div>
                            {playlist.songs[currentSongIndex].youTubeId && (
                                <div className="my-2 w-full flex-none px-6">
                                    <iframe
                                        className="w-full h-[200px] md:h-[300px]"
                                        src={`https://www.youtube.com/embed/${playlist.songs[currentSongIndex].youTubeId}?autoplay=${isPlaying ? 1 : 0}`}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}
                            <div className="flex gap-2 mb-4">
                                <button className="px-3 py-1 bg-gray-200 rounded" onClick={prevSong}>Prev</button>
                                <button className="px-3 py-1 bg-gray-200 rounded" onClick={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</button>
                                <button className="px-3 py-1 bg-gray-200 rounded" onClick={nextSong}>Next</button>
                            </div>
                            <ul className="mb-4 w-full px-6 flex-1 overflow-y-auto">
                                {playlist.songs.map((song, idx) => (
                                <li
                                            key={song._id || song.id || song.youTubeId || idx}
                                            id={`play-song-${idx}`}
                                    className={`text-left py-2 px-2 flex items-center gap-3 rounded ${idx === currentSongIndex ? 'bg-purple-200 font-semibold border-l-4 border-purple-600' : 'bg-white'} text-black border-b`}
                                    >
                                    <span className="w-6 text-center text-purple-700">{idx === currentSongIndex ? (isPlaying ? '⏵' : '⏸') : (idx + 1)}</span>
                                    <span className="flex-1">{song.title} - {song.artist} <span className="text-gray-500">({song.year})</span></span>
                                    </li>
                                ))}
                        </ul>
                        </>
                    ) : (
                        <div>
                            <div>No songs in this playlist.</div>
                        </div>
                    )}
                    <div className='flex gap-2'>
                        <button className="mt-4 px-4 py-2 bg-purple-600 text-white rounded" onClick={onClose}>Close</button>
                    </div>
                </div>
            </div>
        )
}