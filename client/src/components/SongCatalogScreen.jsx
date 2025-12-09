import React, { useReducer, useContext } from 'react';
import SongCard from './SongCard';
import MUIDeleteSongModal from './MUIDeleteSongModal';
import MUIEditSongModal from './MUIEditSongModal';
import MUIAddSongModal from './MUIAddSongModal';
import { GlobalStoreContext } from '../store';
import AuthContext from '../auth';
import storeRequestSender from '../store/requests';

const handleSongClick = (song) => {
}
const filterListReducer = (state, action) => {
    switch (action.type) {
        case 'FILTER_BY_TITLE':
            return { ...state, title: action.payload };
        case 'FILTER_BY_ARTIST':
            return { ...state, artist: action.payload };
        case 'FILTER_BY_YEAR':
            return { ...state, year: action.payload };
        case 'CLEAR':
            return {
                ...state,
                title: '',
                artist: '',
                year: ''
            };
        default:
            return state;
    }
};

const sortSongsReducer = (state, action) => {
    const sortData = (data, sortBy) => {
        if (!data || data.length === 0) return data;
        const sorted = [...data];
        
        switch (sortBy) {
            case 'SORT_BY_listensHiLo':
                return sorted.sort((a, b) => (b.listens || 0) - (a.listens || 0));
            case 'SORT_BY_listensLoHi':
                return sorted.sort((a, b) => (a.listens || 0) - (b.listens || 0));
            case 'SORT_BY_playlistCountHiLo':
                console.log('Sorting by playlistCount Hi-Lo, data:', data.map(s => ({title: s.title, playlistCount: s.playlistCount})));
                return sorted.sort((a, b) => (b.playlistCount || 0) - (a.playlistCount || 0));
            case 'SORT_BY_playlistCountLoHi':
                console.log('Sorting by playlistCount Lo-Hi, data:', data.map(s => ({title: s.title, playlistCount: s.playlistCount})));
                return sorted.sort((a, b) => (a.playlistCount || 0) - (b.playlistCount || 0));
            case 'SORT_BY_songArtist':
                return sorted.sort((a, b) => (a.artist || '').localeCompare(b.artist || ''));
            case 'SORT_BY_songYear':
                return sorted.sort((a, b) => (a.year || 0) - (b.year || 0));
            case 'SORT_BY_songTitle':
            default:
                return sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        }
    };

    switch (action.type) {
        case 'SET_SONGS':
            return { ...state, data: sortData(action.payload, state.sortBy) };
        case 'SORT_BY_listensHiLo':
        case 'SORT_BY_listensLoHi':
        case 'SORT_BY_playlistCountHiLo':
        case 'SORT_BY_playlistCountLoHi':
        case 'SORT_BY_songArtist':
        case 'SORT_BY_songYear':
        case 'SORT_BY_songTitle':
            console.log('Sort reducer called with type:', action.type);
            return { ...state, sortBy: action.type, data: sortData(state.data, action.type) };
        default:
            return state;
    }
}
function SongCatalogScreen() {
    const { store } = useContext(GlobalStoreContext);
    const { auth } = useContext(AuthContext);
    const [songs, dispatchSongs] = useReducer(sortSongsReducer, { data: null, sortBy: 'SORT_BY_songTitle' });
    const [filterList, dispatchFilterList] = useReducer(filterListReducer, { 
        title: '',
        artist: '',
        year: '',
        sortBy: 'SORT_BY_songTitle'
    });
    const [selectedSong, setSelectedSong] = React.useState(null);
    const [youtubePlayer, setYoutubePlayer] = React.useState(null);

    const handleSongClick = (song) => {
        setSelectedSong(song);
    };

    const handleAddNewSong = () => {
        store.showAddSongModal();
    };

    // Get user's playlists to check if Add Song button should be enabled
    const userPlaylists = store.idNamePairs ? store.idNamePairs.filter(pair => pair.ownerEmail === auth.user.email) : [];

    const handleSearch = async () => {
        // filterList state
        try {
        const params = new URLSearchParams({
            title: filterList.title,
            artist: filterList.artist,
            year: filterList.year,
            limit: '100'
        });   
        await fetch(`http://localhost:4000/store/songs/getSongCatalog?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            // Database results received
            dispatchSongs({ type: 'SET_SONGS', payload: data.songs });
        });

        } catch (error) {
            console.error('Error fetching filtered songs:', error);
        }
    };

    const handleSongCatalogChanged = React.useCallback(() => {
        handleSearch();
    }, []);

    React.useEffect(() => {
        window.addEventListener('songCatalogChanged', handleSongCatalogChanged);
        return () => window.removeEventListener('songCatalogChanged', handleSongCatalogChanged);
    }, [handleSongCatalogChanged]);

    React.useEffect(() => {
        handleSearch();
    }, []);

    React.useEffect(() => {
        if (auth.loggedIn && (!store.idNamePairs || store.idNamePairs.length === 0)) {
            store.loadIdNamePairs();
        }
    }, [auth.loggedIn, store]);

    // Load YouTube API and set up player when song is selected
    React.useEffect(() => {
        if (!selectedSong || !selectedSong.youTubeId) {
            if (youtubePlayer) {
                youtubePlayer.destroy();
                setYoutubePlayer(null);
            }
            return;
        }

        // Load YouTube API if not already loaded
        if (!window.YT) {
            window.onYouTubeIframeAPIReady = () => {
                createPlayer();
            };
            
            const script = document.createElement('script');
            script.src = 'https://www.youtube.com/iframe_api';
            script.async = true;
            document.head.appendChild(script);
        } else if (window.YT && window.YT.Player) {
            // Small delay to ensure iframe is rendered
            setTimeout(createPlayer, 100);
        }

        function createPlayer() {
            if (window.YT && window.YT.Player && document.getElementById('youtube-player')) {
                const player = new window.YT.Player('youtube-player', {
                    events: {
                        onStateChange: onPlayerStateChange
                    }
                });
                setYoutubePlayer(player);
            }
        }

        function onPlayerStateChange(event) {
            // State 1 means playing
            if (event.data === 1 && selectedSong) {
                const key = `catalog|${selectedSong.youTubeId || selectedSong.title}`;
                const listened = JSON.parse(sessionStorage.getItem('listenedSongs') || '[]');
                if (listened.includes(key)) return;
                
                // Call server to increment listens
                (async () => {
                    try {
                        const response = await storeRequestSender.incrementSongListen(null, selectedSong.youTubeId, selectedSong.title, selectedSong.artist, selectedSong.year);
                        if (response.status === 200) {
                            const data = await response.json();
                            if (data.success && data.song) {
                                listened.push(key);
                                sessionStorage.setItem('listenedSongs', JSON.stringify(listened));
                                // Notify song catalog to refresh
                                window.dispatchEvent(new Event('songCatalogChanged'));
                            }
                        }
                    } catch (err) {
                        console.error('Error increasing listen count from catalog:', err);
                    }
                })();
            }
        }

        return () => {
            if (youtubePlayer && typeof youtubePlayer.destroy === 'function') {
                youtubePlayer.destroy();
                setYoutubePlayer(null);
            }
        };
    }, [selectedSong]);

    let displaySongs = (songs.data && songs.data.length !== 0) ? songs.data.map((song, idx) =>
        <div onClick={() => handleSongClick(song)} key={song._id || song.id || song.youTubeId || idx}>
            <SongCard song={song} index={idx} id={song._id || song.id || song.youTubeId || idx} />
        </div>
    ) : <div>No songs found.</div>;
    return (
        <div className="grid grid-cols-5">
            <div className="col-span-2 p-3">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl">Song Catalog</h1>

                    <div className="flex flex-col gap-2">
                    <input 
                        type="text" 
                        placeholder="by Title"
                        value={filterList.title}
                        onChange={(e) => dispatchFilterList({ type: 'FILTER_BY_TITLE', payload: e.target.value })}
                        className="px-5 py-2 border rounded"
                    />
                    <input 
                        type="text" 
                        placeholder="by Artist"
                        value={filterList.artist}
                        onChange={(e) => dispatchFilterList({ type: 'FILTER_BY_ARTIST', payload: e.target.value })}
                        className="px-5 py-2 border rounded"
                    />
                    <input 
                        type="text" 
                        placeholder="by Year"
                        value={filterList.year}
                        onChange={(e) => dispatchFilterList({ type: 'FILTER_BY_YEAR', payload: e.target.value })}
                        className="px-5 py-2 border rounded"
                    />
                </div>
                {selectedSong && selectedSong.youTubeId && (
                    <div className="my-4">
                        <iframe
                            id="youtube-player"
                            width="100%"
                            height="315"
                            src={`https://www.youtube.com/embed/${selectedSong.youTubeId}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                )}
                <div className="flex gap-2 mt-4">
                    <button 
                        onClick={handleSearch}
                        className="bg-purple-600 hover:bg-purple-500 rounded px-4 py-2 text-white font-bold"
                    >
                        Search
                    </button>
                    <button 
                        onClick={(e) => {
                            dispatchFilterList({ type: 'CLEAR' });
                            dispatchSongs({ type: 'SET_SONGS', payload: null });
                            setSelectedSong(null);
                        }}
                        className="bg-purple-600 hover:bg-purple-500 rounded px-4 py-2 text-white font-bold"
                    >
                        Clear
                    </button>
                </div>
                </div>
            </div>
            <div className="col-span-3 p-3">
                { songs.data === null ? <div>Loading songs...</div> : (
                    <div>
                        <div className="flex justify-between items-center">
                            <div className="flex gap-2 items-center">
                                <span>Sort by:</span>
                                <select 
                                    id="sortBy"
                                    value={songs.sortBy}
                                    onChange={(e) => dispatchSongs({type: e.target.value})}
                                    className="px-3 py-2 border rounded"
                                >
                                    <option value="SORT_BY_listensHiLo">Listens Hi Lo</option>
                                    <option value="SORT_BY_listensLoHi">Listens Lo Hi</option>
                                    <option value="SORT_BY_playlistCountHiLo">Playlist Count Hi Lo</option>
                                    <option value="SORT_BY_playlistCountLoHi">Playlist Count Lo Hi</option>
                                    <option value="SORT_BY_songTitle">Song Title</option>
                                    <option value="SORT_BY_songArtist">Song Artist</option>
                                    <option value="SORT_BY_songYear">Song Year</option>
                                </select>
                            </div>
                            <div>
                                <span className="text-xl mb-4">{songs.data.length >= 100 ? '100+' : songs.data.length} Songs</span>
                            </div>
                        </div>
                        <div className="overflow-y-auto max-h-[55vh] mt-4 flex flex-col gap-2">
                            { displaySongs }
                        </div>
                        {auth && auth.loggedIn && (
                            <div className="flex items-center gap-2 mt-4">
                                <button 
                                    onClick={handleAddNewSong} 
                                    disabled={userPlaylists.length === 0}
                                    className={`rounded px-4 py-2 text-white font-bold ${
                                        userPlaylists.length === 0 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-purple-600 hover:bg-purple-500'
                                    }`}
                                >
                                    Add Song
                                </button>
                                {userPlaylists.length === 0 && (
                                    <span className="text-red-500 text-sm">No playlists to add song to</span>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            <MUIDeleteSongModal />
            <MUIEditSongModal />
            <MUIAddSongModal />
        </div>
    );
}

export default SongCatalogScreen;