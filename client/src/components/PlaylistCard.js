import { useContext, useEffect, useState } from 'react'
import { GlobalStoreContext } from '../store'
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import { getPlaylistById } from '../store/requests/index';
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
    const [songs, setSongs] = useState([]);
    const [expandSongs, setExpandSongs] = useState(false);
    useEffect(() => {
        getPlaylistById(idNamePair._id)
            .then((res) => res.json())
            .then((data) => {
                if (data && data.success && data.playlist && Array.isArray(data.playlist.songs)) {
                    setSongs(data.playlist.songs);
                } else if (data && data.playlist && Array.isArray(data.playlist.songs)) {
                    setSongs(data.playlist.songs);
                    console.warn('Playlist loaded with warning:', data.description);
                } else {
                    setSongs([]);
                }
            })
            .catch((err) => {
                setSongs([]);
                console.log(err);
            });
    }, []);
    function handleLoadList(event, id) {
        console.log("handleLoadList for " + id);
        if (!event.target.disabled) {
            let _id = event.target.id;
            if (_id.indexOf('list-card-text-') >= 0)
                _id = ("" + _id).substring("list-card-text-".length);

            console.log("load " + event.target.id);

            // CHANGE THE CURRENT LIST
            store.setCurrentList(id);
        }
    }

    function handleToggleEdit(event) {
        event.stopPropagation();
        toggleEdit();
    }

    function toggleEdit() {
        let newActive = !editActive;
        if (newActive) {
            store.setIsListNameEditActive();
        }
        setEditActive(newActive);
    }

    async function handleDeleteList(event, id) {
        event.stopPropagation();
        //let _id = event.target.id;
        //_id = ("" + _id).substring("delete-list-".length);
        store.markListForDeletion(id);
    }

    function handleKeyPress(event) {
        if (event.code === "Enter") {
            let id = event.target.id.substring("list-".length);
            store.changeListName(id, text);
            toggleEdit();
        }
    }
    function handleUpdateText(event) {
        setText(event.target.value);
    }
    let cardElement =
        <ListItem
            id={idNamePair._id}
            key={idNamePair._id}
            sx={{ borderRadius: "15px", bgcolor: '#8000F00F', marginTop: '15px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', paddingTop: '15px' }}
            style={{ transform: "translate(1%,0%)", width: '98%' }}
        >
            <div className="flex w-full gap-4 mb-2 items-center">
                <div>
                    <div id="profile" className="w-20 h-20 rounded-full bg-gray-300 flex justify-center items-center">No profile</div>
                </div>
                <div className="flex flex-col w-full">
                    <div className='flex items-center justify-between w-full'>
                        <div>{idNamePair.name}</div>
                        <div className='flex gap-2'>
                            <button onClick={(event) => {
                                handleDeleteList(event, idNamePair._id)
                            }} aria-label='delete'>
                                Delete
                            </button>
                            <button onClick={(event) => handleLoadList(event, idNamePair._id)} aria-label='edit'>
                                Edit
                            </button>
                            <button onClick={(event) => handleLoadList(event, idNamePair._id)} aria-label='edit'>
                                Copy
                            </button>
                            <button onClick={(event) => handleLoadList(event, idNamePair._id)} aria-label='edit'>
                                Play
                            </button>
                        </div>
                    </div>
                    <div>{idNamePair.username || 'No username'}</div>
                </div>
            </div>
            <div>
                {
                    expandSongs && songs.map((song, index) => (
                        <p>{index + 1}. {song.title}</p>)
                    )
                }

            </div>
            <button onClick={() => setExpandSongs(!expandSongs)} className="ml-auto">{expandSongs ? "Show Less" : "Show More"}</button>
        </ListItem>


    if (editActive) {
        cardElement =
            <TextField
                margin="normal"
                required
                fullWidth
                id={"list-" + idNamePair._id}
                label="Playlist Name"
                name="name"
                autoComplete="Playlist Name"
                className='list-card'
                onKeyUp={handleKeyPress}
                onChange={handleUpdateText}
                defaultValue={idNamePair.name}
                autoFocus
            />
    }
    return (
        cardElement
    );
}

export default PlaylistCard;