import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import SongCard from './SongCard.js'
import MUIEditSongModal from './MUIEditSongModal'
import MUIDeleteSongModal from './MUIDeleteSongModal'
//import MUIRemoveSongModal from './MUIRemoveSongModal'
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import { GlobalStoreContext } from '../store/index.js'
/*
    This React component lets us edit a loaded list, which only
    happens when we are on the proper route.
    
    @author McKilla Gorilla
*/
export default function WorkspaceScreen() {
    const { store } = useContext(GlobalStoreContext);
    store.history = useNavigate();

    let modalJSX = "";
    if (store.isEditSongModalOpen()) {
        modalJSX = <MUIEditSongModal />;
    }
    // When closing this screen, there is a brief moment where store.currentList becomes null 
    // but we have not yet navigated away    
    if (!store.currentList) return null;

    return (
        <Box id="list-selector-list">
        <List 
            id="playlist-cards" 
            sx={{overflow: 'scroll', height: '87%', width: '100%', bgcolor: '#8000F00F'}}
        >
            {
                store.currentList.songs.map((song, index) => {
                    const songKey = `${index}-${song.youTubeId || 'unknown'}`;
                    return (
                        <SongCard
                            id={'playlist-song-' + songKey}
                            key={'playlist-song-' + songKey}
                            index={index}
                            song={song}
                            isEditable={true}
                        />
                    )
                })
            }
         </List>            
         { modalJSX }
         <MUIDeleteSongModal />
         </Box>
    )
}