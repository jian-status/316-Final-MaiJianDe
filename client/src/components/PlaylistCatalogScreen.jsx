import React, { useReducer, useContext, useEffect, useRef } from 'react';
import SongCard from './SongCard';
import AuthContext from '../auth';
import storeRequestSender from '../store/requests';
import { GlobalStoreContext } from '../store'
import WorkspaceScreen from './WorkspaceScreen';
import PlaylistCard from './PlaylistCard';
import MUIDeleteModal from './MUIDeleteModal';
import PlayModal from './PlayModal.js';

const filterListReducer = (state, action) => {
    switch (action.type) {
        case 'SET_ALL_PLAYLISTS':
            return { ...state, allPlaylists: action.payload };
        case 'FILTER_BY_PLAYLIST_NAME':
            return { ...state, playlistName: action.payload };
        case 'FILTER_BY_OWNER':
            return { ...state, owner: action.payload };
        case 'FILTER_BY_SONG_TITLE':
            return { ...state, songTitle: action.payload };
        case 'FILTER_BY_SONG_ARTIST':
            return { ...state, songArtist: action.payload };
        case 'FILTER_BY_SONG_YEAR':
            return { ...state, songYear: action.payload };
        case 'CLEAR':
            return { ...state, playlistName: '', owner: '', songTitle: '', songArtist: '', songYear: '' };
        default:
            return state;
    }
};
const computeTotalListens = (playlist) => {
    if (!playlist || !playlist.songs) return 0;
    return playlist.songs.reduce((total, song) => total + (song.listens || 0), 0);
}
const handlePlaylistClick = (playlist) => {
}
const sortPlaylistsReducer = (state, action) => {
    let source = action.payload || state.data || [];
    switch (action.type) {
        case 'SORT_BY_uniqueListenersHiLo':
            return { ...state, data: [...source].toSorted((a, b) => computeTotalListens(b) - computeTotalListens(a)), sortBy: action.type };
        case 'SORT_BY_uniqueListenersLoHi':
            return { ...state, data: [...source].toSorted((a, b) => computeTotalListens(a) - computeTotalListens(b)), sortBy: action.type };
        case 'SET_PLAYLISTS':
            return { ...state, data: [...(action.payload || [])], sortBy: state.sortBy };
        case 'SORT_BY_playlistNameAZ':
            return { ...state, data: [...source].toSorted((a, b) => (a.name || '').localeCompare(b.name || '')), sortBy: action.type };
        case 'SORT_BY_playlistNameZA':
            return { ...state, data: [...source].toSorted((a, b) => (b.name || '').localeCompare(a.name || '')), sortBy: action.type };
        case 'SORT_BY_ownerNameAZ':
            return { ...state, data: [...source].toSorted((a, b) => (a.ownerEmail || '').localeCompare(b.ownerEmail || '')), sortBy: action.type };
        case 'SORT_BY_ownerNameZA':
            return { ...state, data: [...source].toSorted((a, b) => (b.ownerEmail || '').localeCompare(a.ownerEmail || '')), sortBy: action.type };
        default:
            return state;
    }
}

