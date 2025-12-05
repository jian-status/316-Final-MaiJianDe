import React, { useReducer } from 'react';
import { data } from 'react-router-dom';

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
                title: '',
                artist: '',
                year: ''
            };
    }
};

function SongCatalogScreen() {
    const [filterList, dispatch] = useReducer(filterListReducer, {
        title: '',
        artist: '',
        year: ''
    });

    const params = new URLSearchParams({
        title: filterList.title,
        artist: filterList.artist,
        year: filterList.year
    });
    const [songs, setSongs] = React.useState(null);
    const handleSearch = async () => {
        console.log('filterList state:', filterList);
        try {
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
            setSongs(data.songs);
        });

        } catch (error) {
            console.error('Error fetching filtered songs:', error);
        }
    };

    return (
        <div className="grid grid-cols-5">
            <div className="col-span-2 p-3">
                <h1>Song Catalog</h1>

                <div className="flex flex-col gap-2">
                    <input 
                        type="text" 
                        placeholder="by Title"
                        value={filterList.title}
                        onChange={(e) => dispatch({ type: 'FILTER_BY_TITLE', payload: e.target.value })}
                        className="px-5 py-2 border rounded"
                    />
                    <input 
                        type="text" 
                        placeholder="by Artist"
                        value={filterList.artist}
                        onChange={(e) => dispatch({ type: 'FILTER_BY_ARTIST', payload: e.target.value })}
                        className="px-5 py-2 border rounded"
                    />
                    <input 
                        type="text" 
                        placeholder="by Year"
                        value={filterList.year}
                        onChange={(e) => dispatch({ type: 'FILTER_BY_YEAR', payload: e.target.value })}
                        className="px-5 py-2 border rounded"
                    />
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleSearch}
                        className=""
                    >
                        Search
                    </button>
                    <button 
                        onClick={(e) => dispatch({ type: 'CLEAR' })}
                        className=""
                    >
                        Clear
                    </button>
                </div>
            </div>
            <div className="col-span-3 p-3">
                {songs ? songs.map(song => <div>{song.title} by {song.artist} ({song.year})</div>) : <div>No songs found.</div>}
            </div>
        </div>
    );
}

export default SongCatalogScreen;