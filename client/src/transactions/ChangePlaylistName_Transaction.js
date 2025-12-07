import { jsTPS_Transaction } from "jstps";

export default class ChangePlaylistName_Transaction extends jsTPS_Transaction {
    constructor(store, playlistId, oldName, newName) {
        super();
        this.store = store;
        this.playlistId = playlistId;
        this.oldName = oldName;
        this.newName = newName;
    }

    executeDo() {
        this.store.changeListName(this.playlistId, this.newName, false);
    }

    executeUndo() {
        this.store.changeListName(this.playlistId, this.oldName, false);
    }
}
