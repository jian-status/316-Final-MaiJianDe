import { useContext, useState, useEffect } from 'react';
import AuthContext from '../auth';
import { GlobalStoreContext } from '../store';
import TextField from '@mui/material/TextField';

/**
 * Status bar component that appears at the bottom of the UI.
 * Handles playlist name editing when in playlist editing mode.
 *
 * @author McKilla Gorilla
 */
function Statusbar() {
    const { store } = useContext(GlobalStoreContext);
    const { auth } = useContext(AuthContext);

    const [listName, setListName] = useState('');
    const [isEditingListName, setIsEditingListName] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Update listName when currentList changes
    useEffect(() => {
        if (store.currentList) {
            setListName(store.currentList.name);
            setErrorMessage(''); // Clear any previous errors
        }
    }, [store.currentList]);

    // Clear error message when starting to edit
    useEffect(() => {
        if (isEditingListName) {
            setErrorMessage('');
        }
    }, [isEditingListName]);

    const handleKeyPress = (event) => {
        if (event.code === "Enter" && store.currentList && listName !== store.currentList.name) {
            // Validate playlist name
            const trimmedName = listName.trim();

            if (trimmedName === '') {
                setErrorMessage('Playlist name cannot be empty.');
                return;
            }

            // Check for uniqueness among user's playlists
            const userPlaylists = (store.idNamePairs || [])
                .filter(pair => pair.ownerEmail === auth.user?.email)
                .map(pair => pair.name.toLowerCase());

            if (userPlaylists.includes(trimmedName.toLowerCase())) {
                setErrorMessage('Playlist name must be unique.');
                return;
            }

            // Update playlist name
            store.setListName(store.currentList._id, trimmedName);
            setIsEditingListName(false);
            setErrorMessage('');
        } else if (event.code === "Escape") {
            // Cancel editing and revert to original name
            setListName(store.currentList.name);
            setIsEditingListName(false);
            setErrorMessage('');
        }
    };

    const handleNameClick = () => {
        setIsEditingListName(true);
    };

    const handleNameChange = (event) => {
        setListName(event.target.value);
        // Clear error message as user types
        if (errorMessage) {
            setErrorMessage('');
        }
    };

    // Only render if user is logged in, editing a playlist, and has a current list
    if (!auth.loggedIn || !store.isEditingPlaylist || !store.currentList) {
        return null;
    }

    return (
        <div id="playlister-statusbar">
            {!isEditingListName ? (
                <div
                    onClick={handleNameClick}
                    style={{ cursor: 'pointer', padding: '8px' }}
                >
                    {listName}
                </div>
            ) : (
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    error={!!errorMessage}
                    helperText={errorMessage}
                    id={`list-${store.currentList._id}`}
                    label="Playlist Name"
                    name="name"
                    autoComplete="Playlist Name"
                    className="list-card"
                    value={listName}
                    onChange={handleNameChange}
                    onKeyUp={handleKeyPress}
                    autoFocus
                />
            )}
        </div>
    );
}

export default Statusbar;