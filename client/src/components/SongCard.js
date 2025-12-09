import { useContext, useState, useEffect } from 'react'
import { GlobalStoreContext } from '../store'
import AuthContext from '../auth';
import storeRequestSender from '../store/requests';
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
    const [errorMessage, setErrorMessage] = useState('');
    const menuOpen = Boolean(anchorEl);
    const submenuOpen = Boolean(submenuAnchorEl);

    // Clear error message after 5 seconds
    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => {
                setErrorMessage('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);
    const handleOpenMenu = (e) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);        
        if (!store?.idNamePairs?.length) {
            try {
                store.loadIdNamePairs();
            } catch (err) {
                console.error('Failed to load user playlists:', err);
            }
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
        setErrorMessage(''); // Clear any previous error
        
        if (!auth?.loggedIn) {
            setErrorMessage('You must be logged in to add songs to playlists');
            return;
        }
        
        const { title, artist, year, youTubeId } = song;
        
        // Check if song already exists in the selected playlist
        try {
            const response = await storeRequestSender.getPlaylistById(playlistId);
            if (response.status === 200) {
                const data = await response.json();
                if (data.success && data.playlist && data.playlist.songs) {
                    const songExists = data.playlist.songs.some(existingSong => {
                        // Check by YouTube ID first
                        if (existingSong.youTubeId && youTubeId === existingSong.youTubeId) {
                            return true;
                        }
                        // Check by title and artist (case insensitive)
                        if (existingSong.title && existingSong.artist) {
                            return existingSong.title.toLowerCase() === title.toLowerCase() && 
                                   existingSong.artist.toLowerCase() === artist.toLowerCase();
                        }
                        return false;
                    });
                    
                    if (songExists) {
                        setErrorMessage('This song already exists in the selected playlist');
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('Error checking playlist for duplicates:', error);
            // Continue with adding the song even if we can't check
        }
        
        const result = await store.addSongToPlaylist(playlistId, { title, artist, year, youTubeId });
        
        if (!result?.success) {
            setErrorMessage('Failed to add song to playlist. Please try again.');
            return;
        }
        
        setPlaylistCountVal(
            result.playlistCount !== undefined 
                ? result.playlistCount 
                : prev => (prev || 0) + 1
        );
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
    const userEmail = auth?.user?.email?.trim().toLowerCase() ?? '';
    const songOwnerEmail = song?.ownerEmail?.trim().toLowerCase() ?? '';
    const isSongOwnedByUser = !!(userEmail && songOwnerEmail && userEmail === songOwnerEmail);

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
    function handleCopySong(event) {
        event.stopPropagation();
        if (!auth || !auth.loggedIn) {
            console.error("Must be logged in to copy a song.");
            return;
        }
        handleCloseAllMenus();
        
        const copiedSong = {
            title: song.title + ' (Copy)',
            artist: song.artist,
            year: song.year,
            youTubeId: song.youTubeId
        };
        store.addCreateSongTransaction(index + 1, copiedSong.title, copiedSong.artist, copiedSong.year, copiedSong.youTubeId);
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
                        {isEditable && (
                            <MenuItem onClick={handleCopySong}>Copy Song</MenuItem>
                        )}
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

            {errorMessage && (
                <div className='text-red-500 text-sm mt-1 text-center'>
                    {errorMessage}
                </div>
            )}

        </div>
    );
}

export default SongCard;