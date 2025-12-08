import { useContext } from 'react'
import { GlobalStoreContext } from '../store'
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import RedoIcon from '@mui/icons-material/Redo';
import UndoIcon from '@mui/icons-material/Undo';
import CloseIcon from '@mui/icons-material/HighlightOff';

/*
    This toolbar is a functional React component that
    manages the undo/redo/close buttons.
    
    @author McKilla Gorilla
*/
function EditToolbar() {
    const { store } = useContext(GlobalStoreContext);

    function handleAddNewSong() {
        store.addNewSong();
    }
    function handleUndo() {
        store.undo();
    }
    function handleRedo() {
        store.redo();
    }
    function handleCancel() {
        store.deleteList(store.currentList._id);
        store.setIsEditingPlaylist(false);
    }
    function handleSave() {
        store.closeCurrentList();
    }
    return (
        <div id="edit-toolbar">
            <Button
                disabled={!store.canAddNewSong()}
                id='add-song-button'
                onClick={handleAddNewSong}
                variant="contained">
                <AddIcon />
            </Button>
            <Button
                disabled={!store.canUndo()}
                id='undo-button'
                onClick={handleUndo}
                variant="contained">
                <UndoIcon />
            </Button>
            <Button
                disabled={!store.canRedo()}
                id='redo-button'
                onClick={handleRedo}
                variant="contained">
                <RedoIcon />
            </Button>
            <Button
                disabled={!store.canClose()}
                id='complete-button'
                onClick={handleSave}
                variant="contained">
                {store.isNewPlaylist ? 'Complete' : 'Close'}
            </Button>
            {!store.isNewPlaylist ? '' : <Button
                disabled={!store.canClose()}
                id='cancel-button'
                onClick={handleCancel}
                variant="contained">
                Cancel
            </Button>
            }
        </div>
    )
}

export default EditToolbar;