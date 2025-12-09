import { useContext } from 'react'
import GlobalStoreContext from '../store';
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

export default function MUIDeleteModal() {
    const { store } = useContext(GlobalStoreContext);
    let name = "";
    if (store.listMarkedForDeletion) {
        name = store.listMarkedForDeletion.name;
    }
    function handleDeleteList(event) {
        store.deleteMarkedList();
    }
    function handleCloseModal(event) {
        store.hideModals();
    }

    return (
        <Modal
        open={store.listMarkedForDeletion !== null}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        >
        <Box sx={style1} className="bg-stone-300">
            <div id="delete-playlist-modal" data-animation="slideInOutLeft">
                <Typography sx={{fontWeight: 'bold'}} id="delete-playlist-modal-title" variant="h4" component="h2">
                    Delete Playlist
                </Typography>
                <Divider sx={{borderBottomWidth: 5, p: '5px', transform: 'translate(-5.5%, 0%)', width:377}}/>
                <Typography sx={{mt: "10px", color: "#702963", fontWeight:"bold", fontSize:"30px"}} id="modal-modal-title" variant="h6" component="h2">
                    Are you sure you want to delete the <span style={{textDecoration: 'underline', color: '#820747CF'}}>{name}</span> playlist?
                </Typography>
                <div className='flex gap-4'>
                    <Button 
                        sx={{ bgcolor: '#9333ea', color: 'white', '&:hover': { bgcolor: '#7c3aed' }, fontSize: 13, fontWeight: 'bold', mt:"20px", px: 5, py: 1}} variant="contained" 
                        id="delete-playlist-confirm-button" onClick={handleDeleteList}>Confirm</Button>
                    <Button 
                        sx={{ bgcolor: '#9333ea', color: 'white', '&:hover': { bgcolor: '#7c3aed' }, fontSize: 13, fontWeight: 'bold', mt:"20px", px: 5, py: 1}} variant="contained" 
                        id="delete-playlist-cancel-button" onClick={handleCloseModal}>Cancel</Button>
                </div>
            </div>
        </Box>
    </Modal>
    );
}