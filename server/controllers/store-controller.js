const auth = require('../auth')
const { db } = require('../index'); // DB instance

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
    console.log("createPlaylist body: ", JSON.stringify(body));
    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a Playlist',
        })
    }
    
    try {
        console.log("Creating playlist:", JSON.stringify(body));
        const user = await db.getUser(req.userId);
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'User not found'
            });
        }

        const playlist = await db.createPlaylist(body);
        
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
        console.log("delete Playlist with id:", JSON.stringify(req.params.id));
        
        const playlist = await db.getPlaylist(req.params.id);
        if (!playlist) {
            console.log("deletePlaylist, playlist not found - might already be deleted");
            return res.status(200).json({
                message: 'Playlist not found or already deleted'
            });
        }
        
        console.log("pdeletePlaylist, laylist found: " + JSON.stringify(playlist));
        
        const user = await db.getUserByEmail(playlist.ownerEmail);
        if (!user) {
            return res.status(400).json({
                errorMessage: 'deletePlaylist, Could not find user'
            });
        }
        
        console.log("deletePlaylist, user._id: " + user._id);
        console.log("deletePlaylist, req.userId: " + req.userId);
        
        if (user._id.toString() == req.userId) {
            console.log("deletePlaylist, correct user!");
            await db.deletePlaylist(req.params.id);
            return res.status(200).json({});
        }
        else {
            console.log("deletePlaylist, incorrect user!");
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
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'Could not authorize'
        })
    }
    
    try {
        console.log("Find Playlist with id:", JSON.stringify(req.params.id));

        const playlist = await db.getPlaylist(req.params.id);
        if (!playlist) {
            return res.status(400).json({ 
                success: false, 
                error: 'getPlaylistById, Could not find playlist' 
            });
        }
        
        console.log("Found list: " + JSON.stringify(playlist));

        // Check if this playlist belongs to this user
        const user = await db.getUserByEmail(playlist.ownerEmail);
        if (!user) {
            return res.status(400).json({
                success: false,
                description: 'getPlaylistById: Could not find user'
            });
        }
        
        console.log("getPlaylistById, user._id: " + user._id);
        console.log("getPlaylistById, req.userId: " + req.userId);
        
        if (user._id.toString() == req.userId) {
            console.log("getPlaylistById, correct user!");
            return res.status(200).json({ success: true, playlist: playlist });
        }
        else {
            console.log("incorrect user!");
            return res.status(400).json({ 
                success: false, 
                description: "authentication error" 
            });
        }
        
        
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
        console.log("getPlaylistPairs: find user with id " + req.userId);
        
        const user = await db.getUser(req.userId);
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'User not found'
            });
        }
        
        console.log("getPlaylistPairs, Getting playlists for " + user.email);
        const playlists = await db.getPlaylistsByOwner(user.email);
        
        console.log("Found Playlists: " + JSON.stringify(playlists));
        
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
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'Could not authorize'
        })
    }
    
    try {
        const user = await db.getUser(req.userId);
        if (!user) {
            return res.status(400).json({
                success: false,
                error: 'getPlaylists: Could not find user'
            });
        }
        
        const playlists = await db.getPlaylistsByOwner(user.email);
        
        return res.status(200).json({ success: true, data: playlists || [] });
        
    } catch (error) {
        console.error("getPlaylists: Could not get playlists:", error);
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
    console.log("updatePlaylist: " + JSON.stringify(body));
    console.log("updatePlaylist, req.body.name: " + req.body.name);

    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'updatePlaylist: A body was not provided',
        })
    }

    try {
        const playlist = await db.getPlaylist(req.params.id);
        if (!playlist) {
            return res.status(404).json({
                message: 'updatePlaylist: Could not find playlist',
            });
        }
        
        console.log("updatePlaylist, found playlist: " + JSON.stringify(playlist));

        // Check if this playlist belongs to this user
        const user = await db.getUserByEmail(playlist.ownerEmail);
        if (!user) {
            return res.status(400).json({
                success: false,
                description: 'updatePlaylist: Could not find user'
            });
        }
        
        console.log("updatePlaylist, user._id: " + user._id);
        console.log("updatePlaylist, req.userId: " + req.userId);
        
        if (user._id.toString() == req.userId) {
            console.log("updatePlaylist, correct user!");
            console.log("updatePlaylist, req.body.name: " + req.body.name);

            const newPlaylist = {
                name: body.playlist.name,
                songs: body.playlist.songs
            };
            
            const DB_playlist = await db.updatePlaylist(req.params.id, newPlaylist);
            
            console.log("updatePlaylist: Updated playlist");
            return res.status(200).json({
                success: true,
                id: DB_playlist._id,
                message: 'updatePlaylist: Updated playlist',
            });

        }
        else {
            console.log("updatePlaylist, incorrect user!");
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
module.exports = {
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getPlaylistPairs,
    getPlaylists,
    updatePlaylist
}