import React, { useReducer } from 'react';
import SongCard from './SongCard';
import storeRequestSender from '../store/requests';

const filterListReducer = (state, action) => {
    switch (action.type) {
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
const computeTotalListens = (playlist) => (playlist?.songs || []).reduce((acc, s) => acc + (s.listens || 0), 0);
const handlePlaylistClick = (playlist) => {
    console.log("Clicked playlist: ", playlist);
}

const sortPlaylistsReducer = (state, action) => {
    switch (action.type) {
        case 'SORT_BY_uniqueListenersHiLo':
            return {...state, data: action.payload.toSorted((a, b) => computeTotalListens(b) - computeTotalListens(a))};
        case 'SORT_BY_uniqueListenersLoHi':
            return {...state, data: action.payload.toSorted((a, b) => computeTotalListens(a) - computeTotalListens(b))};
        case 'SET_PLAYLISTS':
        case 'SORT_BY_playlistNameAZ':
            return {...state, data: action.payload.toSorted((a, b) => (a.name || '').localeCompare(b.name || ''))};
        case 'SORT_BY_playlistNameZA':
            return {...state, data: action.payload.toSorted((a, b) => (b.name || '').localeCompare(a.name || ''))};
        case 'SORT_BY_ownerNameAZ':
            return {...state, data: action.payload.toSorted((a, b) => (a.ownerEmail || '').localeCompare(b.ownerEmail || ''))};
        case 'SORT_BY_ownerNameZA':
            return {...state, data: action.payload.toSorted((a, b) => (b.ownerEmail || '').localeCompare(a.ownerEmail || ''))};
        default:
            return state;
    }
}

function PlaylistCatalogScreen() {
    const [filterList, dispatchFilterList] = useReducer(filterListReducer, { playlistName: '', owner: '', songTitle: '', songArtist: '', songYear: '' });
    const [playlists, dispatchPlaylists] = useReducer(sortPlaylistsReducer, { data: null, sortBy: 'SORT_BY_playlistNameAZ' });

    const handleSearch = async () => {
        try {
            const response = await storeRequestSender.getPlaylists();
            const data = await response.json();
            if (data.success) {
                dispatchPlaylists({ type: 'SET_PLAYLISTS', payload: data.data });
            } else {
                console.error('Failed to get playlists', data);
            }
        } catch (err) {
            console.error('Error fetching playlists: ', err);
        }
    }

    let displayPlaylists = (playlists.data && playlists.data.length !== 0) ? playlists.data.map(playlist => (
        <div onClick={() => handlePlaylistClick(playlist)} key={playlist._id}>
            <div>{playlist.name}</div>
            <div>{playlist.songs?.length || 0} songs • {playlist.ownerEmail}</div>
            <div>Total Listens: {computeTotalListens(playlist)}</div>
        </div>
    )) : <div>No playlists found.</div>;

    return (
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
                            dispatchPlaylists({ type: 'SET_PLAYLISTS', payload: null });
                            handlePlaylistClick(null);
                        }}>Clear</button>
                    </div>
                </div>
            </div>
            <div className="col-span-3 p-3">
                {playlists.data === null ? <div>Click search to load your playlists.</div> : (
                    <div>
                        <div className="flex justify-between items-center">
                            <div className="flex gap-2 items-center">
                                <span>Sort by:</span>
                                <select id="sortBy" value={playlists.sortBy} onChange={(e) => dispatchPlaylists({ payload: playlists.data, type: e.target.value })}>
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
            </div>
        </div>
    );
}

export default PlaylistCatalogScreen;
