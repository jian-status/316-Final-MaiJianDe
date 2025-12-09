const auth = require('../auth')
const indexModule = require('../index'); // DB instance

// Helper function to get db instance at runtime
const getDb = () => indexModule.db;

/*
    This is our back-end API. It provides all the data services
    our database needs. Note that this file contains the controller
    functions for each endpoint.
    
    @author McKilla Gorilla
*/
createPlaylist = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'Could not authorize'
        })
    }
    const body = req.body;
    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a Playlist',
        })
    }
    
    try {
        const user = await getDb().getUser(req.userId);
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'User not found'
            });
        }

        const playlist = await getDb().createPlaylist(body);
        
        return res.status(201).json({
            playlist: playlist
        });
    } catch (error) {
        console.error("Error creating playlist:", error);
        return res.status(400).json({
            errorMessage: `Could not create playlist: ${error.message}`
        });
    }
}
deletePlaylist = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'Could not authorize'
        })
    }
    
    try {
        
        const playlist = await getDb().getPlaylist(req.params.id);
        if (!playlist) {
            return res.status(200).json({
                message: 'Playlist not found or already deleted'
            });
        }
        
        
        const user = await getDb().getUserByEmail(playlist.ownerEmail);
        if (!user) {
            return res.status(400).json({
                errorMessage: 'deletePlaylist, Could not find user'
            });
        }
        
        
        if (user._id.toString() == req.userId) {
            await getDb().deletePlaylist(req.params.id);
            return res.status(200).json({});
        }
        else {
            return res.status(400).json({ 
                errorMessage: "authentication error" 
            });
        }
                
    } catch (error) {
        console.error("deletePlaylist, Could not delete playlist:", error);
        return res.status(400).json({
            errorMessage: 'deletePlaylist, Could not delete playlist'
        });
    }
}
getPlaylistById = async (req, res) => {
    try {

        const playlist = await getDb().getPlaylist(req.params.id);
        if (!playlist) {
            return res.status(400).json({ 
                success: false, 
                error: 'getPlaylistById, Could not find playlist' 
            });
        }
        return res.status(200).json({ success: true, playlist: playlist });
    } catch (error) {
        console.error("getPlaylistById: Could not get playlist:", error);
        return res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    }
}
getPlaylistPairs = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'Could not authorize'
        })
    }
    
    try {
        
        const user = await getDb().getUser(req.userId);
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'User not found'
            });
        }
        
        const playlists = await getDb().getPlaylistsByOwner(user.email);
        
        
        // PUT ALL THE LISTS INTO ID, NAME PAIRS
        let pairs = [];
        if (playlists && playlists.length > 0) {
            for (let playlist of playlists) {
                let pair = {
                    _id: playlist._id,
                    name: playlist.name
                };
                pairs.push(pair);
            }
        }
        return res.status(200).json({ success: true, idNamePairs: pairs });
        
    } catch (error) {
        console.error("getPlaylistPairs, Could not get playlist pairs:", error);
        return res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    }
}
getPlaylists = async (req, res) => {
    try {
        const playlists = await getDb().getAllPlaylists();
        return res.status(200).json({ success: true, data: playlists || [] });
    } catch (error) {
        console.error("getPlaylists: Could not get playlists:", error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
}

getLoggedInPlaylists = async (req, res) => {
    try {
        const userId = auth.verifyUser(req);
        if (userId) {
            const user = await getDb().getUser(userId);
            if (user) {
                const playlists = await getDb().getPlaylistsByOwner(user.email);
                return res.status(200).json({ success: true, data: playlists || [] });
            }
        }
        // If not logged in or user not found, return empty array
        return res.status(200).json({ success: true, data: [] });
    } catch (error) {
        console.error("getLoggedInPlaylists: Could not get playlists:", error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
}
updatePlaylist = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'Could not authorize'
        })
    }
    
    const body = req.body

    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'updatePlaylist: A body was not provided',
        })
    }

    try {
        const playlist = await getDb().getPlaylist(req.params.id);
        if (!playlist) {
            return res.status(404).json({
                message: 'updatePlaylist: Could not find playlist',
            });
        }
        

        // Check if this playlist belongs to this user
        const user = await getDb().getUserByEmail(playlist.ownerEmail);
        if (!user) {
            return res.status(400).json({
                success: false,
                description: 'updatePlaylist: Could not find user'
            });
        }
                
        if (user._id.toString() == req.userId) {
            

            const newPlaylist = {
                name: body.playlist.name,
                songs: body.playlist.songs
            };
            
            const DB_playlist = await getDb().updatePlaylist(req.params.id, newPlaylist);
            
            return res.status(200).json({
                success: true,
                id: DB_playlist._id,
                message: 'updatePlaylist: Updated playlist',
            });

        }
        else {
            return res.status(400).json({ 
                success: false, 
                description: "authentication error" 
            });
        }
                
    } catch (error) {
        console.error("updatePlaylist error: " + JSON.stringify(error));
        return res.status(404).json({
            error: error.message,
            message: 'updatePlaylist: Could not update playlist',
        });
    }
}
getSongsByPlaylist = async (req, res) => {
    try {
        const playlistId = req.params.playlistId;
        const playlist = await getDb().getPlaylist(playlistId);
        if (!playlist) {
            return res.status(404).json({
                success: false,
                error: 'Playlist not found'
            });
        }
        return res.status(200).json({ success: true, playlist: playlist });
    } catch (error) {
        console.error("getSongsByPlaylistId error:", error);
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
}

getSongCatalog = async (req, res) => {
    try {
        const songs = await getDb().filterSongCatalog(req.query);
        return res.status(200).json({ success: true, songs });
    } catch (error) {
        console.error('filterSongCatalog error:', error);
        return res.status(400).json({ success: false, error: error.message });
    }
}

getAllSongs = async (req, res) => {
    try {
        const songs = await getDb().getAllSongs();
        return res.status(200).json({ success: true, songs });
    } catch (error) {
        console.error('getAllSongs error:', error);
        return res.status(400).json({ success: false, error: error.message });
    }
}

incrementSongListen = async (req, res) => {
    try {
        const { playlistId, youTubeId, title, artist, year } = req.body;
        if (!playlistId) {
            return res.status(400).json({ success: false, error: 'playlistId is required' });
        }
        if (!youTubeId && !(title && artist)) {
            return res.status(400).json({ success: false, error: 'youTubeId or (title and artist) are required' });
        }
        const updatedSong = await getDb().incrementSongListen(playlistId, youTubeId, title, artist, year);
        return res.status(200).json({ success: true, song: updatedSong });
    } catch (error) {
        console.error('incrementSongListen error:', error);
        return res.status(400).json({ success: false, error: error.message });
    }
}

incrementSongPlaylistCount = async (req, res) => {
    try {
        const { youTubeId, title, artist, year } = req.body;
        if (!youTubeId && !(title && artist)) {
            return res.status(400).json({ success: false, error: 'youTubeId or (title and artist) are required' });
        }
        const updatedSong = await getDb().incrementSongPlaylistCount(youTubeId, title, artist, year);
        return res.status(200).json({ success: true, song: updatedSong });
    } catch (error) {
        console.error('incrementSongPlaylistCount error:', error);
        return res.status(400).json({ success: false, error: error.message });
    }
}

deleteSong = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'Could not authorize'
        })
    }
    try {
        const { youTubeId, title, artist, year } = req.body;
        if (!youTubeId && !(title && artist)) {
            return res.status(400).json({ success: false, error: 'youTubeId or (title and artist) are required' });
        }
        const result = await getDb().deleteSong(youTubeId, title, artist, year);
        return res.status(200).json({ success: true, deletedCount: result.deletedCount });
    } catch (error) {
        console.error('deleteSong error:', error);
        return res.status(400).json({ success: false, error: error.message });
    }
}

module.exports = {
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getPlaylistPairs,
    getPlaylists,
    getLoggedInPlaylists,
    updatePlaylist,
    getSongsByPlaylist,
    getSongCatalog,
    getAllSongs,
    incrementSongListen,
    incrementSongPlaylistCount,
    deleteSong,
}