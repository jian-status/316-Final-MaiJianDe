import { useContext, useEffect, useState } from 'react'
import { GlobalStoreContext } from '../store'
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import { getPlaylistById } from '../store/requests/index';
import AuthContext from '../auth';
/*
    This is a card in our list of top 5 lists. It lets select
    a list for editing and it has controls for changing its 
    name or deleting it.
    
    @author McKilla Gorilla
*/
function PlaylistCard(props) {
    const { store } = useContext(GlobalStoreContext);
    const [editActive, setEditActive] = useState(false);
    const { idNamePair } = props;
    const [text, setText] = useState(idNamePair.name);
    const [expandSongs, setExpandSongs] = useState(false);
    const [playlist, setPlaylist] = useState(null);
    const { auth } = useContext(AuthContext);
    
    const fetchPlaylist = async () => {
        try {
            const res = await getPlaylistById(idNamePair._id);
            const data = await res.json();
            
            if (data?.success && data?.playlist) {
                setPlaylist(data.playlist);
            } else {
                setPlaylist(null);
            }
        } catch (err) {
            setPlaylist(null);
        }
    };

    
    useEffect(() => {
        fetchPlaylist();
        // Listen for song catalog changes to refresh playlist data
        const handler = () => {
            fetchPlaylist();
        };
        window.addEventListener('songCatalogChanged', handler);
        return () => {
            window.removeEventListener('songCatalogChanged', handler);
        };
    }, [idNamePair._id]);
    function handleLoadList(event, id) {
        if (!event.target.disabled) {
            let _id = event.target.id;
            if (_id.indexOf('list-card-text-') >= 0)
                _id = ("" + _id).substring("list-card-text-".length);

            store.setCurrentList(id);
        }
    }

    async function handleDeleteList(event, id) {
        event.stopPropagation();
        store.markListForDeletion(id);
    }

    function handleUpdateText(event) {
        setText(event.target.value);
    }
    function handleCopy(event) {
        event.stopPropagation();
        const toCopy = playlist ? JSON.parse(JSON.stringify(playlist)) : (store.currentList ? JSON.parse(JSON.stringify(store.currentList)) : null);
        if (!toCopy) {
            console.error("No playlist available to copy");
            return;
        }
        store.createNewListFromCopy(idNamePair.name + ` Copy_${new Date().getTime()}`, toCopy.songs || [], toCopy.ownerEmail || null);
    }
    const isMyPlaylist = playlist && auth && auth.user && playlist.ownerEmail === auth.user.email;

    const totalListeners = playlist && playlist.songs ? 
        playlist.songs.reduce((total, song) => total + (song.listens || 0), 0) : 0;

    let cardElement =
        <ListItem
            id={idNamePair._id}
            key={idNamePair._id}
            sx={{ borderRadius: "15px", bgcolor: '#8000F00F', marginTop: '15px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingTop: '15px' }}
            style={{ transform: "translate(1%,0%)", width: '98%' }}
            className={`${isMyPlaylist ? 'border border-solid border-red-500' : ''}`}
        >
            <div className={`flex w-full gap-4 mb-2 items-center`}>
                <div>
                    <div id="profile" className="w-20 h-20 rounded-full bg-gray-300 flex justify-center items-center">No profile</div>
                </div>
                <div className="flex flex-col w-full">
                    <div className='flex items-center justify-between w-full'>
                        <div>{idNamePair.name}</div>
                        <div className='flex'>
                            {isMyPlaylist && <button onClick={(event) => {
                                handleDeleteList(event, idNamePair._id)
                            }} className='rounded px-2 py-2 font-bold' aria-label='delete'>
                                Delete
                            </button>}
                            {isMyPlaylist && <button onClick={(event) => handleLoadList(event, idNamePair._id)} className='rounded px-2 py-2 font-bold' aria-label='edit'>
                                Edit
                            </button>}
                            {auth && auth.loggedIn && <button onClick={handleCopy} className='rounded px-2 py-2 font-bold' aria-label='edit'>
                                Copy
                            </button>}
                            <button onClick={(e) => { e.stopPropagation(); props.onPlay && props.onPlay(idNamePair._id); }} className='rounded px-2 py-2 font-bold' aria-label='play'>
                                Play
                            </button>
                        </div>
                    </div>
                    <div>{idNamePair.username || 'No username'}</div>
                    <div className="text-sm text-gray-600">{totalListeners} {totalListeners === 1 ? 'listener' : 'listeners'}</div>
                </div>
            </div>
            <div>
                {
                    expandSongs && playlist?.songs?.map((song, index) => (
                        <p key={song._id ?? song.id ?? song.youTubeId ?? index}>
                            {index + 1}. {song.title} by {song.artist}{song.year ? ` (${song.year})` : ''}
                        </p>
                    ))
                }
            </div>
            <button onClick={() => setExpandSongs(!expandSongs)} className="ml-auto rounded px-2 py-2 font-bold">{expandSongs ? "Show Less" : "Show More"}</button>
        </ListItem>

    return (
        <>
            {cardElement}
        </>
    );
}

export default PlaylistCard;