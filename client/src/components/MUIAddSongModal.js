import { useContext, useState, useEffect } from 'react'
import GlobalStoreContext from '../store';
import AuthContext from '../auth';
import storeRequestSender from '../store/requests';
import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

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

export default function MUIAddSongModal() {
    const { store } = useContext(GlobalStoreContext);
    const { auth } = useContext(AuthContext);
    const [ title, setTitle ] = useState('');
    const [ artist, setArtist ] = useState('');
    const [ year, setYear ] = useState('');
    const [ youTubeId, setYouTubeId ] = useState('');
    const [ selectedPlaylistId, setSelectedPlaylistId ] = useState('');
    const [ errorMessage, setErrorMessage ] = useState('');

    useEffect(() => {
        // Load playlists when modal opens
        if (store.currentModal === "ADD_SONG" && (!store.idNamePairs || store.idNamePairs.length === 0)) {
            try { store.loadIdNamePairs(); } catch (err) { }
        }
        // Reset form when modal opens
        if (store.currentModal === "ADD_SONG") {
            setTitle('');
            setArtist('');
            setYear('');
            setYouTubeId('');
            setSelectedPlaylistId('');
            setErrorMessage('');
        }
    }, [store.currentModal, store]);

    const handleConfirmAddSong = async () => {
        setErrorMessage(''); // Clear any previous error
        
        if (!selectedPlaylistId) {
            setErrorMessage('Please select a playlist');
            return;
        }
        if (!title.trim()) {
            setErrorMessage('Please enter a song title');
            return;
        }
        if (!artist.trim()) {
            setErrorMessage('Please enter an artist name');
            return;
        }
        if (!youTubeId.trim()) {
            setErrorMessage('Please enter a YouTube ID');
            return;
        }
        if (year.trim() && isNaN(Number(year.trim()))) {
            setErrorMessage('Year must be a valid number');
            return;
        }

        // Check if song already exists in the selected playlist
        try {
            const response = await storeRequestSender.getPlaylistById(selectedPlaylistId);
            if (response.status === 200) {
                const data = await response.json();
                if (data.success && data.playlist && data.playlist.songs) {
                    const songExists = data.playlist.songs.some(song => {
                        // Check by YouTube ID first
                        if (song.youTubeId && youTubeId.trim() === song.youTubeId) {
                            return true;
                        }
                        // Check by title and artist (case insensitive)
                        if (song.title && song.artist) {
                            return song.title.toLowerCase() === title.trim().toLowerCase() && 
                                   song.artist.toLowerCase() === artist.trim().toLowerCase();
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
            console.error('Error checking playlist:', error);
            // Continue with adding the song even if we can't check
        }

        let newSongData = {
            title: title.trim(),
            artist: artist.trim(),
            year: year.trim(),
            youTubeId: youTubeId.trim()
        };

        const result = await store.addSongToPlaylist(selectedPlaylistId, newSongData);
        if (result && result.success) {
            store.hideModals();
            setTitle('');
            setArtist('');
            setYear('');
            setYouTubeId('');
            setSelectedPlaylistId('');
            setErrorMessage('');
        } else {
            setErrorMessage('Failed to add song to playlist. Please try again.');
        }
    }

    const handleCancelAddSong = () => {
        store.hideModals();
    }

    const handleUpdateTitle = (event) => {
        setTitle(event.target.value);
    }

    const handleUpdateArtist = (event) => {
        setArtist(event.target.value);
    }

    const handleUpdateYear = (event) => {
        setYear(event.target.value);
    }

    const handleUpdateYouTubeId = (event) => {
        setYouTubeId(event.target.value);
    }

    const handlePlaylistChange = (event) => {
        setSelectedPlaylistId(event.target.value);
    }

    // Get user's playlists for the dropdown
    const userPlaylists = store.idNamePairs?.filter(pair => pair.ownerEmail === auth.user.email) ?? [];

    return (
        <Modal
            open={store.currentModal === "ADD_SONG"}
            onClose={() => {}} // Prevent accidental closing
            disableEscapeKeyDown={true}
            disableBackdropClick={true}
        >
        <Box sx={style1} className="bg-stone-300">
            <div id="add-song-modal" data-animation="slideInOutLeft">
            <Typography
                sx={{fontWeight: 'bold'}}
                id="add-song-modal-title" variant="h4" component="h2">
                Add Song
            </Typography>
            <Divider sx={{borderBottomWidth: 5, p: '5px', transform: 'translate(-5.5%, 0%)', width:377}}/>

            <Typography
                sx={{mt: "10px", color: "#702963", fontWeight:"bold", fontSize:"30px"}}
                id="modal-modal-title" variant="h6" component="h2">
                Title: <input id="add-song-modal-title-textfield" className='modal-textfield px-2' type="text" value={title} onChange={handleUpdateTitle} />
            </Typography>
            <Typography
                sx={{color: "#702963", fontWeight:"bold", fontSize:"30px"}}
                id="modal-modal-artist" variant="h6" component="h2">
                Artist: <input id="add-song-modal-artist-textfield" className='modal-textfield px-2' type="text" value={artist} onChange={handleUpdateArtist} />
            </Typography>
            <Typography
                sx={{color: "#702963", fontWeight:"bold", fontSize:"30px"}}
                id="modal-modal-year" variant="h6" component="h2">
                Year: <input id="add-song-modal-year-textfield" className='modal-textfield px-2' type="text" value={year} onChange={handleUpdateYear} />
            </Typography>
            <Typography
                sx={{color: "#702963", fontWeight:"bold", fontSize:"25px"}}
                id="modal-modal-youTubeId" variant="h6" component="h2">
                YouTubeId: <input id="add-song-modal-youTubeId-textfield" className='modal-textfield px-2' type="text" value={youTubeId} onChange={handleUpdateYouTubeId} />
            </Typography>

            <Typography
                sx={{color: "#702963", fontWeight:"bold", fontSize:"25px", mt: "10px"}}
                variant="h6" component="h2">
                Add to Playlist:
            </Typography>
            {userPlaylists.length === 0 ? (
                <Typography sx={{ mt: 1, color: "#FF0000" }}>
                    You don't have any playlists to add to.
                </Typography>
            ) : (
                <FormControl fullWidth sx={{ mt: 1 }}>
                    <InputLabel id="playlist-select-label">Select Playlist</InputLabel>
                    <Select
                        labelId="playlist-select-label"
                        id="playlist-select"
                        value={selectedPlaylistId}
                        label="Select Playlist"
                        onChange={handlePlaylistChange}
                    >
                        {userPlaylists.map((playlist) => (
                            <MenuItem key={playlist._id} value={playlist._id}>
                                {playlist.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            {errorMessage && (
                <Typography sx={{ mt: 2, color: "#FF0000", fontSize: "16px", fontWeight: "bold", textAlign: "center", backgroundColor: "#FFEBEE", padding: "8px", borderRadius: "4px", border: "1px solid #FF0000" }}>
                    {errorMessage}
                </Typography>
            )}

            <div className='flex gap-4'>
                <Button
                    sx={{ bgcolor: '#9333ea', color: 'white', '&:hover': { bgcolor: '#7c3aed' }, fontSize: 13, fontWeight: 'bold', mt:"20px", px: 5, py: 1}} variant="contained"
                    id="add-song-confirm-button" onClick={handleConfirmAddSong}>Confirm</Button>
                <Button
                    sx={{ bgcolor: '#9333ea', color: 'white', '&:hover': { bgcolor: '#7c3aed' }, fontSize: 13, fontWeight: 'bold', mt:"20px", px: 5, py: 1}} variant="contained"
                    id="add-song-cancel-button" onClick={handleCancelAddSong}>Cancel</Button>
            </div>
            </div>
        </Box>
        </Modal>
    );
}