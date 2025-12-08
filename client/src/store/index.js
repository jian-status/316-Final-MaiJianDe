import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {jsTPS} from "jstps"
import storeRequestSender from './requests'
import CreateSong_Transaction from '../transactions/CreateSong_Transaction'
import MoveSong_Transaction from '../transactions/MoveSong_Transaction'
import RemoveSong_Transaction from '../transactions/RemoveSong_Transaction'
import UpdateSong_Transaction from '../transactions/UpdateSong_Transaction'
import AuthContext from '../auth'
import ChangePlaylistName_Transaction from '../transactions/ChangePlaylistName_Transaction'

/*
    This is our global data store. Note that it uses the Flux design pattern,
    which makes use of things like actions and reducers. 
    
    @author McKilla Gorilla
*/

// THIS IS THE CONTEXT WE'LL USE TO SHARE OUR STORE
export const GlobalStoreContext = createContext({});
// GlobalStoreContext created

// THESE ARE ALL THE TYPES OF UPDATES TO OUR GLOBAL
// DATA STORE STATE THAT CAN BE PROCESSED
export const GlobalStoreActionType = {
    CHANGE_LIST_NAME: "CHANGE_LIST_NAME",
    CLOSE_CURRENT_LIST: "CLOSE_CURRENT_LIST",
    CREATE_NEW_LIST: "CREATE_NEW_LIST",
    LOAD_ID_NAME_PAIRS: "LOAD_ID_NAME_PAIRS",
    MARK_LIST_FOR_DELETION: "MARK_LIST_FOR_DELETION",
    SET_CURRENT_LIST: "SET_CURRENT_LIST",
    SET_LIST_NAME_EDIT_ACTIVE: "SET_LIST_NAME_EDIT_ACTIVE",
    EDIT_SONG: "EDIT_SONG",
    REMOVE_SONG: "REMOVE_SONG",
    HIDE_MODALS: "HIDE_MODALS",
    CLEAR_CURRENT_LIST: "CLEAR_CURRENT_LIST",
    CLEAR_STORE: "CLEAR_STORE"
}

// WE'LL NEED THIS TO PROCESS TRANSACTIONS
const tps = new jsTPS();
// Expose tps on store for transaction access

const CurrentModal = {
    NONE : "NONE",
    DELETE_LIST : "DELETE_LIST",
    EDIT_SONG : "EDIT_SONG",
    ERROR : "ERROR"
}

