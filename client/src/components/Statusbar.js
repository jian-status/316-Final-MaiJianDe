import { useContext } from 'react'
import AuthContext from '../auth'
import { GlobalStoreContext } from '../store'
import { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import ChangePlaylistName_Transaction from '../transactions/ChangePlaylistName_Transaction';
/**
 * Our Status bar React component goes at the bottom of our UI.
 * 
 * @author McKilla Gorilla
*/

function Statusbar() {
    const { store } = useContext(GlobalStoreContext);
    const { auth } = useContext(AuthContext);
    const [listName, setListName] = useState('');
    const [isEditingListName, setIsEditingListName] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    function handleKeyPress(event) {
        if (event.code === "Enter" && store.currentList && listName !== store.currentList.name) {
            const usingListNames = store.idNamePairs.map(pair => pair.name)
            if (listName.trim() === '') {
                setErrorMessage('Playlist name cannot be empty.');
                return;
            }
                
            if (usingListNames.includes(listName)) {
                setErrorMessage('Playlist name must be unique.');
                return;
            }
            store.setListName(store.currentList._id, listName);
            setIsEditingListName(false);
        }
    }
    useEffect(() => {
        if (store.currentList) {
            setListName(store.currentList.name);
        }
    }, [store.currentList]);

    console.log("logged in: " +  auth.loggedIn);
    let text ="";
    if (auth.loggedIn && store.isEditingPlaylist && store.currentList){
        text = store.currentList.name;
        return (
            <div id="playlister-statusbar">
                {!isEditingListName ? 
                    <div onClick={() => setIsEditingListName(true)}>
                        {listName}
                    </div> :
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        error={errorMessage !== ''}
                        helperText={errorMessage}
                        id={"list-" + store.currentList._id}
                        label="Playlist Name"
                        name="name"
                        autoComplete="Playlist Name"
                        className='list-card'
                        value={listName}
                        onChange={(e) => setListName(e.target.value)}
                        onKeyUp={handleKeyPress}
                    />
                }
            </div>
        );
    }
    return null;
}

export default Statusbar;