import React, { useReducer } from 'react';
import SongCard from './SongCard';

const handleSongClick = (song) => {
    console.log('Song clicked:', song);
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
                return sorted.sort((a, b) => (b.playlistCount || 0) - (a.playlistCount || 0));
            case 'SORT_BY_playlistCountLoHi':
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
            return { ...state, sortBy: action.type, data: sortData(state.data, action.type) };
        default:
            return state;
    }
}
function SongCatalogScreen() {
    const [songs, dispatchSongs] = useReducer(sortSongsReducer, { data: null, sortBy: 'SORT_BY_songTitle' });
    const [filterList, dispatchFilterList] = useReducer(filterListReducer, { 
        title: '',
        artist: '',
        year: '',
        sortBy: 'SORT_BY_songTitle'
    });
    const [selectedSong, setSelectedSong] = React.useState(null);

    const handleSongClick = (song) => {
        setSelectedSong(song);
    };

    const handleSearch = async () => {
        console.log('filterList state:', filterList);
        try {
        const params = new URLSearchParams({
            title: filterList.title,
            artist: filterList.artist,
            year: filterList.year
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
            console.log('Database results:', data);
            dispatchSongs({ type: 'SET_SONGS', payload: data.songs });
        });

        } catch (error) {
            console.error('Error fetching filtered songs:', error);
        }
    };

    let displaySongs = (songs.data && songs.data.length !== 0) ? songs.data.map(song =>
        <div onClick={() => handleSongClick(song)} key={song._id}>
            <SongCard song={song}/>
        </div>
    ) : <div>No songs found.</div>;
    console.log(displaySongs)
    return (
        <div className="grid grid-cols-5">
            <div className="col-span-2 p-3">
                <h1>Song Catalog</h1>

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
                <div className="flex gap-2">
                    <button 
                        onClick={handleSearch}
                        className=""
                    >
                        Search
                    </button>
                    <button 
                        onClick={(e) => {
                            dispatchFilterList({ type: 'CLEAR' });
                            dispatchSongs({ type: 'SET_SONGS', payload: null });
                            setSelectedSong(null);
                        }}
                        className=""
                    >
                        Clear
                    </button>
                </div>
            </div>
            <div className="col-span-3 p-3">
                { songs.data === null ? <div>Begin by using the search fields to filter songs.</div> : (
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
                                <span>{songs.data.length} Songs</span>
                            </div>
                        </div>
                        <div className="overflow-y-auto max-h-[55vh] mt-4 flex flex-col gap-2">
                            { displaySongs }
                        </div>
                        <button>Add Song</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SongCatalogScreen;