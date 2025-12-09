import { useContext, useState } from 'react'
import { GlobalStoreContext } from '../store'
import AuthContext from '../auth';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

function SongCard(props) {
    const { store } = useContext(GlobalStoreContext);
    const { auth } = useContext(AuthContext);
    const { song, index, isEditable = false, id: propId } = props;
    const [playlistCountVal, setPlaylistCountVal] = useState(song.playlistCount || 0);
    const [anchorEl, setAnchorEl] = useState(null);
    const [submenuAnchorEl, setSubmenuAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);
    const submenuOpen = Boolean(submenuAnchorEl);
    const handleOpenMenu = (e) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        // ensure user's playlists are loaded
        if (store && (!store.idNamePairs || store.idNamePairs.length === 0)) {
            try { store.loadIdNamePairs(); } catch (err) { }
        }
    };
    const handleCloseMenu = () => setAnchorEl(null);
    const handleOpenSubmenu = (event) => setSubmenuAnchorEl(event.currentTarget);
    const handleCloseSubmenu = () => setSubmenuAnchorEl(null);
    const handleCloseAllMenus = () => {
        setAnchorEl(null);
        setSubmenuAnchorEl(null);
    };
    const handleAddToPlaylist = async (playlistId) => {
        handleCloseAllMenus();
        if (!auth || !auth.loggedIn) {
            console.error('User must be logged in to add to playlist');
            return;
        }
        const songToAdd = { title: song.title, artist: song.artist, year: song.year, youTubeId: song.youTubeId };
        const result = await store.addSongToPlaylist(playlistId, songToAdd);
        if (result && result.success) {
            if (result.playlistCount !== undefined) {
                setPlaylistCountVal(result.playlistCount);
            } else {
                setPlaylistCountVal(prev => (prev || 0) + 1);
            }
        } else {
            console.error('Failed to add song to playlist', result);
        }
    };

    function handleDragStart(event) {
        event.dataTransfer.setData("song", index);
    }

    function handleDragOver(event) {
        event.preventDefault();
    }

    function handleDragEnter(event) {
        event.preventDefault();
    }

    function handleDragLeave(event) {
        event.preventDefault();
    }

    function handleDrop(event) {
        event.preventDefault();
        let targetIndex = index;
        let sourceIndex = Number(event.dataTransfer.getData("song"));

        // UPDATE THE LIST
        store.addMoveSongTransaction(sourceIndex, targetIndex);
    }
    const userEmail = auth && auth.user && auth.user.email ? auth.user.email.trim().toLowerCase() : '';
    const songOwnerEmail = (song && song.ownerEmail) ? song.ownerEmail.trim().toLowerCase() : '';
    const isSongOwnedByUser = Boolean(userEmail && songOwnerEmail && songOwnerEmail === userEmail);

    function handleRemoveSong(event) {
        event.stopPropagation();
        if (!auth || !auth.loggedIn) {
            console.error("Must be logged in to remove a song.");
            return;
        }
        if (!isSongOwnedByUser) {
            console.warn('User does not own this song; remove not allowed');
            return;
        }
        store.addRemoveSongTransaction(song, index);
    }
    function handleEditSong(event) {
        event.stopPropagation();
        if (!auth || !auth.loggedIn) {
            console.error("Must be logged in to edit a song.");
            return;
        }
        if (!isSongOwnedByUser) {
            console.warn('User does not own this playlist/song; edit not allowed');
            return;
        }
        handleCloseAllMenus();
        store.showEditSongModal(index, song);
    }
    function handleRemoveFromCatalog() {
        if (!auth || !auth.loggedIn) {
            console.error("Must be logged in to remove a song from catalog.");
            return;
        }
        if (!isSongOwnedByUser) {
            console.warn('User does not own this song; remove from catalog not allowed');
            return;
        }
        handleCloseAllMenus();
        store.showDeleteSongModal(song, isEditable ? index : null);
    }
    function handleClick(event) {
        // DOUBLE CLICK IS FOR SONG EDITING
        if (event.detail === 2) {
            if (!isSongOwnedByUser) {
                console.warn('User does not own this playlist/song; edit not allowed');
                return;
            }
            store.showEditSongModal(index, song);
        }
    }

    let cardClass = "list-card unselected-list-card";
    return (
        <div
            key={propId || (song._id || song.id || song.youTubeId || index)}
            id={propId || ('song-' + (song._id || song.id || song.youTubeId || index) + '-card')}
            className={cardClass}
            onDragStart={isEditable ? handleDragStart : null}
            onDragOver={isEditable ? handleDragOver: null}
            onDragEnter={isEditable ? handleDragEnter : null}
            onDragLeave={isEditable ? handleDragLeave : null}
            onDrop={isEditable ? handleDrop : null}
            draggable={isEditable}
            onClick={isEditable ? handleClick : null}
        >   
            <div className='flex justify-between items-center'>
            <div>
                {isEditable ? '' : index + 1 + '. '}
                <a
                    id={propId ? `${propId}-link` : 'song-' + (song._id || song.id || song.youTubeId || index) + '-link'}
                    className="song-link"
                    href={"https://www.youtube.com/watch?v=" + song.youTubeId}>
                    {song.title} ({song.year}) by {song.artist}
                </a>
            </div>
            {auth && auth.loggedIn && (
                <div className='flex gap-2'>
                    <IconButton aria-label='more' onClick={handleOpenMenu} size='small'>
                        <MoreVertIcon />
                    </IconButton>
                    <Menu
                        id="song-main-menu"
                        anchorEl={anchorEl}
                        open={menuOpen}
                        onClose={handleCloseAllMenus}
                    >
                        <MenuItem onClick={handleOpenSubmenu}>
                            Add to Playlist
                            <KeyboardArrowRightIcon style={{ marginLeft: 'auto' }} />
                        </MenuItem>
                        {isSongOwnedByUser && (
                            <MenuItem onClick={handleEditSong}>Edit Song</MenuItem>
                        )}
                        {isSongOwnedByUser && (
                            <MenuItem onClick={handleRemoveFromCatalog}>
                                {isEditable ? 'Remove from Playlist' : 'Remove from Catalog'}
                            </MenuItem>
                        )}
                    </Menu>
                    <Menu
                        id="song-playlist-submenu"
                        anchorEl={submenuAnchorEl}
                        open={submenuOpen}
                        onClose={handleCloseAllMenus}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                        }}
                    >
                        {store && store.idNamePairs && store.idNamePairs.length > 0 ? store.idNamePairs.map((pair) => (
                            <MenuItem key={pair._id} onClick={() => handleAddToPlaylist(pair._id)}>{pair.name}</MenuItem>
                        )) : (
                            <MenuItem disabled>No Playlists</MenuItem>
                        )}
                    </Menu>
                </div>
            )}
            </div>
            
            <div className='flex justify-between text-sm'>
                <p>Listens: {song.listens}</p>
                <p>Playlists: {playlistCountVal}</p>
            </div>

        </div>
    );
}

export default SongCard;