// WITH THIS WE'RE MAKING OUR GLOBAL DATA STORE
// AVAILABLE TO THE REST OF THE APPLICATION
function GlobalStoreContextProvider(props) {
    // THESE ARE ALL THE THINGS OUR DATA STORE WILL MANAGE
    const [store, setStore] = useState({
        currentModal : CurrentModal.NONE,
        idNamePairs: [],
        currentList: null,
        currentSongIndex : -1,
        currentSong : null,
        newListCounter: 0,
        listNameActive: false,
        listIdMarkedForDeletion: null,
        isNewPlaylist: false,
        listMarkedForDeletion: null,
        isEditingPlaylist: false
    });
        // Setter for isEditingPlaylist state
        store.setIsEditingPlaylist = function (value) {
            setStore(prev => ({ ...prev, isEditingPlaylist: value }));
        }
    const navigate = useNavigate();

    // inside useGlobalStore

    // SINCE WE'VE WRAPPED THE STORE IN THE AUTH CONTEXT WE CAN ACCESS THE USER HERE
    const { auth } = useContext(AuthContext);
    // debug: auth context

    // HERE'S THE DATA STORE'S REDUCER, IT MUST
    // HANDLE EVERY TYPE OF STATE CHANGE
    const storeReducer = (action) => {
        const { type, payload } = action;
        switch (type) {
            // LIST UPDATE OF ITS NAME
            case GlobalStoreActionType.CHANGE_LIST_NAME: {
                return setStore(prev => ({
                    ...prev,
                    currentModal : CurrentModal.NONE,
                    idNamePairs: payload.idNamePairs,
                    currentList: payload.playlist,
                    currentSongIndex: -1,
                    currentSong: null,
                    newListCounter: store.newListCounter,
                    listNameActive: false,
                    listIdMarkedForDeletion: null,
                    listMarkedForDeletion: null
                }));
            }
            // STOP EDITING THE CURRENT LIST
            case GlobalStoreActionType.CLOSE_CURRENT_LIST: {
                return setStore({
                    ...store,
                    currentModal : CurrentModal.NONE,
                    idNamePairs: store.idNamePairs,
                    currentList: null,
                    currentSongIndex: -1,
                    currentSong: null,
                    newListCounter: store.newListCounter,
                    listNameActive: false,
                    listIdMarkedForDeletion: null,
                    listMarkedForDeletion: null
                })
            }
            // CREATE A NEW LIST
            case GlobalStoreActionType.CREATE_NEW_LIST: {                
                return setStore({
                    ...store,
                    currentModal : CurrentModal.NONE,
                    idNamePairs: store.idNamePairs,
                    currentList: payload,
                    currentSongIndex: -1,
                    currentSong: null,
                    newListCounter: store.newListCounter + 1,
                    listNameActive: false,
                    listIdMarkedForDeletion: null,
                    listMarkedForDeletion: null
                })
            }
            // GET ALL THE LISTS SO WE CAN PRESENT THEM
            case GlobalStoreActionType.LOAD_ID_NAME_PAIRS: {
                return setStore({
                    ...store,
                    currentModal : CurrentModal.NONE,
                    idNamePairs: payload,
                    currentList: null,
                    currentSongIndex: -1,
                    currentSong: null,
                    newListCounter: store.newListCounter,
                    listNameActive: false,
                    listIdMarkedForDeletion: null,
                    listMarkedForDeletion: null,
                    isEditingPlaylist: false
                });
            }
            // PREPARE TO DELETE A LIST
            case GlobalStoreActionType.MARK_LIST_FOR_DELETION: {
                return setStore({
                    ...store,
                    currentModal : CurrentModal.DELETE_LIST,
                    idNamePairs: store.idNamePairs,
                    currentList: null,
                    currentSongIndex: -1,
                    currentSong: null,
                    newListCounter: store.newListCounter,
                    listNameActive: false,
                    listIdMarkedForDeletion: payload.id,
                    listMarkedForDeletion: payload.playlist
                });
            }
            // UPDATE A LIST
            case GlobalStoreActionType.SET_CURRENT_LIST: {
                return setStore({
                    ...store,
                    currentModal : CurrentModal.NONE,
                    idNamePairs: store.idNamePairs,
                    currentList: payload,
                    currentSongIndex: -1,
                    currentSong: null,
                    newListCounter: store.newListCounter,
                    listNameActive: false,
                    listIdMarkedForDeletion: null,
                    listMarkedForDeletion: null
                });
            }
            // START EDITING A LIST NAME
            case GlobalStoreActionType.SET_LIST_NAME_EDIT_ACTIVE: {
                return setStore({
                    ...store,
                    currentModal : CurrentModal.NONE,
                    idNamePairs: store.idNamePairs,
                    currentList: payload,
                    currentSongIndex: -1,
                    currentSong: null,
                    newListCounter: store.newListCounter,
                    listNameActive: true,
                    listIdMarkedForDeletion: null,
                    listMarkedForDeletion: null
                });
            }
            // 
            case GlobalStoreActionType.EDIT_SONG: {
                return setStore({
                    ...store,
                    currentModal : CurrentModal.EDIT_SONG,
                    idNamePairs: store.idNamePairs,
                    currentList: store.currentList,
                    currentSongIndex: payload.currentSongIndex,
                    currentSong: payload.currentSong,
                    newListCounter: store.newListCounter,
                    listNameActive: false,
                    listIdMarkedForDeletion: null,
                    listMarkedForDeletion: null
                });
            }
            case GlobalStoreActionType.REMOVE_SONG: {
                return setStore({
                    ...store,
                    currentModal : CurrentModal.NONE,
                    idNamePairs: store.idNamePairs,
                    currentList: store.currentList,
                    currentSongIndex: payload.currentSongIndex,
                    currentSong: payload.currentSong,
                    newListCounter: store.newListCounter,
                    listNameActive: false,
                    listIdMarkedForDeletion: null,
                    listMarkedForDeletion: null
                });
            }
            case GlobalStoreActionType.HIDE_MODALS: {
                return setStore({
                    ...store,
                    currentModal : CurrentModal.NONE,
                    idNamePairs: store.idNamePairs,
                    currentList: store.currentList,
                    currentSongIndex: -1,
                    currentSong: null,
                    newListCounter: store.newListCounter,
                    listNameActive: false,
                    listIdMarkedForDeletion: null,
                    listMarkedForDeletion: null
                });
            }
            case GlobalStoreActionType.CLEAR_CURRENT_LIST: {
                return setStore({
                    ...store,
                    currentModal : CurrentModal.NONE,
                    idNamePairs: store.idNamePairs,
                    currentList: null,
                    currentSongIndex: -1,
                    currentSong: null,
                    newListCounter: store.newListCounter,
                    listNameActive: false,
                    listIdMarkedForDeletion: null,
                    listMarkedForDeletion: null
                });
            }
            case GlobalStoreActionType.CLEAR_STORE: {
                return setStore({
                    ...store,
                    currentModal : CurrentModal.NONE,
                    idNamePairs: [],
                    currentList: null,
                    currentSongIndex: -1,
                    currentSong: null,
                    newListCounter: 0,
                    listNameActive: false,
                    listIdMarkedForDeletion: null,
                    listMarkedForDeletion: null
                });
            }
            default:
                return store;
        }
    }

    store.tryAcessingOtherAccountPlaylist = function(){
        let id = "635f203d2e072037af2e6284";
        async function asyncSetCurrentList(id) {
            let response = await storeRequestSender.getPlaylistById(id);
            if (response.status === 200) {
                const data = await response.json();
                if (data.success) {
                    let playlist = data.playlist;
                    storeReducer({
                        type: GlobalStoreActionType.SET_CURRENT_LIST,
                        payload: playlist
                    });
                }
            }
        }
        asyncSetCurrentList(id);
        navigate("/playlist/635f203d2e072037af2e6284");
    }

    store.setListName = function (id, newName) {
        if (this.currentList.name !== newName) {
            // Use transaction for undo/redo
            const oldName = this.currentList.name;
            let transaction = new ChangePlaylistName_Transaction(store, id, oldName, newName);
            tps.processTransaction(transaction);
        }
    }
    // THESE ARE THE FUNCTIONS THAT WILL UPDATE OUR STORE AND
    // DRIVE THE STATE OF THE APPLICATION. WE'LL CALL THESE IN 
    // RESPONSE TO EVENTS INSIDE OUR COMPONENTS.

    // THIS FUNCTION PROCESSES CHANGING A LIST NAME
    store.changeListName = function (id, newName) {
        // GET THE LIST
        async function asyncChangeListName(id) {
            let response = await storeRequestSender.getPlaylistById(id);
            if (response.status === 200) {
                const data = await response.json();
                if (data.success) {
                    let playlist = data.playlist;
                    playlist.name = newName;
                    async function updateList(playlist) {
                        response = await storeRequestSender.updatePlaylistById(playlist._id, playlist);
                        if (response.status === 200) {
                            const updateData = await response.json();
                            if (updateData.success) {
                                async function getListPairs(playlist) {
                                    response = await storeRequestSender.getPlaylistPairs();
                                    if (response.status === 200) {
                                        const pairsData = await response.json();
                                        if (pairsData.success) {
                                            let pairsArray = pairsData.idNamePairs;
                                            storeReducer({
                                                type: GlobalStoreActionType.CHANGE_LIST_NAME,
                                                payload: {
                                                    idNamePairs: pairsArray,
                                                    playlist: playlist
                                                }
                                            });
                                            store.setCurrentList(id);
                                        }
                                    }
                                }
                                getListPairs(playlist);
                            }
                        }
                    }
                    updateList(playlist);
                }
            }
        }
        asyncChangeListName(id);
    }

    // THIS FUNCTION PROCESSES CLOSING THE CURRENTLY LOADED LIST
    store.closeCurrentList = function () {
        storeReducer({
            type: GlobalStoreActionType.CLOSE_CURRENT_LIST,
            payload: {}
        });
        tps.clearAllTransactions();
        setStore(prev => ({ ...prev, isNewPlaylist: false, isEditingPlaylist: false }));
        navigate("/");
    }

    // THIS FUNCTION CLEARS ALL STORE DATA (for user logout/login)
    store.clearStore = function () {
        storeReducer({
            type: GlobalStoreActionType.CLEAR_STORE,
            payload: {}
        });
        tps.clearAllTransactions();
    }

    // THIS FUNCTION CREATES A NEW LIST
    store.createNewList = async function () {

        let newListName = "Untitled" + store.newListCounter;
        // Ensure that a user is logged in before trying to use their email
        if (!auth || !auth.user || !auth.loggedIn) {
            console.error("Unauthenticated users cannot create playlist.");
            return;
        }
        const response = await storeRequestSender.createPlaylist(newListName, [], auth.user.email);
        // createNewList response handled
        if (response.status === 201) {
            const data = await response.json();
            tps.clearAllTransactions();
            let newList = data.playlist;
            if (!newList.songs) {
                newList.songs = [];
            }
            storeReducer({
                type: GlobalStoreActionType.CREATE_NEW_LIST,
                payload: newList
            });
            setStore(prev => ({ ...prev, isNewPlaylist: true, isEditingPlaylist: true }));
        }
        else {
            console.error("FAILED TO CREATE A NEW LIST");
        }
    }
    store.createNewListFromCopy = async function (listName, songs) {
        const response = await storeRequestSender.createPlaylist(listName, songs, auth.user.email);
        if (response.status === 201) {
            const data = await response.json();
            tps.clearAllTransactions();
        }
    }
    // THIS FUNCTION LOADS ALL THE ID, NAME PAIRS SO WE CAN LIST ALL THE LISTS
    store.loadIdNamePairs = function () {
        async function asyncLoadIdNamePairs() {
            const response = await storeRequestSender.getPlaylistPairs();
            if (response.status === 200) {
                const data = await response.json();
                if (data.success) {
                    let pairsArray = data.idNamePairs;
                    // idNamePairs loaded
                    storeReducer({
                        type: GlobalStoreActionType.LOAD_ID_NAME_PAIRS,
                        payload: pairsArray
                    });
                }
                else {
                    console.error("FAILED TO GET THE LIST PAIRS");
                }
            }
            else {
                console.error("Error:", response.errorMessage);
            }
        }
        asyncLoadIdNamePairs();
    }

    // THE FOLLOWING 5 FUNCTIONS ARE FOR COORDINATING THE DELETION
    // OF A LIST, WHICH INCLUDES USING A VERIFICATION MODAL. THE
    // FUNCTIONS ARE markListForDeletion, deleteList, deleteMarkedList,
    // showDeleteListModal, and hideDeleteListModal
    store.markListForDeletion = function (id) {
        async function getListToDelete(id) {
            let response = await storeRequestSender.getPlaylistById(id);
            if (response.status === 200) {
                const data = await response.json();
                if (data.success) {
                    let playlist = data.playlist;
                    storeReducer({
                        type: GlobalStoreActionType.MARK_LIST_FOR_DELETION,
                        payload: {id: id, playlist: playlist}
                    });
                }
            }
        }
        getListToDelete(id);
    }
    store.deleteList = function (id) {
        async function processDelete(id) {
            let response = await storeRequestSender.deletePlaylistById(id);
            if (response.status === 200) {
                store.loadIdNamePairs();
                setStore(prev => ({ ...prev, isNewPlaylist: false }));
            }
        }
        processDelete(id);
    }
    store.deleteMarkedList = function() {
        store.deleteList(store.listIdMarkedForDeletion);
        store.hideModals();
    }
    // THIS FUNCTION SHOWS THE MODAL FOR PROMPTING THE USER
    // TO SEE IF THEY REALLY WANT TO DELETE THE LIST

    store.showEditSongModal = (songIndex, songToEdit) => {
        storeReducer({
            type: GlobalStoreActionType.EDIT_SONG,
            payload: {currentSongIndex: songIndex, currentSong: songToEdit}
        });        
    }
    store.hideModals = () => {
        auth.errorMessage = null;
        storeReducer({
            type: GlobalStoreActionType.HIDE_MODALS,
            payload: {}
        });    
    }
    store.isDeleteListModalOpen = () => {
        return store.currentModal === CurrentModal.DELETE_LIST;
    }
    store.isEditSongModalOpen = () => {
        return store.currentModal === CurrentModal.EDIT_SONG;
    }
    store.isErrorModalOpen = () => {
        return store.currentModal === CurrentModal.ERROR;
    }

    // THE FOLLOWING 8 FUNCTIONS ARE FOR COORDINATING THE UPDATING
    // OF A LIST, WHICH INCLUDES DEALING WITH THE TRANSACTION STACK. THE
    // FUNCTIONS ARE setCurrentList, addMoveItemTransaction, addUpdateItemTransaction,
    // moveItem, updateItem, updateCurrentList, undo, and redo
    store.setCurrentList = function (id) {
        async function asyncSetCurrentList(id) {
            try {
                let response = await storeRequestSender.getPlaylistById(id);
                if (response.status === 200) {
                    const data = await response.json();
                    if (data.success) {
                        let playlist = data.playlist;

                        response = await storeRequestSender.updatePlaylistById(playlist._id, playlist);
                        if (response.status === 200) {
                            const data = await response.json();
                            if (data.success) {
                                storeReducer({
                                    type: GlobalStoreActionType.SET_CURRENT_LIST,
                                    payload: playlist
                                });
                                setStore(prev => ({ ...prev, isEditingPlaylist: true }));
                            } else {
                                console.error("Failed to update playlist:", data);
                            }
                        } else {
                            console.error("Update playlist API call failed with status:", response.status);
                        }
                    } else {
                        console.error("Get playlist failed:", data);
                    }
                } else {
                    console.error("Get playlist API call failed with status:", response.status);
                    const errorData = await response.json();
                    console.error("Error details:", errorData);
                }
            } catch (error) {
                console.error("Error in asyncSetCurrentList:", error);
            }
        }
        asyncSetCurrentList(id);
    }

    // Update listens for a song locally in the current playlist
    store.incrementSongListenLocal = function (playlistId, youTubeId, newCount) {
        if (!store.currentList || store.currentList._id !== playlistId) return;
        const updated = { ...store.currentList };
        updated.songs = updated.songs.map(s => {
            if (s.youTubeId === youTubeId) {
                return { ...s, listens: newCount };
            }
            return s;
        });
        storeReducer({ type: GlobalStoreActionType.SET_CURRENT_LIST, payload: updated });
    }

    store.clearCurrentList = function() {
        storeReducer({
            type: GlobalStoreActionType.CLEAR_CURRENT_LIST,
            payload: {}
        });
    }

    // Load a playlist into currentList WITHOUT switching into edit mode
    store.loadPlaylistForModal = function(id) {
        async function asyncLoadPlaylist(id) {
            try {
                let response = await storeRequestSender.getPlaylistById(id);
                if (response.status === 200) {
                    const data = await response.json();
                    if (data.success) {
                        let playlist = data.playlist;
                        // debug log removed
                        storeReducer({
                            type: GlobalStoreActionType.SET_CURRENT_LIST,
                            payload: playlist
                        });
                    }
                }
            } catch (err) {
                console.error('Error loading playlist for modal:', err);
            }
        }
        asyncLoadPlaylist(id);
    }

    store.getPlaylistSize = function() {
        return store.currentList.songs.length;
    }
    store.addNewSong = function() {
        let index = this.getPlaylistSize();
        this.addCreateSongTransaction(index, "Untitled", "?", new Date().getFullYear(), "dQw4w9WgXcQ");
    }
    // THIS FUNCTION CREATES A NEW SONG IN THE CURRENT LIST
    // USING THE PROVIDED DATA AND PUTS THIS SONG AT INDEX
    store.createSong = function(index, song) {
        let list = store.currentList;
        list.songs.splice(index, 0, song);
        // NOW MAKE IT OFFICIAL
        store.updateCurrentList();
    }
    // THIS FUNCTION MOVES A SONG IN THE CURRENT LIST FROM
    // start TO end AND ADJUSTS ALL OTHER ITEMS ACCORDINGLY
    store.moveSong = function(start, end) {
        let list = store.currentList;

        // WE NEED TO UPDATE THE STATE FOR THE APP
        if (start < end) {
            let temp = list.songs[start];
            for (let i = start; i < end; i++) {
                list.songs[i] = list.songs[i + 1];
            }
            list.songs[end] = temp;
        }
        else if (start > end) {
            let temp = list.songs[start];
            for (let i = start; i > end; i--) {
                list.songs[i] = list.songs[i - 1];
            }
            list.songs[end] = temp;
        }

        // NOW MAKE IT OFFICIAL
        store.updateCurrentList();
    }
    // THIS FUNCTION REMOVES THE SONG AT THE index LOCATION
    // FROM THE CURRENT LIST
    store.removeSong = function(index) {
        let list = store.currentList;
        list.songs.splice(index, 1); 

        // NOW MAKE IT OFFICIAL
        store.updateCurrentList();
    }
    // THIS FUNCTION UPDATES THE TEXT IN THE ITEM AT index TO text
    store.updateSong = function(index, songData) {
        let list = store.currentList;
        let song = list.songs[index];
        song.title = songData.title;
        song.artist = songData.artist;
        song.year = songData.year;
        song.youTubeId = songData.youTubeId;

        // NOW MAKE IT OFFICIAL
        store.updateCurrentList();
    }
    store.addNewSong = () => {
        let playlistSize = store.getPlaylistSize();
        store.addCreateSongTransaction(
            playlistSize, "Untitled", "?", new Date().getFullYear(), "dQw4w9WgXcQ");
    }
    // THIS FUNCDTION ADDS A CreateSong_Transaction TO THE TRANSACTION STACK
    store.addCreateSongTransaction = (index, title, artist, year, youTubeId) => {
        // ADD A SONG ITEM AND ITS NUMBER
        let song = {
            title: title,
            artist: artist,
            year: year,
            youTubeId: youTubeId
        };
        let transaction = new CreateSong_Transaction(store, index, song);
        tps.processTransaction(transaction);
    }    
    store.addMoveSongTransaction = function (start, end) {
        let transaction = new MoveSong_Transaction(store, start, end);
        tps.processTransaction(transaction);
    }
    // THIS FUNCTION ADDS A RemoveSong_Transaction TO THE TRANSACTION STACK
    store.addRemoveSongTransaction = (song, index) => {
        //let index = store.currentSongIndex;
        //let song = store.currentList.songs[index];
        let transaction = new RemoveSong_Transaction(store, index, song);
        tps.processTransaction(transaction);
    }
    store.addUpdateSongTransaction = function (index, newSongData) {
        let song = store.currentList.songs[index];
        let oldSongData = {
            title: song.title,
            artist: song.artist,
            year: song.year,
            youTubeId: song.youTubeId
        };
        let transaction = new UpdateSong_Transaction(this, index, oldSongData, newSongData);        
        tps.processTransaction(transaction);
    }
    store.updateCurrentList = function() {
        async function asyncUpdateCurrentList() {
            const response = await storeRequestSender.updatePlaylistById(store.currentList._id, store.currentList);
            if (response.status === 200) {
                const data = await response.json();
                if (data.success) {
                    storeReducer({
                        type: GlobalStoreActionType.SET_CURRENT_LIST,
                        payload: store.currentList
                    });
                }
            }
        }
        asyncUpdateCurrentList();
    }
    store.undo = function () {
        tps.undoTransaction();
    }
    store.redo = function () {
        tps.doTransaction();
    }
    store.canAddNewSong = function() {
        return (store.currentList !== null);
    }
    store.canUndo = function() {
        return ((store.currentList !== null) && tps.hasTransactionToUndo());
    }
    store.canRedo = function() {
        return ((store.currentList !== null) && tps.hasTransactionToDo());
    }
    store.canClose = function() {
        return (store.currentList !== null);
    }

    // THIS FUNCTION ENABLES THE PROCESS OF EDITING A LIST NAME
    store.setIsListNameEditActive = function () {
        storeReducer({
            type: GlobalStoreActionType.SET_LIST_NAME_EDIT_ACTIVE,
            payload: null
        });
    }

    function KeyPress(event) {
        if (!store.modalOpen && event.ctrlKey){
            if(event.key === 'z'){
                store.undo();
            } 
            if(event.key === 'y'){
                store.redo();
            }
        }
    }
  
    document.onkeydown = (event) => KeyPress(event);

    return (
        <GlobalStoreContext.Provider value={{
            store
        }}>
            {props.children}
        </GlobalStoreContext.Provider>
    );
}

export default GlobalStoreContext;
export { GlobalStoreContextProvider };