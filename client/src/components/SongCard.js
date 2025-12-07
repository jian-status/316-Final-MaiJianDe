import { useContext } from 'react'
import { GlobalStoreContext } from '../store'
import Button from '@mui/material/Button';

function SongCard(props) {
    const { store } = useContext(GlobalStoreContext);
    const { song, index, isEditable = false } = props;

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
    function handleRemoveSong(event) {
        store.addRemoveSongTransaction(song, index);
    }
    function handleClick(event) {
        console.log("clicking on song card " + index);
        // DOUBLE CLICK IS FOR SONG EDITING
        if (event.detail === 2) {
            console.log("double clicked");
            store.showEditSongModal(index, song);
        }
    }

    let cardClass = "list-card unselected-list-card";
    return (
        <div
            key={index}
            id={'song-' + index + '-card'}
            className={cardClass}
            onDragStart={isEditable ? handleDragStart : null}
            onDragOver={isEditable ? handleDragOver: null}
            onDragEnter={isEditable ? handleDragEnter : null}
            onDragLeave={isEditable ? handleDragLeave : null}
            onDrop={isEditable ? handleDrop : null}
            draggable={isEditable}
            onClick={isEditable ? handleClick : null}
        >
            {isEditable ? '' : index + 1}
            <a
                id={'song-' + index + '-link'}
                className="song-link"
                href={"https://www.youtube.com/watch?v=" + song.youTubeId}>
                {song.title} ({song.year}) by {song.artist}
            </a>
            {isEditable || (
            <Button
                sx={{transform:"translate(-5%, -5%)", width:"5px", height:"30px"}}
                variant="contained"
                id={"remove-song-" + index}
                className="list-card-button"
                onClick={handleRemoveSong}>{"\u2715"}</Button>
            )}
            <div className='flex justify-between text-sm'>
                <p>Listens: {song.listens}</p>
                <p>Playlists: {song.playlistCount}</p>
            </div>

        </div>
    );
}

export default SongCard;