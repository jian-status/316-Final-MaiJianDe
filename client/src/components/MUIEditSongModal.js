import { useContext, useState } from 'react'
import GlobalStoreContext from '../store';
import AuthContext from '../auth';
import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

const style1 = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    border: '3px solid #000',
    padding: '20px',
    boxShadow: 24,
    width: '515px',
};

export default function MUIEditSongModal() {
    const { store } = useContext(GlobalStoreContext);
    const { auth } = useContext(AuthContext);
    const [ title, setTitle ] = useState('');
    const [ artist, setArtist ] = useState('');
    const [ year, setYear ] = useState('');
    const [ youTubeId, setYouTubeId ] = useState('');

    React.useEffect(() => {
        if (store && store.currentSong) {
            setTitle(store.currentSong.title || '');
            setArtist(store.currentSong.artist || '');
            setYear(store.currentSong.year || '');
            setYouTubeId(store.currentSong.youTubeId || '');
        }
    }, [store.currentSong]);

    const songOwnerEmail = store && store.currentSong ? store.currentSong.ownerEmail : null;
    const playlistOwnerEmail = store && store.currentList ? store.currentList.ownerEmail : null;
    const isSongOwnedByUser = auth && auth.user && ((songOwnerEmail && songOwnerEmail === auth.user.email) || (!songOwnerEmail && playlistOwnerEmail === auth.user.email));

    function handleConfirmEditSong() {
        let newSongData = {
            title: title,
            artist: artist,
            year: year,
            youTubeId: youTubeId
        };
        if (!isSongOwnedByUser) {
            console.warn('User does not own this playlist/song; edit not allowed');
            store.hideModals();
            return;
        }

        if (store.currentList?.songs) {
            const { title, artist, youTubeId } = newSongData;
            const isDuplicate = store.currentList.songs.some((song, index) => 
                store.currentSongIndex !== index && 
                song.title === title && 
                song.artist === artist && 
                song.youTubeId === youTubeId
            );

            if (isDuplicate) {
                alert('A song with the same title, artist, and YouTube ID already exists in this playlist.');
                return;
            }
        }
        if (store.currentSongIndex === -1) {
            // Adding a new song
            store.addCreateSongTransaction(store.currentList.songs.length, newSongData.title, newSongData.artist, newSongData.year, newSongData.youTubeId);
        } else {
            // Updating an existing song
            store.addUpdateSongTransaction(store.currentSongIndex, newSongData);
        }
        store.hideModals();
    }

    function handleCancelEditSong() {
        store.hideModals();
    }

    function handleUpdateTitle(event) {
        setTitle(event.target.value);
    }

    function handleUpdateArtist(event) {
        setArtist(event.target.value);
    }

    function handleUpdateYear(event) {
        setYear(event.target.value);
    }

    function handleUpdateYouTubeId(event) {
        setYouTubeId(event.target.value);
    }

    return (
        <Modal
            open={store.currentModal === "EDIT_SONG"}
        >
        <Box sx={style1} className="bg-stone-300">
            <div id="edit-song-modal" data-animation="slideInOutLeft">
            <Typography 
                sx={{fontWeight: 'bold'}} 
                id="edit-song-modal-title" variant="h4" component="h2">
                Edit Song
            </Typography>
            <Divider sx={{borderBottomWidth: 5, p: '5px', transform: 'translate(-5.5%, 0%)', width:377}}/>
                <Typography 
                sx={{mt: "10px", color: "#702963", fontWeight:"bold", fontSize:"30px"}} 
                id="modal-modal-title" variant="h6" component="h2">
                Title: <input id="edit-song-modal-title-textfield" className='modal-textfield px-2' type="text" value={title} onChange={handleUpdateTitle} readOnly={!isSongOwnedByUser} />
            </Typography>
            <Typography 
                sx={{color: "#702963", fontWeight:"bold", fontSize:"30px"}} 
                id="modal-modal-artist" variant="h6" component="h2">
                Artist: <input id="edit-song-modal-artist-textfield" className='modal-textfield px-2' type="text" value={artist} onChange={handleUpdateArtist} readOnly={!isSongOwnedByUser} />
            </Typography>
            <Typography 
                sx={{color: "#702963", fontWeight:"bold", fontSize:"30px"}} 
                id="modal-modal-year" variant="h6" component="h2">
                Year: <input id="edit-song-modal-year-textfield" className='modal-textfield px-2' type="text" value={year} onChange={handleUpdateYear} readOnly={!isSongOwnedByUser} />
            </Typography>
            <Typography 
                sx={{color: "#702963", fontWeight:"bold", fontSize:"25px"}} 
                id="modal-modal-youTubeId" variant="h6" component="h2">
                YouTubeId: <input id="edit-song-modal-youTubeId-textfield" className='modal-textfield px-2' type="text" value={youTubeId} onChange={handleUpdateYouTubeId} readOnly={!isSongOwnedByUser} />
            </Typography>
            <div className='flex gap-4'>
                <Button 
                    sx={{ bgcolor: '#9333ea', color: 'white', '&:hover': { bgcolor: '#7c3aed' }, fontSize: 13, fontWeight: 'bold', mt:"20px", px: 5, py: 1}} variant="contained" 
                    id="edit-song-confirm-button" onClick={handleConfirmEditSong} disabled={!isSongOwnedByUser}>Confirm</Button>
                <Button 
                    sx={{ bgcolor: '#9333ea', color: 'white', '&:hover': { bgcolor: '#7c3aed' }, fontSize: 13, fontWeight: 'bold', mt:"20px", px: 5, py: 1}} variant="contained" 
                    id="edit-song-confirm-button" onClick={handleCancelEditSong}>Cancel</Button>
            {!isSongOwnedByUser && (
                <Typography sx={{mt: "10px", color: "#FF0000", fontWeight:"bold"}} id="edit-song-not-allowed">
                    You do not own this playlist/song and cannot edit it.
                </Typography>
            )}

            </div>
            </div>
        </Box>
        </Modal>
    );
}