function PlaylistCatalogScreen() {
    const [showPlayModal, setShowPlayModal] = React.useState(false);
    const [pendingPlayId, setPendingPlayId] = React.useState(null);
    const [filterList, dispatchFilterList] = useReducer(filterListReducer, { playlistName: '', owner: '', songTitle: '', songArtist: '', songYear: '', allPlaylists: [], result: [] });
    const [playlists, dispatchPlaylists] = useReducer(sortPlaylistsReducer, { data: null, sortBy: 'SORT_BY_playlistNameAZ' });
    const { auth } = useContext(AuthContext);
    const { store } = useContext(GlobalStoreContext);
    const handlePlaylistCreation = () => {
        if (!auth || !auth.loggedIn) {
            console.error('Must be logged in to create a playlist');
            return;
        }
        store.createNewList();
    }
    const handleSearch = async () => {
        try {
            const response = await storeRequestSender.getPlaylists();
            const data = await response.json();
            if (data.success) {
                let filtered = data.data;
                if (filterList.playlistName) {
                    filtered = filtered.filter(p => (p.name || "").toLowerCase().startsWith(filterList.playlistName.toLowerCase()));
                }
                if (filterList.owner) {
                    filtered = filtered.filter(p => (p.owner?.username || "").toLowerCase().startsWith(filterList.owner.toLowerCase()));
                }
                if (filterList.songTitle) {
                    filtered = filtered.filter(p => (p.songs || []).some(song => (song.title || "").toLowerCase().startsWith(filterList.songTitle.toLowerCase())));
                }
                if (filterList.songArtist) {
                    filtered = filtered.filter(p => (p.songs || []).some(song => (song.artist || "").toLowerCase().startsWith(filterList.songArtist.toLowerCase())));
                }
                if (filterList.songYear) {
                    filtered = filtered.filter(p => (p.songs || []).some(song => String(song.year || "").startsWith(filterList.songYear)));
                }
                dispatchPlaylists({ type: 'SET_PLAYLISTS', payload: filtered });
            } else {
                console.error('Failed to get playlists', data);
            }
        } catch (err) {
            console.error('Error fetching playlists: ', err);
        }
    }

    useEffect(() => {
        if (!auth.isAuthReady) return;
        let playlists;
        if (auth.loggedIn && auth.user) {
            playlists = storeRequestSender.getLoggedInPlaylists();
        } else {
            playlists = storeRequestSender.getPlaylists();
        }
        playlists
            .then(async res => res.json())
            .then(async data => {
                if (data.success) {
                    dispatchFilterList({ type: 'SET_ALL_PLAYLISTS', payload: data.data });
                    dispatchPlaylists({ type: 'SET_PLAYLISTS', payload: data.data });
                } else {
                    dispatchFilterList({ type: 'SET_ALL_PLAYLISTS', payload: [] });
                    dispatchPlaylists({ type: 'SET_PLAYLISTS', payload: [] });
                }
            })
            .catch(err => { console.error('Error loading playlists: ', err) });
    }, [auth.isAuthReady, auth.loggedIn, auth.user, store.currentList, store.idNamePairs]);

    useEffect(() => {
        if (pendingPlayId && store.currentList && store.currentList._id === pendingPlayId) {
            setShowPlayModal(true);
            setPendingPlayId(null);
        }
    }, [pendingPlayId, store.currentList]);

    let displayPlaylists = (playlists.data && playlists.data.length !== 0)
        ? playlists.data.map(playlist => (
            <div key={playlist._id}>
                <PlaylistCard
                    key={playlist._id}
                    idNamePair={{ _id: playlist._id, name: playlist.name, username: playlist.owner?.username }}
                    onPlay={(id) => { setPendingPlayId(id); store.loadPlaylistForModal(id); }}
                />
            </div>
        ))
        : <div>No playlists found.</div>;

    return (
        (store.isEditingPlaylist && store.currentList) ? <WorkspaceScreen /> :
        <div className="grid grid-cols-5">
            <div className="col-span-2 p-3">
                <div className="flex flex-col gap-2">
                    <h1>Playlist Catalog</h1>
                    <div className='flex flex-col'>
                        <input
                            type="text"
                            placeholder="Playlist name"
                            value={filterList.playlistName}
                            onChange={(e) => dispatchFilterList({ type: 'FILTER_BY_PLAYLIST_NAME', payload: e.target.value })}
                            className="px-5 py-2 border rounded"
                        />
                        <input
                            type="text"
                            placeholder="Owner username (email)"
                            value={filterList.owner}
                            onChange={(e) => dispatchFilterList({ type: 'FILTER_BY_OWNER', payload: e.target.value })}
                            className="px-5 py-2 border rounded"
                        />
                        <input
                            type="text"
                            placeholder="Song title"
                            value={filterList.songTitle}
                            onChange={(e) => dispatchFilterList({ type: 'FILTER_BY_SONG_TITLE', payload: e.target.value })}
                            className="px-5 py-2 border rounded"
                        />
                        <input
                            type="text"
                            placeholder="Song artist"
                            value={filterList.songArtist}
                            onChange={(e) => dispatchFilterList({ type: 'FILTER_BY_SONG_ARTIST', payload: e.target.value })}
                            className="px-5 py-2 border rounded"
                        />
                        <input
                            type="text"
                            placeholder="Song year"
                            value={filterList.songYear}
                            onChange={(e) => dispatchFilterList({ type: 'FILTER_BY_SONG_YEAR', payload: e.target.value })}
                            className="px-5 py-2 border rounded"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleSearch}>Search</button>
                        <button onClick={() => {
                            dispatchFilterList({ type: 'CLEAR' });
                            dispatchPlaylists({ type: 'SET_PLAYLISTS', payload: filterList.allPlaylists });
                            handlePlaylistClick(null);
                        }}>Clear</button>
                    </div>
                </div>
            </div>
            <div className="col-span-3 p-3 flex flex-col gap-4">
                {playlists.data === null ? <div>Click search to load your playlists.</div> : (
                    <div>
                        <div className="flex justify-between items-center">
                            <div className="flex gap-2 items-center">
                                <span>Sort by:</span>
                                <select id="sortBy" value={playlists.sortBy} onChange={(e) => dispatchPlaylists({ type: e.target.value })}>
                                    <option value="SORT_BY_uniqueListenersHiLo">Unique Listeners Hi Lo</option>
                                    <option value="SORT_BY_uniqueListenersLoHi">Unique Listeners Lo Hi</option>
                                    <option value="SORT_BY_playlistNameAZ">Playlist Name (A-Z)</option>
                                    <option value="SORT_BY_playlistNameZA">Playlist Name (Z-A)</option>
                                    <option value="SORT_BY_ownerNameAZ">Owner (A-Z)</option>
                                    <option value="SORT_BY_ownerNameZA">Owner (Z-A)</option>
                                </select>
                            </div>
                            <div>
                                <span>{playlists.data.length} Playlists</span>
                            </div>
                        </div>
                        <div className="overflow-y-auto max-h-[55vh] mt-4 flex flex-col gap-2">
                            {displayPlaylists}
                        </div>
                    </div>
                )}
                {auth && auth.loggedIn && (
                    <button className='bg-purple-600 hover:bg-purple-500 rounded px-4 py-2 w-32 text-white font-bold' onClick={handlePlaylistCreation}>
                        New Playlist
                    </button>
                )}
            </div>
            <MUIDeleteModal />
            {showPlayModal && <PlayModal onClose={() => { setShowPlayModal(false); store.clearCurrentList(); setPendingPlayId(null); }} />}

        </div>
    );
}

export default PlaylistCatalogScreen;
